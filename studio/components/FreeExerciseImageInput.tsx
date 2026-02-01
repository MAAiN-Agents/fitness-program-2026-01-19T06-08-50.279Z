import React, { useEffect, useMemo, useState } from "react";
import { Stack, TextInput, Button, Card, Text, Inline, Spinner, Select, Box } from "@sanity/ui";
import { PatchEvent, set, unset } from "sanity";

const EXERCISE_DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

type ExerciseDbItem = {
  id: string;
  name: string;
  images?: string[];
  bodyPart?: string;
  target?: string;
  category?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
};

type FreeExerciseImageValue = {
  _type: "freeExerciseImage";
  source: "free-exercise-db";
  exerciseId: string;
  exerciseName?: string;
  imagePath: string;
};

let cachedExercises: ExerciseDbItem[] | null = null;
let cachedPromise: Promise<ExerciseDbItem[]> | null = null;

const fetchExercises = () => {
  if (cachedExercises) return Promise.resolve(cachedExercises);
  if (!cachedPromise) {
    cachedPromise = fetch(EXERCISE_DB_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load exercises");
        return res.json();
      })
      .then(data => {
        cachedExercises = Array.isArray(data) ? data : [];
        return cachedExercises;
      });
  }
  return cachedPromise;
};

const getBodyPart = (exercise: ExerciseDbItem) =>
  exercise.bodyPart || exercise.primaryMuscles?.[0] || "";

const getTarget = (exercise: ExerciseDbItem) =>
  exercise.target || exercise.secondaryMuscles?.[0] || "";

