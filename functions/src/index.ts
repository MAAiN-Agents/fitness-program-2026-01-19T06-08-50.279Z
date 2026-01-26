import "dotenv/config";
import * as functions from "firebase-functions";
import express from "express";
import Stripe from "stripe";
import cors from "cors";
import busboy from "busboy";
import { createClient, type ClientConfig, type SanityClient } from "@sanity/client";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { createExerciseApiRouter } from "./exercise-api-ninjas/exerciseApiController";

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
type ProgressEntryInput = { date?: string; weight?: number; coverIndex?: number };

const sanityConfig: ClientConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || "",
  dataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN || process.env.VITE_SANITY_READ_TOKEN || "",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  useCdn: false,
};
const sanityClient: SanityClient = createClient(sanityConfig);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const app = express();
if (!getApps().length) {
  initializeApp();
}
const corsMiddleware = cors({
  origin: [
    "https://nomadic-fitness.web.app",
    "https://nomad-fitness.sanity.studio",
    "https://nomadic-fitness.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:3333",
  ],
  credentials: true,
  methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS", "HEAD"],
  preflightContinue: false,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});
app.options("*", corsMiddleware);
app.use(corsMiddleware);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);

const parseProgressUpload = (req: express.Request) =>
  new Promise<{
    fields: Record<string, string>;
    files: Array<{ buffer: Buffer; filename?: string; mimeType?: string; size: number }>;
  }>((resolve, reject) => {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      reject(new Error("Upload must be multipart/form-data."));
      return;
    }
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: 15 * 1024 * 1024, files: 10 },
    });
    const fields: Record<string, string> = {};
    const files: Array<{ buffer: Buffer; filename?: string; mimeType?: string; size: number }> = [];

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (fieldname, file, info) => {
      if (fieldname !== "photo" && fieldname !== "photos") {
        file.resume();
        return;
      }
      const incomingFilename = info?.filename;
      const incomingMimeType = info?.mimeType;
      const chunks: Buffer[] = [];
      let size = 0;
      file.on("data", chunk => {
        chunks.push(chunk);
        size += chunk.length;
      });
      file.on("limit", () => {
        reject(new Error("Photo exceeds 15MB limit."));
      });
      file.on("end", () => {
        files.push({
          buffer: Buffer.concat(chunks),
          filename: incomingFilename,
          mimeType: incomingMimeType,
          size,
        });
      });
      file.on("error", err => {
        reject(err);
      });
    });

    bb.on("filesLimit", () => {
      reject(new Error("Too many files."));
    });
    bb.on("error", err => {
      reject(err);
    });
    bb.on("close", () => {
      resolve({ fields, files });
    });

    const rawBody = (req as { rawBody?: Buffer }).rawBody;
    if (rawBody) {
      bb.end(rawBody);
    } else {
      req.pipe(bb);
    }
  });

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

app.use("/exercise-api", createExerciseApiRouter({ sanityClient, requireAuth }));

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

const getFirebaseUid = (req: express.Request): string | null => {
  const uidValue = (req as AuthenticatedRequest).user?.uid;
  return uidValue || null;
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
  const firebaseUid = getFirebaseUid(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const profile = await sanityClient.fetch(
    `*[_type == "userProfile" && userId == $userId][0]{
      "id": _id,
      userId,
      email,
      firebaseUid,
      displayName,
      photoURL,
      goalCalories,
      macroPercents,
      "purchasedPdfs": purchasedPdfs[]->{
        "id": _id,
        title,
        format,
        "fileUrl": file.asset->url
      }
    }`,
    { userId, firebaseUid }
  );
  if (!profile) {
    return jsonError(res, 404, "User profile not found.");
  }
  return res.status(200).json(profile);
});

