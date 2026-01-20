import "dotenv/config";
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { createClient, type ClientConfig, type SanityClient } from "@sanity/client";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

type MacroPercents = { protein: number; carbs: number; fat: number };
type SetEntry = { weight: number; reps: number; rpe?: number; actualReps?: number; actualDuration?: number; duration?: { value: number; unit: string } };
type ExerciseEntryInput = { exerciseId: string; sets: SetEntry[] };
type SessionInput = { day: string; time: string; label: string };
type WeekInput = { startDate: string; endDate: string; label: string };
type InjectPlanRequest = { planId: string; startDate: string; weekLabel: string };
type NutritionDayInput = { date: string; calories: number; macroPercents: MacroPercents };
type NutritionDayUpsert = { date: string; patch: { id?: string; date: string; calories: number; macroPercents: MacroPercents; meals: Array<{ id: string; dayId: string; type: string; macros: { protein: number; carbs: number; fat: number; calories: number } }> } };
type MealInput = { type: string; macros: { protein: number; carbs: number; fat: number; calories: number } };
type UserProfileInput = { displayName?: string; photoURL?: string; goalCalories?: number; macroPercents?: MacroPercents };

const sanityConfig: ClientConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || "",
  dataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN || process.env.VITE_SANITY_READ_TOKEN || "",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  useCdn: false,
};
const sanityClient: SanityClient = createClient(sanityConfig);

const app = express();
if (!getApps().length) {
  initializeApp();
}
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
app.use(corsMiddleware);
app.use(express.json());

type AuthenticatedRequest = express.Request & { user?: DecodedIdToken };

const requireAuth: express.RequestHandler = async (req, res, next) => {
  const header = req.get("Authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return jsonError(res, 401, "Missing Authorization token.");
  }
  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    (req as AuthenticatedRequest).user = decoded;
    return next();
  } catch (error) {
    return jsonError(res, 401, "Invalid or expired token.");
  }
};

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

const getUserId = (req: express.Request): string | null => {
  const email = (req as AuthenticatedRequest).user?.email;
  return email || null;
};

const requireOwner = async (
  res: express.Response,
  docId: string,
  userId: string,
  label: string
) => {
  const doc = await sanityClient.getDocument(docId);
  if (!doc) {
    jsonError(res, 404, `${label} not found.`);
    return null;
  }
  if ((doc as { userId?: string }).userId !== userId) {
    jsonError(res, 403, "Forbidden.");
    return null;
  }
  return doc as { userId?: string };
};

app.post("/tracker/weeks", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { startDate, endDate, label } = req.body as WeekInput;
  if (!startDate || !endDate || !label) {
    return jsonError(res, 400, "startDate, endDate, and label are required.");
  }
  const doc = await sanityClient.create({
    _type: "week",
    userId,
    startDate,
    endDate,
    label,
    sessions: [],
  });
  return res.status(201).json({
    id: doc._id,
    userId,
    startDate,
    endDate,
    label,
    sessions: [],
  });
});

app.post("/tracker/weeks/inject", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
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
  const sessionDocs: Array<{ id: string; userId: string; day: string; time: string; label: string; entries: Array<{ id: string; userId: string; exerciseId: string; sets: SetEntry[] }> }> = [];
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
          ...(ex.duration ? { duration: { value: ex.duration.value, unit: ex.duration.unit } } : {}),
        }));
        const entryId = uid("entry");
        tx.create({
          _id: entryId,
          _type: "exerciseEntry",
          userId,
          sessionId: ref(sessionId),
          exerciseId: ref(ex.exerciseId),
          sets,
        });
        return { id: entryId, userId, exerciseId: ex.exerciseId, sets };
      });

      tx.create({
        _id: sessionId,
        _type: "session",
        userId,
        day: day.day,
        time,
        label,
      });

      sessionRefs.push(ref(sessionId));
      sessionDocs.push({ id: sessionId, userId, day: day.day, time, label, entries: entryDocs });
    });
  });

  tx.create({
    _id: weekId,
    _type: "week",
    userId,
    startDate,
    endDate: endDate.toISOString().slice(0, 10),
    label: weekLabel,
    sessions: sessionRefs,
  });

  await tx.commit();

  return res.status(201).json({
    id: weekId,
    userId,
    startDate,
    endDate: endDate.toISOString().slice(0, 10),
    label: weekLabel,
    sessions: sessionDocs,
  });
});

app.delete("/tracker/weeks/:weekId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { weekId } = req.params as { weekId: string };
  const weekDoc = await requireOwner(res, weekId, userId, "Week");
  if (!weekDoc) return res;
  await sanityClient.delete(weekId);
  return res.status(204).send();
});

