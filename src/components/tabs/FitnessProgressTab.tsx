import React, { useEffect, useMemo, useState } from "react";

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
  weight?: number | null;
  coverUrl?: string | null;
  photoUrls?: string[];
};

type Props = {
  theme: Theme;
  entries: ProgressEntry[];
  loading: boolean;
  onUpload: (payload: { date: string; weight: string; files: File[]; coverIndex: number }) => Promise<void>;
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
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const isReady = files.length > 0;

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  );
  const previewUrls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);

  useEffect(() => () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    await onUpload({ date, weight, files, coverIndex });
    setWeight("");
    setFiles([]);
    setCoverIndex(0);
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
          Progress photos (up to 10)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={event => {
            const nextFiles = Array.from(event.target.files || []).slice(0, 10);
            setFiles(nextFiles);
            setCoverIndex(0);
          }}
          style={{ marginBottom: theme.spacing.sm }}
        />
        {files.length > 0 && (
          <div
            data-component="ProgressUploadPreview"
            style={{
              display: "flex",
              gap: theme.spacing.sm,
              overflowX: "auto",
              paddingBottom: theme.spacing.xs,
              marginBottom: theme.spacing.sm,
            }}
          >
            {previewUrls.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setCoverIndex(index)}
                style={{
                  border: index === coverIndex
                    ? `2px solid ${theme.colors.accent2}`
                    : `1px solid ${theme.colors.border}`,
                  background: "transparent",
                  borderRadius: theme.radii.input,
                  padding: 2,
                  cursor: "pointer",
                }}
                aria-label={`Set cover photo ${index + 1}`}
              >
                <img
                  src={url}
                  alt={`Selected progress ${index + 1}`}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: theme.radii.input }}
                />
                {index === coverIndex && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: theme.colors.accent2,
                    }}
                  >
                    Cover photo
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
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
        {sortedEntries.map(entry => {
          const coverUrl = entry.coverUrl || entry.photoUrls?.[0] || null;
          return (
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
            {coverUrl ? (
              <img
                src={coverUrl}
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
            {entry.photoUrls && entry.photoUrls.length > 0 && (
              <div
                data-component="ProgressThumbRow"
                style={{
                  display: "flex",
                  gap: theme.spacing.xs,
                  overflowX: "auto",
                  paddingBottom: theme.spacing.xs,
                }}
              >
                {entry.photoUrls.map((url, index) => (
                  <img
                    key={`${entry.id}-${index}`}
                    src={url}
                    alt={`Progress thumbnail ${index + 1}`}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: theme.radii.input,
                      border: url === coverUrl
                        ? `2px solid ${theme.colors.accent2}`
                        : `1px solid ${theme.colors.border}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}

export default FitnessProgressTab;
