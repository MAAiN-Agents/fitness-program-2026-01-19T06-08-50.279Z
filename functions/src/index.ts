import "dotenv/config";
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { createClient, type ClientConfig, type SanityClient } from "@sanity/client";

type MacroPercents = { protein: number; carbs: number; fat: number };
type SetEntry = { weight: number; reps: number; rpe: number; duration?: { value: number; unit: string } };
type ExerciseEntryInput = { exerciseId: string; sets: SetEntry[] };
type SessionInput = { day: string; time: string; label: string };
type WeekInput = { startDate: string; endDate: string; label: string };
type InjectPlanRequest = { planId: string; startDate: string; weekLabel: string };
type NutritionDayInput = { date: string; calories: number; macroPercents: MacroPercents };
type NutritionDayUpsert = { date: string; patch: { id?: string; date: string; calories: number; macroPercents: MacroPercents; meals: Array<{ id: string; dayId: string; type: string; macros: { protein: number; carbs: number; fat: number; calories: number } }> } };
type MealInput = { type: string; macros: { protein: number; carbs: number; fat: number; calories: number } };

const sanityConfig: ClientConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || "",
  dataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN || process.env.VITE_SANITY_READ_TOKEN || "",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  useCdn: false,
};
const sanityClient: SanityClient = createClient(sanityConfig);