app.post("/tracker/weeks/:weekId/sessions", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { weekId } = req.params as { weekId: string };
  const weekDoc = await requireOwner(res, weekId, userId, "Week");
  if (!weekDoc) return res;
  const { day, time, label } = req.body as SessionInput;
  if (!day || !time || !label) {
    return jsonError(res, 400, "day, time, and label are required.");
  }
  const sessionId = uid("session");
  await sanityClient.create({
    _id: sessionId,
    _type: "session",
    userId,
    day,
    time,
    label,
  });
  await sanityClient
    .patch(weekId)
    .setIfMissing({ sessions: [] })
    .append("sessions", [ref(sessionId)])
    .commit();
  return res.status(201).json({ id: sessionId, userId, day, time, label, entries: [] });
});

app.patch("/tracker/sessions/:sessionId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { sessionId } = req.params as { sessionId: string };
  const sessionDoc = await requireOwner(res, sessionId, userId, "Session");
  if (!sessionDoc) return res;
  const patch = req.body as Partial<SessionInput>;
  const updated = await sanityClient.patch(sessionId).set(patch).commit();
  return res.status(200).json({
    id: updated._id,
    userId,
    day: updated.day,
    time: updated.time,
    label: updated.label,
    entries: [],
  });
});

app.delete("/tracker/sessions/:sessionId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { sessionId } = req.params as { sessionId: string };
  const sessionDoc = await requireOwner(res, sessionId, userId, "Session");
  if (!sessionDoc) return res;
  const weeks = await sanityClient.fetch(
    `*[_type == "week" && userId == $userId && references($sessionId)]{ _id }`,
    { sessionId, userId }
  );
  await Promise.all(
    (weeks || []).map((week: { _id: string }) =>
      sanityClient.patch(week._id).unset([`sessions[_ref=="${sessionId}"]`]).commit()
    )
  );
  await sanityClient.delete(sessionId);
  return res.status(204).send();
});

app.post("/tracker/sessions/:sessionId/entries", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { sessionId } = req.params as { sessionId: string };
  const sessionDoc = await requireOwner(res, sessionId, userId, "Session");
  if (!sessionDoc) return res;
  const { exerciseId, sets } = req.body as ExerciseEntryInput;
  if (!exerciseId || !sets) {
    return jsonError(res, 400, "exerciseId and sets are required.");
  }
  const entryId = uid("entry");
  await sanityClient.create({
    _id: entryId,
    _type: "exerciseEntry",
    userId,
    sessionId: ref(sessionId),
    exerciseId: ref(exerciseId),
    sets,
  });
  return res.status(201).json({ id: entryId, userId, exerciseId, sets });
});

app.patch("/tracker/entries/:entryId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { entryId } = req.params as { entryId: string };
  const entryDoc = await requireOwner(res, entryId, userId, "Exercise entry");
  if (!entryDoc) return res;
  const patch = req.body as Partial<ExerciseEntryInput>;
  const updated = await sanityClient.patch(entryId).set({
    ...(patch.exerciseId ? { exerciseId: ref(patch.exerciseId) } : {}),
    ...(patch.sets ? { sets: patch.sets } : {}),
  }).commit();
  return res.status(200).json({
    id: updated._id,
    userId,
    exerciseId: updated.exerciseId?._ref || patch.exerciseId,
    sets: updated.sets || [],
  });
});

app.delete("/tracker/entries/:entryId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { entryId } = req.params as { entryId: string };
  const entryDoc = await requireOwner(res, entryId, userId, "Exercise entry");
  if (!entryDoc) return res;
  await sanityClient.delete(entryId);
  return res.status(204).send();
});

app.post("/nutrition/days", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { date, calories, macroPercents } = req.body as NutritionDayInput;
  if (!date || calories === undefined || !macroPercents) {
    return jsonError(res, 400, "date, calories, and macroPercents are required.");
  }
  const macroGoals = computeMacroGoals(calories, macroPercents);
  const doc = await sanityClient.create({
    _type: "nutritionDay",
    userId,
    date,
    macroGoals,
    macroPercents,
  });
  return res.status(201).json({
    id: doc._id,
    userId,
    date,
    calories,
    macroPercents,
    meals: [],
  });
});

app.post("/nutrition/days/upsert", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { date, patch } = req.body as NutritionDayUpsert;
  if (!date || !patch) {
    return jsonError(res, 400, "date and patch are required.");
  }
  const macroGoals = computeMacroGoals(patch.calories, patch.macroPercents);
  let dayId: string | null = patch.id ?? null;
  if (!dayId) {
    const existing = await sanityClient.fetch(
      `*[_type == "nutritionDay" && userId == $userId && date == $date][0]{ _id }`,
      { date, userId }
    );
    dayId = existing?._id ?? uid("nutritionDay");
  }
  if (!dayId) {
    return jsonError(res, 500, "Unable to resolve nutrition day id.");
  }
  const existingDoc = await sanityClient.getDocument(dayId);
  if (existingDoc && (existingDoc as { userId?: string }).userId !== userId) {
    return jsonError(res, 403, "Forbidden.");
  }
  await sanityClient.createOrReplace({
    _id: dayId,
    _type: "nutritionDay",
    userId,
    date: patch.date,
    macroGoals,
    macroPercents: patch.macroPercents,
  });

  const meals = patch.meals || [];
  const existingMeals = await sanityClient.fetch(
    `*[_type == "meal" && userId == $userId && dayId._ref == $dayId]{ _id }`,
    { dayId, userId }
  );
  const existingIds = new Set((existingMeals || []).map((meal: { _id: string }) => meal._id));
  const nextIds = new Set(meals.map(meal => meal.id));
  await Promise.all(
    meals.map(meal =>
      sanityClient.createOrReplace({
        _id: meal.id,
        _type: "meal",
        userId,
        dayId: ref(dayId),
        type: meal.type,
        macros: meal.macros,
      })
    )
  );
  const toDelete = [...existingIds].filter(id => !nextIds.has((id as string)));
  await Promise.all(toDelete.map(id => sanityClient.delete((id as string))));
  const responseMeals = meals.map(meal => ({
    ...meal,
    userId,
  }));

  return res.status(200).json({
    id: dayId,
    userId,
    date: patch.date,
    calories: patch.calories,
    macroPercents: patch.macroPercents,
    meals: responseMeals,
  });
});