app.post("/users/me", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const firebaseUid = getFirebaseUid(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { displayName, photoURL, goalCalories, macroPercents } = req.body as UserProfileInput;
  const incomingName = displayName || (req as AuthenticatedRequest).user?.name || "";
  const incomingPhoto = photoURL || (req as AuthenticatedRequest).user?.picture || "";
  const now = new Date().toISOString();
  const existing = await sanityClient.fetch(
    `*[_type == "userProfile" && userId == $userId][0]{
      _id,
      createdAt,
      goalCalories,
      macroPercents,
      purchasedPdfs
    }`,
    { userId }
  );
  const docId = existing?._id ?? uid("user");
  const createdAt = existing?.createdAt ?? now;
  const nextGoalCalories = goalCalories ?? existing?.goalCalories ?? null;
  const nextMacroPercents = macroPercents ?? existing?.macroPercents ?? null;
  const nextPurchasedPdfs = existing?.purchasedPdfs ?? [];
  await sanityClient.createOrReplace({
    _id: docId,
    _type: "userProfile",
    userId,
    email: userId,
    firebaseUid: firebaseUid || undefined,
    displayName: incomingName,
    photoURL: incomingPhoto,
    goalCalories: nextGoalCalories,
    macroPercents: nextMacroPercents,
    purchasedPdfs: nextPurchasedPdfs,
    createdAt,
    updatedAt: now,
  });
  const profile = await sanityClient.fetch(
    `*[_type == "userProfile" && _id == $docId][0]{
      "id": _id,
      userId,
      email,
      firebaseUid,
      displayName,
      photoURL,
      goalCalories,
      macroPercents,
      "purchasedPdfs": purchasedPdfs[]->{
        "id": _id,
        title,
        format,
        "fileUrl": file.asset->url
      }
    }`,
    { docId }
  );
  return res.status(200).json(profile);
});

app.post("/purchase", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const firebaseUid = getFirebaseUid(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const { sessionId, pdfId, origin } = req.body as { sessionId?: string; pdfId?: string; origin?: string };
  if (!pdfId) {
    return jsonError(res, 400, "pdfId is required.");
  }
  const pdfDoc = await sanityClient.getDocument(pdfId);
  if (!pdfDoc) {
    return jsonError(res, 404, "PDF not found.");
  }
  const profile = await sanityClient.fetch(
    `*[_type == "userProfile" && (userId == $userId || firebaseUid == $firebaseUid)][0]{
      _id,
      purchasedPdfs
    }`,
    { userId, firebaseUid }
  );
  const now = new Date().toISOString();
  const profileId = profile?._id ?? uid("user");
  const purchasedRefs = (profile?.purchasedPdfs as Array<{ _ref: string }> | undefined) || [];
  const alreadyPurchased = purchasedRefs.some(refItem => refItem?._ref === pdfId);
  if (!profile) {
    await sanityClient.create({
      _id: profileId,
      _type: "userProfile",
      userId,
      email: userId,
      firebaseUid: firebaseUid || undefined,
      purchasedPdfs: [ref(pdfId)],
      createdAt: now,
      updatedAt: now,
      lastPurchaseSessionId: sessionId || undefined,
      lastPurchaseOrigin: origin || undefined,
    });
  } else if (!alreadyPurchased) {
    await sanityClient
      .patch(profileId)
      .setIfMissing({ purchasedPdfs: [] })
      .insert("after", "purchasedPdfs[-1]", [ref(pdfId)])
      .set({
        updatedAt: now,
        lastPurchaseSessionId: sessionId || undefined,
        lastPurchaseOrigin: origin || undefined,
      })
      .commit();
  } else {
    await sanityClient
      .patch(profileId)
      .set({
        updatedAt: now,
        lastPurchaseSessionId: sessionId || undefined,
        lastPurchaseOrigin: origin || undefined,
      })
      .commit();
  }
  const updatedProfile = await sanityClient.fetch(
    `*[_type == "userProfile" && _id == $profileId][0]{
      "id": _id,
      userId,
      email,
      firebaseUid,
      displayName,
      photoURL,
      goalCalories,
      macroPercents,
      "purchasedPdfs": purchasedPdfs[]->{
        "id": _id,
        title,
        format,
        "fileUrl": file.asset->url
      }
    }`,
    { profileId }
  );
  return res.status(200).json(updatedProfile);
});

