import React, { useMemo, useState } from "react";

type Theme = {
  colors: {
    primary: string;
    accent: string;
    accent2: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  font: {
    heading: string;
    body: string;
    button: string;
  };
  radii: {
    card: string;
    input: string;
    button: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    card: string;
  };
  input: {
    height: string;
    padding: string;
  };
};

export type ProgressEntry = {
  id: string;
  date: string;
  weight?: number;
  photoUrl?: string;
};

type Props = {
  theme: Theme;
  entries: ProgressEntry[];
  loading: boolean;
  onUpload: (payload: { date: string; weight: string; file: File }) => Promise<void>;
};

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

function FitnessProgressTab({ theme, entries, loading, onUpload }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const isReady = Boolean(file);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  );

  const handleSubmit = async () => {
    if (!file) return;
    await onUpload({ date, weight, file });
    setWeight("");
    setFile(null);
  };

  return (
    <section data-component="FitnessProgressTab" style={{ marginBottom: theme.spacing.lg }}>
      <h2 style={{ font: theme.font.heading, color: theme.colors.primary, margin: 0 }}>
        Fitness Progress
      </h2>
      <p style={{ margin: `${theme.spacing.xs} 0 ${theme.spacing.md}`, color: theme.colors.textSecondary }}>
        Track progress photos and weigh-ins together.
      </p>
      <div
        data-component="ProgressUploadCard"
        style={{
          background: theme.colors.card,
          borderRadius: theme.radii.card,
          boxShadow: theme.shadow.card,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        <label style={{ display: "block", font: theme.font.body, color: theme.colors.textSecondary }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={event => setDate(event.target.value)}
          style={{
            width: "100%",
            height: theme.input.height,
            padding: theme.input.padding,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.input,
            marginBottom: theme.spacing.sm,
          }}
        />
        <label style={{ display: "block", font: theme.font.body, color: theme.colors.textSecondary }}>
          Weigh-in (lbs)
        </label>
        <input
          type="number"
          value={weight}
          onChange={event => setWeight(event.target.value)}
          placeholder="Optional"
          style={{
            width: "100%",
            height: theme.input.height,
            padding: theme.input.padding,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.input,
            marginBottom: theme.spacing.sm,
          }}
        />
        <label style={{ display: "block", font: theme.font.body, color: theme.colors.textSecondary }}>
          Progress photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={event => setFile(event.target.files?.[0] || null)}
          style={{ marginBottom: theme.spacing.sm }}
        />
        <button
          type="button"
          data-component="ProgressUploadButton"
          onClick={handleSubmit}
          disabled={!isReady || loading}
          style={{
            background: theme.colors.accent,
            color: theme.colors.text,
            border: "none",
            borderRadius: theme.radii.button,
            font: theme.font.button,
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            cursor: isReady && !loading ? "pointer" : "not-allowed",
            opacity: isReady && !loading ? 1 : 0.6,
            boxShadow: theme.shadow.card,
          }}
        >
          {loading ? "Uploading..." : "Add Progress Entry"}
        </button>
      </div>
      <div
        data-component="ProgressGallery"
        style={{
          display: "grid",
          gap: theme.spacing.md,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        {sortedEntries.length === 0 && (
          <div style={{ color: theme.colors.textSecondary }}>No progress entries yet.</div>
        )}
        {sortedEntries.map(entry => (
          <div
            key={entry.id}
            data-component="ProgressCard"
            style={{
              background: theme.colors.card,
              borderRadius: theme.radii.card,
              boxShadow: theme.shadow.card,
              padding: theme.spacing.sm,
              display: "grid",
              gap: theme.spacing.xs,
            }}
          >
            {entry.photoUrl ? (
              <img
                src={entry.photoUrl}
                alt={`Progress on ${entry.date}`}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: theme.radii.input,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: theme.radii.input,
                  background: theme.colors.background,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.colors.textSecondary,
                }}
              >
                No photo
              </div>
            )}
            <div style={{ fontWeight: 700, color: theme.colors.primary }}>
              {formatDisplayDate(entry.date)}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              {entry.weight ? `${entry.weight} lbs` : "No weigh-in"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FitnessProgressTab;