app.patch("/nutrition/days/:dayId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { dayId } = req.params as { dayId: string };
  const dayDoc = await requireOwner(res, dayId, userId, "Nutrition day");
  if (!dayDoc) return res;
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
    userId,
    date,
    calories,
    macroPercents,
    meals: [],
  });
});

app.delete("/nutrition/days/:dayId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { dayId } = req.params as { dayId: string };
  const dayDoc = await requireOwner(res, dayId, userId, "Nutrition day");
  if (!dayDoc) return res;
  const meals = await sanityClient.fetch(
    `*[_type == "meal" && userId == $userId && dayId._ref == $dayId]{ _id }`,
    { dayId, userId }
  );
  await Promise.all((meals || []).map((meal: { _id: string }) => sanityClient.delete(meal._id)));
  await sanityClient.delete(dayId);
  return res.status(204).send();
});

app.post("/nutrition/days/:dayId/meals", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { dayId } = req.params as { dayId: string };
  const dayDoc = await requireOwner(res, dayId, userId, "Nutrition day");
  if (!dayDoc) return res;
  const { type, macros } = req.body as MealInput;
  if (!type || !macros) {
    return jsonError(res, 400, "type and macros are required.");
  }
  const mealId = uid("meal");
  await sanityClient.create({
    _id: mealId,
    _type: "meal",
    userId,
    dayId: ref(dayId),
    type,
    macros,
  });
  return res.status(201).json({ id: mealId, userId, dayId, type, macros });
});

app.patch("/nutrition/meals/:mealId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { mealId } = req.params as { mealId: string };
  const mealDoc = await requireOwner(res, mealId, userId, "Meal");
  if (!mealDoc) return res;
  const patch = req.body as MealInput;
  const updated = await sanityClient.patch(mealId).set(patch).commit();
  return res.status(200).json({
    id: updated._id,
    userId,
    dayId: updated.dayId?._ref,
    type: updated.type,
    macros: updated.macros,
  });
});

app.delete("/nutrition/meals/:mealId", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { mealId } = req.params as { mealId: string };
  const mealDoc = await requireOwner(res, mealId, userId, "Meal");
  if (!mealDoc) return res;
  await sanityClient.delete(mealId);
  return res.status(204).send();
});

app.get("/users/me", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const profile = await sanityClient.fetch(
    `*[_type == "userProfile" && userId == $userId][0]{
      "id": _id,
      userId,
      email,
      displayName,
      photoURL,
      goalCalories,
      macroPercents
    }`,
    { userId }
  );
  if (!profile) {
    return jsonError(res, 404, "User profile not found.");
  }
  return res.status(200).json(profile);
});

app.post("/users/me", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { displayName, photoURL, goalCalories, macroPercents } = req.body as UserProfileInput;
  const incomingName = displayName || (req as AuthenticatedRequest).user?.name || "";
  const incomingPhoto = photoURL || (req as AuthenticatedRequest).user?.picture || "";
  const now = new Date().toISOString();
  const existing = await sanityClient.fetch(
    `*[_type == "userProfile" && userId == $userId][0]{ _id, createdAt, goalCalories, macroPercents }`,
    { userId }
  );
  const docId = existing?._id ?? uid("user");
  const createdAt = existing?.createdAt ?? now;
  const nextGoalCalories = goalCalories ?? existing?.goalCalories ?? null;
  const nextMacroPercents = macroPercents ?? existing?.macroPercents ?? null;
  await sanityClient.createOrReplace({
    _id: docId,
    _type: "userProfile",
    userId,
    email: userId,
    displayName: incomingName,
    photoURL: incomingPhoto,
    goalCalories: nextGoalCalories,
    macroPercents: nextMacroPercents,
    createdAt,
    updatedAt: now,
  });
  return res.status(200).json({
    id: docId,
    userId,
    email: userId,
    displayName: incomingName,
    photoURL: incomingPhoto,
    goalCalories: nextGoalCalories,
    macroPercents: nextMacroPercents,
  });
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
