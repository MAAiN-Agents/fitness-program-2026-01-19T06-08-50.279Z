import express from "express";
import type { SanityClient } from "@sanity/client";
import { searchExercises, type ExerciseApiQuery, type ExerciseApiExercise } from "./exerciseApiService";
import { upsertExerciseFromApi } from "./exerciseApiRepository";

type ControllerDeps = {
  sanityClient: SanityClient;
  requireAuth: express.RequestHandler;
};

const getApiKey = () =>
  process.env.EXERCISE_API_NINJAS_KEY || process.env.EXERCISE_API_KEY || "";

export function createExerciseApiRouter({ sanityClient, requireAuth }: ControllerDeps) {
  const router = express.Router();

  router.get("/exercises", requireAuth, async (req, res) => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const params: ExerciseApiQuery = {
        name: query.name,
        type: query.type,
        muscle: query.muscle,
        difficulty: query.difficulty,
        equipments: query.equipments,
      };
      const exercises = await searchExercises(params, getApiKey());
      return res.status(200).json(exercises);
    } catch (error) {
      console.error("Exercise API search failed", error);
      return res.status(500).json({ error: "Unable to search exercises." });
    }
  });

  router.post("/exercises", requireAuth, async (req, res) => {
    try {
      const payload = req.body as { exercise?: ExerciseApiExercise };
      if (!payload.exercise) {
        return res.status(400).json({ error: "Exercise payload is required." });
      }
      const created = await upsertExerciseFromApi(sanityClient, payload.exercise);
      return res.status(201).json({
        id: created._id,
        title: created.title,
        description: created.description,
        safety: created.safety,
        muscle: created.muscle,
        equipments: created.equipments,
        difficulty: created.difficulty,
        type: created.type,
        source: created.source,
        isCustom: created.isCustom,
      });
    } catch (error) {
      console.error("Exercise API import failed", error);
      return res.status(500).json({ error: "Unable to add exercise." });
    }
  });

  return router;
}