app.post("/payments/pdfCheckoutCompleted", async (req, res) => {
  const sig = req.get("stripe-signature");
  const rawBody = (req as { rawBody?: Buffer }).rawBody;
  if (!sig || !rawBody) {
    return res.status(400).send("Webhook Error");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET.");
    return res.status(500).send("Webhook Error");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook signature verification failed.", error);
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.customer_email || undefined;
    const firebaseUid = session.client_reference_id || undefined;
    const metadata = session.metadata || {};
    let productId =
      metadata.productId ||
      metadata.product_id ||
      metadata.planPdfProductId ||
      metadata.pdfProductId ||
      metadata.buyButtonProductId;

    if (!productId) {
      const lineItems = (session as Stripe.Checkout.Session & {
        line_items?: { data?: Array<{ price?: { product?: string | Stripe.Product } }> };
      }).line_items;
      const productValue = lineItems?.data?.[0]?.price?.product;
      if (typeof productValue === "string") {
        productId = productValue;
      } else if (productValue && typeof productValue === "object" && "id" in productValue) {
        productId = productValue.id;
      }
    }

    if (!productId) {
      console.warn("Stripe session missing productId metadata.");
      return res.status(200).json({ received: true, status: "missing_product_id" });
    }

    const pdfDoc = await sanityClient.fetch(
      `*[_type == "planPdf" && buyButtonProductId == $productId][0]{ _id }`,
      { productId }
    );
    if (!pdfDoc?._id) {
      console.warn("No planPdf found for productId.", productId);
      return res.status(200).json({ received: true, status: "pdf_not_found" });
    }

    const identifier = email || firebaseUid;
    if (!identifier) {
      console.warn("Stripe session missing customer identifiers.");
      return res.status(200).json({ received: true, status: "missing_customer" });
    }

    const profile = await sanityClient.fetch(
      `*[_type == "userProfile" && (email == $email || userId == $email || firebaseUid == $firebaseUid)][0]{
        _id,
        purchasedPdfs
      }`,
      { email, firebaseUid }
    );

    const now = new Date().toISOString();
    const profileId = profile?._id ?? uid("user");
    const purchasedRefs = (profile?.purchasedPdfs as Array<{ _ref: string }> | undefined) || [];
    const alreadyPurchased = purchasedRefs.some(refItem => refItem?._ref === pdfDoc._id);
    if (!profile) {
      await sanityClient.create({
        _id: profileId,
        _type: "userProfile",
        userId: email || identifier,
        email: email || identifier,
        firebaseUid: firebaseUid || undefined,
        purchasedPdfs: [ref(pdfDoc._id)],
        createdAt: now,
        updatedAt: now,
        lastPurchaseSessionId: session.id,
      });
    } else if (!alreadyPurchased) {
      await sanityClient
        .patch(profileId)
        .setIfMissing({ purchasedPdfs: [] })
        .insert("after", "purchasedPdfs[-1]", [ref(pdfDoc._id)])
        .set({
          updatedAt: now,
          lastPurchaseSessionId: session.id,
        })
        .commit();
    } else {
      await sanityClient
        .patch(profileId)
        .set({ updatedAt: now, lastPurchaseSessionId: session.id })
        .commit();
    }
  }

  return res.status(200).json({ received: true });
});

const isoToSeconds = (iso: string): number => {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
};

