import { useState } from "react";

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

export function useExerciseAPI(getIdToken?: () => Promise<string | null>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const baseUrl = `${process.env.REACT_APP_API_BASE || ""}/api`;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!getIdToken) return {};
    const token = await getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    searchExercises: (query: ExerciseApiQuery) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const params = new URLSearchParams();
        if (query.name) params.set("name", query.name);
        if (query.type) params.set("type", query.type);
        if (query.muscle) params.set("muscle", query.muscle);
        if (query.difficulty) params.set("difficulty", query.difficulty);
        if (query.equipments) params.set("equipments", query.equipments);
        const url = `${baseUrl}/exercise-api/exercises${params.toString() ? `?${params}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (!response.ok) {
          throw new Error(`Exercise search failed with status ${response.status}`);
        }
        return response.json() as Promise<ExerciseApiExercise[]>;
      }),
    addExercise: (exercise: ExerciseApiExercise) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/exercise-api/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ exercise }),
        });
        if (!response.ok) {
          throw new Error(`Exercise import failed with status ${response.status}`);
        }
        return response.json();
      }),
  };
}