export default function FreeExerciseImageInput(props: any) {
  const { value, onChange } = props;
  const [query, setQuery] = useState("");
  const [bodyPartFilter, setBodyPartFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ExerciseDbItem[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchExercises()
      .then(data => {
        if (!active) return;
        setItems(data);
        setMessage(null);
      })
      .catch(() => {
        if (!active) return;
        setMessage("Unable to load free-exercise-db.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const bodyPartOptions = useMemo(() => {
    const setOptions = new Set<string>();
    items.forEach(ex => {
      const value = getBodyPart(ex);
      if (value) setOptions.add(value);
    });
    return Array.from(setOptions).sort();
  }, [items]);

  const targetOptions = useMemo(() => {
    const setOptions = new Set<string>();
    items.forEach(ex => {
      const value = getTarget(ex);
      if (value) setOptions.add(value);
    });
    return Array.from(setOptions).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    const matchesFilters = (exercise: ExerciseDbItem) => {
      if (bodyPartFilter) {
        const bodyPart = getBodyPart(exercise);
        if (!bodyPart || bodyPart !== bodyPartFilter) return false;
      }
      if (targetFilter) {
        const target = getTarget(exercise);
        if (!target || target !== targetFilter) return false;
      }
      return true;
    };

    const scored = items
      .filter(matchesFilters)
      .map(exercise => {
        const name = exercise.name.toLowerCase();
        const exact = normalizedQuery.length > 0 && name === normalizedQuery;
        const includesAllWords =
          queryWords.length === 0 || queryWords.every(word => name.includes(word));
        const startsWith = normalizedQuery.length > 0 && name.startsWith(normalizedQuery);
        const includesQuery = normalizedQuery.length > 0 && name.includes(normalizedQuery);
        let score = 0;
        if (exact) score += 1000;
        if (startsWith) score += 200;
        if (includesQuery) score += 100;
        if (includesAllWords) score += 50;
        score += Math.min(name.length, 100) * -0.1;
        return { exercise, score, matches: includesAllWords || includesQuery || exact };
      })
      .filter(item => (normalizedQuery ? item.matches : true))
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.exercise);
  }, [items, query, bodyPartFilter, targetFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, bodyPartFilter, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, totalPages);
  const pagedResults = useMemo(
    () => filtered.slice((currentPage - 1) * 10, currentPage * 10),
    [filtered, currentPage]
  );

  const handleSelect = (exercise: ExerciseDbItem, imagePath: string) => {
    const nextValue: FreeExerciseImageValue = {
      _type: "freeExerciseImage",
      source: "free-exercise-db",
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      imagePath,
    };
    onChange(PatchEvent.from([set(nextValue)]));
  };

  const handleClear = () => {
    onChange(PatchEvent.from([unset()]));
  };

  const selectedImageUrl = value?.imagePath ? `${IMAGE_BASE_URL}${value.imagePath}` : null;

  return (
    <Stack space={3}>
      <Text weight="semibold">Free Exercise DB Image</Text>
      {selectedImageUrl && (
        <Card padding={3} radius={2} shadow={1} tone="transparent">
          <Stack space={2}>
            <Text size={1}>Selected: {value?.exerciseName || value?.exerciseId}</Text>
            <img
              src={selectedImageUrl}
              alt={value?.exerciseName || "Selected exercise"}
              style={{ width: "100%", borderRadius: 6, display: "block" }}
            />
            <Inline space={2}>
              <Button text="Clear selection" tone="critical" onClick={handleClear} />
            </Inline>
          </Stack>
        </Card>
      )}
      <TextInput
        placeholder="Search exercise name"
        value={query}
        onChange={event => setQuery(event.currentTarget.value)}
      />
      <Inline space={2}>
        <Select value={bodyPartFilter} onChange={event => setBodyPartFilter(event.currentTarget.value)}>
          <option value="">Body part (all)</option>
          {bodyPartOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <Select value={targetFilter} onChange={event => setTargetFilter(event.currentTarget.value)}>
          <option value="">Target (all)</option>
          {targetOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
      </Inline>
      {loading && (
        <Inline space={2}>
          <Spinner muted />
          <Text size={1}>Loading exercises...</Text>
        </Inline>
      )}
      {message && <Text size={1}>{message}</Text>}
      {!loading && filtered.length === 0 && <Text size={1}>No exercises found.</Text>}
      {!loading && filtered.length > 0 && (
        <Inline space={2} style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Text size={1}>
            Showing {Math.min(filtered.length, (currentPage - 1) * 10 + 1)}-
            {Math.min(filtered.length, currentPage * 10)} of {filtered.length}
          </Text>
          <Inline space={2}>
            <Button
              text="Prev"
              mode="ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            />
            <Text size={1}>Page {currentPage} / {totalPages}</Text>
            <Button
              text="Next"
              mode="ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            />
          </Inline>
        </Inline>
      )}
      <Stack space={3}>
        {pagedResults.map(exercise => (
          <Card key={exercise.id} padding={3} radius={2} shadow={1}>
            <Stack space={2}>
              <Text weight="semibold">{exercise.name}</Text>
              <Text size={1}>
                {[exercise.bodyPart || exercise.primaryMuscles?.[0], exercise.target || exercise.secondaryMuscles?.[0], exercise.equipment]
                  .filter(Boolean)
                  .join(" • ")}
              </Text>
              <Box style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
                {(exercise.images || []).map(imagePath => (
                  <button
                    key={imagePath}
                    type="button"
                    onClick={() => handleSelect(exercise, imagePath)}
                    style={{
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <img
                      src={`${IMAGE_BASE_URL}${imagePath}`}
                      alt={`${exercise.name} ${imagePath}`}
                      style={{ width: "100%", borderRadius: 6, display: "block" }}
                    />
                  </button>
                ))}
              </Box>
              <Button
                text="Use first image"
                mode="ghost"
                onClick={() => exercise.images?.[0] && handleSelect(exercise, exercise.images[0])}
                disabled={!exercise.images || exercise.images.length === 0}
              />
            </Stack>
          </Card>
        ))}
      </Stack>
      {filtered.length > 10 && (
        <Inline space={2} style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Button
            text="Prev"
            mode="ghost"
            disabled={currentPage <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
          />
          <Text size={1}>Page {currentPage} / {totalPages}</Text>
          <Button
            text="Next"
            mode="ghost"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
          />
        </Inline>
      )}
    </Stack>
  );
}
