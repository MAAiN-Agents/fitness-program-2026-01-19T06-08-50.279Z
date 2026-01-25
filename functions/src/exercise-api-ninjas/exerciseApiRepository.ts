import type { SanityClient } from "@sanity/client";
import type { ExerciseApiExercise } from "./exerciseApiService";

type ExerciseDocument = {
  _id: string;
  _type: "exercise";
  title: string;
  description?: string;
  safety?: string;
  muscle?: string;
  equipments?: string[];
  difficulty?: string;
  type?: string;
  source?: string;
  isCustom?: string;
};

const mapExerciseType = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  const map: Record<string, string> = {
    cardio: "Cardio",
    strength: "Strength",
    stretching: "Warmup",
    plyometrics: "Core",
    olympic_weightlifting: "Olympic Weightlifting",
    powerlifting: "Power Lifting",
    strongman: "Strongman",
  };
  return map[normalized] || value;
};

export async function upsertExerciseFromApi(
  sanityClient: SanityClient,
  exercise: ExerciseApiExercise
): Promise<ExerciseDocument> {
  const title = exercise.name.trim();
  const existing = await sanityClient.fetch(
    `*[_type == "exercise" && lower(title) == $title][0]{ _id }`,
    { title: title.toLowerCase() }
  );
  if (existing?._id) {
    const doc = await sanityClient.fetch(
      `*[_type == "exercise" && _id == $id][0]{
        _id,
        _type,
        title,
        description,
        safety,
        muscle,
        equipments,
        difficulty,
        type,
        source,
        isCustom
      }`,
      { id: existing._id }
    );
    if (doc && typeof doc.title === "string") {
      return doc as ExerciseDocument;
    }
  }

  const doc: Omit<ExerciseDocument, "_id"> = {
    _type: "exercise",
    title,
    description: exercise.instructions,
    safety: exercise.safety_info || undefined,
    muscle: exercise.muscle,
    equipments: Array.isArray(exercise.equipments) ? exercise.equipments : [],
    difficulty: exercise.difficulty,
    type: mapExerciseType(exercise.type),
    source: "api",
    isCustom: "false",
  };
  const created = await sanityClient.create(doc);
  return created as ExerciseDocument;
}