app.get("/youtubeSearch", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return jsonError(res, 400, 'Missing query param "q".');
    }
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    if (!apiKey) {
      return jsonError(res, 500, "YouTube API key is not configured.");
    }
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.search = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "5",
      key: apiKey,
    }).toString();
    const searchResponse = await fetch(searchUrl.toString());
    const searchData = (await searchResponse.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
        };
      }>;
    };
    if (!searchResponse.ok) {
      return jsonError(res, searchResponse.status, "YouTube search failed.");
    }
    const items = Array.isArray(searchData.items) ? searchData.items : [];
    const videoIds = items.map((item: { id?: { videoId?: string } }) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      return res.status(200).json([]);
    }
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.search = new URLSearchParams({
      part: "contentDetails",
      id: videoIds.join(","),
      key: apiKey,
    }).toString();
    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = (await detailsResponse.json()) as {
      items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
    };
    if (!detailsResponse.ok) {
      return jsonError(res, detailsResponse.status, "YouTube details failed.");
    }
    const durationMap: Record<string, number> = {};
    const detailItems = Array.isArray(detailsData.items) ? detailsData.items : [];
    detailItems.forEach((item: { id: string; contentDetails?: { duration?: string } }) => {
      const iso = item.contentDetails?.duration || "";
      durationMap[item.id] = isoToSeconds(iso);
    });
    const results = items.map((item: any) => ({
      youtubeId: item.id?.videoId,
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      durationSeconds: durationMap[item.id?.videoId] ?? null,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
    }));
    return res.status(200).json(results);
  } catch (error) {
    console.error("YouTube search failed", error);
    return jsonError(res, 500, "YouTube search failed.");
  }
});

app.get("/progress/entries", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  const entries = await sanityClient.fetch(
    `*[_type == "progressEntry" && userId == $userId] | order(date desc){
      "id": _id,
      userId,
      date,
      weight,
      "coverUrl": coverPhoto.asset->url,
      "photoUrls": photos[].asset->url
    }`,
    { userId }
  );
  return res.status(200).json(entries || []);
});

app.post("/progress/entries", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return jsonError(res, 400, "User email not available.");
  }
  try {
    const { fields, files } = await parseProgressUpload(req);
    const { date, weight, coverIndex } = fields as ProgressEntryInput & { weight?: string; coverIndex?: string };
    console.log("[progress] upload start", {
      userId,
      date,
      fileCount: files.length,
      filenames: files.map(file => file.filename),
    });
    if (files.length === 0) {
      return jsonError(res, 400, "At least one photo is required.");
    }
    if (files.some(file => !file.mimeType || !file.mimeType.startsWith("image/"))) {
      return jsonError(res, 400, "Only image uploads are supported.");
    }
    const uploadDate = date || new Date().toISOString().slice(0, 10);
    const parsedWeight = weight ? Number(weight) : undefined;
    const assets = [];
    for (const file of files) {
      const asset = await sanityClient.assets.upload("image", file.buffer, {
        filename: file.filename || "progress-upload",
        contentType: file.mimeType,
      });
      assets.push(asset);
      console.log("[progress] asset upload complete", {
        userId,
        assetId: asset._id,
        assetUrl: asset.url,
      });
    }
    const coverIndexNumber = Number(coverIndex);
    const safeCoverIndex = Number.isFinite(coverIndexNumber)
      ? Math.min(Math.max(coverIndexNumber, 0), assets.length - 1)
      : 0;
    const coverAsset = assets[safeCoverIndex];
    const docPayload = {
      _type: "progressEntry",
      userId,
      date: uploadDate,
      weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
      coverPhoto: {
        _type: "image",
        asset: { _type: "reference", _ref: coverAsset._id },
      },
      photos: assets.map(asset => ({
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      })),
      createdAt: new Date().toISOString(),
    };
    console.log("[progress] creating entry", { userId, date: uploadDate, weight: docPayload.weight });
    const doc = await sanityClient.create(docPayload);
    console.log("[progress] entry created", { userId, entryId: doc._id });
    return res.status(201).json({
      id: doc._id,
      userId,
      date: uploadDate,
      weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
      coverUrl: coverAsset.url,
      photoUrls: assets.map(asset => asset.url),
    });
  } catch (error) {
    console.error("[progress] entry creation failed", { userId, error });
    if (error instanceof Error) {
      if (error.message === "Upload must be multipart/form-data."
        || error.message === "Photo exceeds 15MB limit."
        || error.message === "Too many files.") {
        return jsonError(res, 400, error.message);
      }
    }
    return jsonError(res, 500, "Unable to create progress entry.");
  }
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
