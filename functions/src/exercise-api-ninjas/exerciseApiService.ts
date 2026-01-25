export type ExerciseApiQuery = {
  name?: string;
  type?: string;
  muscle?: string;
  difficulty?: string;
  equipments?: string;
};

export type ExerciseApiExercise = {
  name: string;
  type: string;
  muscle: string;
  difficulty: string;
  instructions: string;
  equipments: string[];
  safety_info?: string | null;
};

const API_BASE_URL = "https://api.api-ninjas.com/v1/exercises";

export async function searchExercises(
  query: ExerciseApiQuery,
  apiKey: string
): Promise<ExerciseApiExercise[]> {
  if (!apiKey) {
    throw new Error("Exercise API key is missing.");
  }
  const params = new URLSearchParams();
  if (query.name) params.set("name", query.name);
  if (query.type) params.set("type", query.type);
  if (query.muscle) params.set("muscle", query.muscle);
  if (query.difficulty) params.set("difficulty", query.difficulty);
  if (query.equipments) params.set("equipments", query.equipments);

  const url = params.size ? `${API_BASE_URL}?${params.toString()}` : API_BASE_URL;
  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Exercise API failed (${response.status}): ${body}`);
  }
  return (await response.json()) as ExerciseApiExercise[];
}