const app = express();
const corsMiddleware = cors({
  origin: [
    "https://nomadic-fitness.web.app",
    "https://nomadic-fitness.firebaseapp.com",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS", "HEAD"],
  preflightContinue: false,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});
app.options("*", corsMiddleware);

const uid = (prefix = "doc") => `${prefix}-${crypto.randomUUID()}`;
const ref = (id: string) => ({ _type: "reference", _ref: id });

const computeMacroGoals = (calories: number, percents: MacroPercents) => ({
  calories,
  protein: Math.round((calories * percents.protein) / 100 / 4),
  carbs: Math.round((calories * percents.carbs) / 100 / 4),
  fat: Math.round((calories * percents.fat) / 100 / 9),
});

const jsonError = (res: express.Response, status: number, message: string) =>
  res.status(status).json({ error: message });

app.post("/tracker/weeks", async (req, res) => {
  const { startDate, endDate, label } = req.body as WeekInput;
  if (!startDate || !endDate || !label) {
    return jsonError(res, 400, "startDate, endDate, and label are required.");
  }
  const doc = await sanityClient.create({
    _type: "week",
    startDate,
    endDate,
    label,
    sessions: [],
  });
  return res.status(201).json({
    id: doc._id,
    startDate,
    endDate,
    label,
    sessions: [],
  });
});

app.post("/tracker/weeks/inject", async (req, res) => {
  const { planId, startDate, weekLabel } = req.body as InjectPlanRequest;
  if (!planId || !startDate || !weekLabel) {
    return jsonError(res, 400, "planId, startDate, and weekLabel are required.");
  }
  const plan = await sanityClient.fetch(
    `*[_type == "plan" && _id == $planId][0]{
      "id": _id,
      chart[]{
        day,
        sessions[]{
          label,
          exercises[]{
            "exerciseId": exerciseId._ref,
            sets,
            reps,
            duration
          }
        }
      }
    }`,
    { planId }
  );
  if (!plan) {
    return jsonError(res, 404, "Plan not found.");
  }

  const endDate = new Date(`${startDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + 6);
  const weekId = uid("week");
  const sessionDocs: Array<{ id: string; day: string; time: string; label: string; entries: Array<{ id: string; exerciseId: string; sets: SetEntry[] }> }> = [];
  const sessionRefs: Array<{ _type: string; _ref: string }> = [];

  const tx = sanityClient.transaction();

  plan.chart.forEach((day: { day: string; sessions: Array<{ label: string; exercises: Array<{ exerciseId: string; sets?: number; reps?: number; duration?: { value: number; unit: string } }> }> }) => {
    day.sessions.forEach(session => {
      const sessionId = uid("session");
      const timeMatch = session.label.match(/\b(AM|PM)\b/i);
      const time = timeMatch ? timeMatch[1].toUpperCase() : "AM";
      const label = session.label.replace(/\s*\b(AM|PM)\b/i, "").trim() || session.label;

      const entryDocs = session.exercises.map(ex => {
        const setCount = ex.sets || 1;
        const sets = Array.from({ length: setCount }, () => ({
          weight: 0,
          reps: ex.reps || 0,
          rpe: 0,
          ...(ex.duration ? { duration: { value: ex.duration.value, unit: ex.duration.unit } } : {}),
        }));
        const entryId = uid("entry");
        tx.create({
          _id: entryId,
          _type: "exerciseEntry",
          sessionId: ref(sessionId),
          exerciseId: ref(ex.exerciseId),
          sets,
        });
        return { id: entryId, exerciseId: ex.exerciseId, sets };
      });

      tx.create({
        _id: sessionId,
        _type: "session",
        day: day.day,
        time,
        label,
      });

      sessionRefs.push(ref(sessionId));
      sessionDocs.push({ id: sessionId, day: day.day, time, label, entries: entryDocs });
    });
  });

  tx.create({
    _id: weekId,
    _type: "week",
    startDate,
    endDate: endDate.toISOString().slice(0, 10),
    label: weekLabel,
    sessions: sessionRefs,
  });

  await tx.commit();

  return res.status(201).json({
    id: weekId,
    startDate,
    endDate: endDate.toISOString().slice(0, 10),
    label: weekLabel,
    sessions: sessionDocs,
  });
});

app.delete("/tracker/weeks/:weekId", async (req, res) => {
  const { weekId } = req.params as { weekId: string };
  await sanityClient.delete(weekId);
  return res.status(204).send();
});

app.post("/tracker/weeks/:weekId/sessions", async (req, res) => {
  const { weekId } = req.params as { weekId: string };
  const { day, time, label } = req.body as SessionInput;
  if (!day || !time || !label) {
    return jsonError(res, 400, "day, time, and label are required.");
  }
  const sessionId = uid("session");
  await sanityClient.create({
    _id: sessionId,
    _type: "session",
    day,
    time,
    label,
  });
  await sanityClient
    .patch(weekId)
    .setIfMissing({ sessions: [] })
    .append("sessions", [ref(sessionId)])
    .commit();
  return res.status(201).json({ id: sessionId, day, time, label, entries: [] });
});

app.patch("/tracker/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const patch = req.body as Partial<SessionInput>;
  const updated = await sanityClient.patch(sessionId).set(patch).commit();
  return res.status(200).json({
    id: updated._id,
    day: updated.day,
    time: updated.time,
    label: updated.label,
    entries: [],
  });
});

app.delete("/tracker/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const weeks = await sanityClient.fetch(`*[_type == "week" && references($sessionId)]{ _id }`, { sessionId });
  await Promise.all(
    (weeks || []).map((week: { _id: string }) =>
      sanityClient.patch(week._id).unset([`sessions[_ref=="${sessionId}"]`]).commit()
    )
  );
  await sanityClient.delete(sessionId);
  return res.status(204).send();
});

app.post("/tracker/sessions/:sessionId/entries", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const { exerciseId, sets } = req.body as ExerciseEntryInput;
  if (!exerciseId || !sets) {
    return jsonError(res, 400, "exerciseId and sets are required.");
  }
  const entryId = uid("entry");
  await sanityClient.create({
    _id: entryId,
    _type: "exerciseEntry",
    sessionId: ref(sessionId),
    exerciseId: ref(exerciseId),
    sets,
  });
  return res.status(201).json({ id: entryId, exerciseId, sets });
});

app.patch("/tracker/entries/:entryId", async (req, res) => {
  const { entryId } = req.params as { entryId: string };
  const patch = req.body as Partial<ExerciseEntryInput>;
  const updated = await sanityClient.patch(entryId).set({
    ...(patch.exerciseId ? { exerciseId: ref(patch.exerciseId) } : {}),
    ...(patch.sets ? { sets: patch.sets } : {}),
  }).commit();
  return res.status(200).json({
    id: updated._id,
    exerciseId: updated.exerciseId?._ref || patch.exerciseId,
    sets: updated.sets || [],
  });
});

app.delete("/tracker/entries/:entryId", async (req, res) => {
  const { entryId } = req.params as { entryId: string };
  await sanityClient.delete(entryId);
  return res.status(204).send();
});

app.post("/nutrition/days", async (req, res) => {
  const { date, calories, macroPercents } = req.body as NutritionDayInput;
  if (!date || calories === undefined || !macroPercents) {
    return jsonError(res, 400, "date, calories, and macroPercents are required.");
  }
  const macroGoals = computeMacroGoals(calories, macroPercents);
  const doc = await sanityClient.create({
    _type: "nutritionDay",
    date,
    macroGoals,
    macroPercents,
  });
  return res.status(201).json({
    id: doc._id,
    date,
    calories,
    macroPercents,
    meals: [],
  });
});

app.post("/nutrition/days/upsert", async (req, res) => {
  const { date, patch } = req.body as NutritionDayUpsert;
  if (!date || !patch) {
    return jsonError(res, 400, "date and patch are required.");
  }
  const macroGoals = computeMacroGoals(patch.calories, patch.macroPercents);
  let dayId: string | null = patch.id ?? null;
  if (!dayId) {
    const existing = await sanityClient.fetch(`*[_type == "nutritionDay" && date == $date][0]{ _id }`, { date });
    dayId = existing?._id ?? uid("nutritionDay");
  }
  if (!dayId) {
    return jsonError(res, 500, "Unable to resolve nutrition day id.");
  }
  await sanityClient.createOrReplace({
    _id: dayId,
    _type: "nutritionDay",
    date: patch.date,
    macroGoals,
    macroPercents: patch.macroPercents,
  });

  const meals = patch.meals || [];
  const existingMeals = await sanityClient.fetch(`*[_type == "meal" && dayId._ref == $dayId]{ _id }`, { dayId });
  const existingIds = new Set((existingMeals || []).map((meal: { _id: string }) => meal._id));
  const nextIds = new Set(meals.map(meal => meal.id));
  await Promise.all(
    meals.map(meal =>
      sanityClient.createOrReplace({
        _id: meal.id,
        _type: "meal",
        dayId: ref(dayId),
        type: meal.type,
        macros: meal.macros,
      })
    )
  );
  const toDelete = [...existingIds].filter(id => !nextIds.has((id as string)));
  await Promise.all(toDelete.map(id => sanityClient.delete((id as string))));

  return res.status(200).json({
    id: dayId,
    date: patch.date,
    calories: patch.calories,
    macroPercents: patch.macroPercents,
    meals,
  });
});

app.patch("/nutrition/days/:dayId", async (req, res) => {
  const { dayId } = req.params as { dayId: string };
  const { date, calories, macroPercents } = req.body as NutritionDayInput;
  if (!date || calories === undefined || !macroPercents) {
    return jsonError(res, 400, "date, calories, and macroPercents are required.");
  }
  const macroGoals = computeMacroGoals(calories, macroPercents);
  const updated = await sanityClient.patch(dayId).set({
    date,
    macroGoals,
    macroPercents,
  }).commit();
  return res.status(200).json({
    id: updated._id,
    date,
    calories,
    macroPercents,
    meals: [],
  });
});

app.delete("/nutrition/days/:dayId", async (req, res) => {
  const { dayId } = req.params as { dayId: string };
  const meals = await sanityClient.fetch(`*[_type == "meal" && dayId._ref == $dayId]{ _id }`, { dayId });
  await Promise.all((meals || []).map((meal: { _id: string }) => sanityClient.delete(meal._id)));
  await sanityClient.delete(dayId);
  return res.status(204).send();
});

app.post("/nutrition/days/:dayId/meals", async (req, res) => {
  const { dayId } = req.params as { dayId: string };
  const { type, macros } = req.body as MealInput;
  if (!type || !macros) {
    return jsonError(res, 400, "type and macros are required.");
  }
  const mealId = uid("meal");
  await sanityClient.create({
    _id: mealId,
    _type: "meal",
    dayId: ref(dayId),
    type,
    macros,
  });
  return res.status(201).json({ id: mealId, dayId, type, macros });
});

app.patch("/nutrition/meals/:mealId", async (req, res) => {
  const { mealId } = req.params as { mealId: string };
  const patch = req.body as MealInput;
  const updated = await sanityClient.patch(mealId).set(patch).commit();
  return res.status(200).json({
    id: updated._id,
    dayId: updated.dayId?._ref,
    type: updated.type,
    macros: updated.macros,
  });
});

app.delete("/nutrition/meals/:mealId", async (req, res) => {
  const { mealId } = req.params as { mealId: string };
  await sanityClient.delete(mealId);
  return res.status(204).send();
});

const firebaseHandler = (request: express.Request, response: express.Response) =>
  corsMiddleware(request, response, async () => {
    try {
      if (request.method === "OPTIONS") {
        response.status(204).send();
        return;
      }
      await new Promise<void>((resolve, reject) => {
        app(request, response, err => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error("Unhandled error in Firebase handler:", error);
      if (!response.headersSent) {
        response.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

export const api = functions.https.onRequest(firebaseHandler);
