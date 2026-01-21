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

export type TrackerSummary = {
  dayLabel: string;
  totalSessions: number;
  totalExercises: number;
  sessionsByTime: { AM: number; PM: number };
  sessions: Array<{
    label: string;
    time: string;
    exercises: Array<{
      title: string;
      type: string;
      sets: Array<{
        weight: number;
        reps: number;
        rpe?: number;
        actualReps?: number;
        actualDuration?: number;
        durationMinutes?: number | null;
      }>;
    }>;
  }>;
  weekLabel?: string;
};

export type NutritionSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ProgressEntry = {
  id: string;
  date: string;
  weight?: number | null;
  coverUrl?: string | null;
  photoUrls?: string[];
  trackerSummary?: TrackerSummary | null;
  nutritionSummary?: NutritionSummary | null;
};

type Props = {
  theme: Theme;
  entries: ProgressEntry[];
  loading: boolean;
  onUpload: (payload: { date: string; weight: string; files: File[]; coverIndex: number }) => Promise<void>;
  qrCodeUrl?: string | null;
};

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return hex;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function FitnessProgressTab({ theme, entries, loading, onUpload, qrCodeUrl }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [activeEntry, setActiveEntry] = useState<ProgressEntry | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMenuOpen, setOverlayMenuOpen] = useState(false);
  const [overlaySections, setOverlaySections] = useState({
    tracker: true,
    exercises: true,
    nutrition: true,
    qrcode: true,
  });
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [hideImage, setHideImage] = useState(false);
  const [overlayTextColor, setOverlayTextColor] = useState("#ffffff");
  const [overlayBgColor, setOverlayBgColor] = useState("#1b1b1b");
  const isReady = files.length > 0;
  const overlayPanelBackground = hideImage
    ? overlayBgColor
    : `linear-gradient(180deg, ${hexToRgba(overlayBgColor, 0.82)}, ${hexToRgba(overlayBgColor, 0.2)})`;
  const overlayBlockBackground = hideImage
    ? hexToRgba(overlayBgColor, 0.8)
    : hexToRgba(overlayBgColor, 0.6);
  const overlayBorderColor = hexToRgba(overlayTextColor, 0.2);
  const overlayDividerColor = hexToRgba(overlayTextColor, 0.25);
  const showQrCode = Boolean(qrCodeUrl) && overlaySections.qrcode;
  const showNutrition = overlaySections.nutrition;
  const isImageVisible = Boolean(activeImageUrl) && !hideImage;

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  );
  const previewUrls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  const trackerSummary = activeEntry?.trackerSummary || null;
  const trackerRows = trackerSummary
    ? ([
        ...trackerSummary.sessions
          .filter(session => session.time.toUpperCase() === "AM")
          .map(session => ({
            time: "AM",
            label: session.label,
          })),
        ...trackerSummary.sessions
          .filter(session => session.time.toUpperCase() === "PM")
          .map(session => ({
            time: "PM",
            label: session.label,
          })),
      ].slice(0, 2))
    : [];

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
  const openEntry = (entry: ProgressEntry) => {
    const coverUrl = entry.coverUrl || entry.photoUrls?.[0] || null;
    setActiveEntry(entry);
    setActiveImageUrl(coverUrl);
    setShowOverlay(Boolean(entry.trackerSummary) || !coverUrl);
    setOverlayMenuOpen(false);
    setHideImage(false);
  };
  const closeEntry = () => {
    setActiveEntry(null);
    setActiveImageUrl(null);
    setShowOverlay(false);
    setOverlayMenuOpen(false);
    setHideImage(false);
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
              cursor: "pointer",
            }}
            onClick={() => openEntry(entry)}
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
      {activeEntry && (
        <div
          data-component="ProgressModalOverlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(34, 34, 34, 0.5)",
            zIndex: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.md,
          }}
          onClick={closeEntry}
        >
          <div
            data-component="ProgressModal"
            style={{
              width: "min(520px, 100%)",
              background: theme.colors.card,
              borderRadius: theme.radii.card,
              boxShadow: theme.shadow.card,
              overflow: "hidden",
              display: "grid",
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
            }}
            onClick={event => event.stopPropagation()}
          >
            <div
              data-component="ProgressModalHeader"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing.sm,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    data-component="ProgressImageButton"
                    onClick={() => {
                      setOverlayMenuOpen(false);
                      setImagePopoverOpen(prev => !prev);
                    }}
                    style={{
                      background: "transparent",
                      color: theme.colors.primary,
                      border: `2px solid ${theme.colors.primary}`,
                      borderRadius: theme.radii.button,
                      font: theme.font.button,
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      cursor: "pointer",
                    }}
                  >
                    {hideImage ? "Show image" : "Hide image"}
                  </button>
                  {imagePopoverOpen && (
                    <div
                      data-component="ProgressImagePopover"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        background: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.card,
                        boxShadow: theme.shadow.card,
                        padding: theme.spacing.sm,
                        zIndex: 3,
                        minWidth: 200,
                        color: theme.colors.text,
                        display: "grid",
                        gap: theme.spacing.sm,
                      }}
                    >
                      <button
                        type="button"
                        data-component="ImageToggleButton"
                        onClick={() => setHideImage(prev => !prev)}
                        style={{
                          background: theme.colors.accent,
                          color: theme.colors.text,
                          border: "none",
                          borderRadius: theme.radii.button,
                          font: theme.font.button,
                          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                          cursor: "pointer",
                        }}
                      >
                        {hideImage ? "Show image" : "Hide image"}
                      </button>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        Font color
                        <input
                          type="color"
                          value={overlayTextColor}
                          onChange={event => setOverlayTextColor(event.target.value)}
                          data-component="OverlayFontColorPicker"
                        />
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        Background
                        <input
                          type="color"
                          value={overlayBgColor}
                          onChange={event => setOverlayBgColor(event.target.value)}
                          data-component="OverlayBackgroundColorPicker"
                        />
                      </label>
                    </div>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    data-component="ProgressOverlayMenuButton"
                    onClick={() => {
                      setImagePopoverOpen(false);
                      setOverlayMenuOpen(prev => !prev);
                    }}
                    style={{
                      background: "transparent",
                      color: theme.colors.primary,
                      border: `2px solid ${theme.colors.primary}`,
                      borderRadius: theme.radii.button,
                      font: theme.font.button,
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      cursor: "pointer",
                    }}
                  >
                    Overlays
                  </button>
                  {overlayMenuOpen && (
                    <div
                      data-component="ProgressOverlayMenu"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        background: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.card,
                        boxShadow: theme.shadow.card,
                        padding: theme.spacing.sm,
                        minWidth: 200,
                        zIndex: 2,
                        color: theme.colors.text,
                        display: "grid",
                        gap: theme.spacing.xs,
                      }}
                    >
                      {[
                        { key: "tracker", label: "Tracker summary" },
                        { key: "exercises", label: "Exercise list" },
                        { key: "nutrition", label: "Nutrition macros" },
                        { key: "qrcode", label: "Promo QR code" },
                      ].map(item => (
                        <label
                          key={item.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12,
                            marginBottom: 6,
                            opacity: showOverlay ? 1 : 0.5,
                            cursor: showOverlay ? "pointer" : "not-allowed",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={overlaySections[item.key as keyof typeof overlaySections]}
                            disabled={!showOverlay}
                            onChange={event =>
                              setOverlaySections(prev => ({
                                ...prev,
                                [item.key]: event.target.checked,
                              }))
                            }
                          />
                          {item.label}
                        </label>
                      ))}
                      <button
                        type="button"
                        data-component="OverlayToggleButton"
                        onClick={() => setShowOverlay(prev => !prev)}
                        style={{
                          marginTop: theme.spacing.xs,
                          background: theme.colors.accent,
                          color: theme.colors.text,
                          border: "none",
                          borderRadius: theme.radii.button,
                          font: theme.font.button,
                          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                          cursor: "pointer",
                        }}
                      >
                        {showOverlay ? "Hide overlay" : "Show overlay"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                data-component="ProgressModalClose"
                onClick={closeEntry}
                aria-label="Close progress modal"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `2px solid ${theme.colors.primary}`,
                  background: "transparent",
                  color: theme.colors.primary,
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div
              data-component="ProgressModalImage"
              style={{
                position: "relative",
                borderRadius: theme.radii.card,
                overflow: "hidden",
                background: hideImage ? overlayBgColor : theme.colors.background,
                minHeight: isImageVisible ? undefined : "60vh",
              }}
            >
              {hideImage ? (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    background: overlayBgColor,
                  }}
                />
              ) : activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={`Progress on ${activeEntry.date}`}
                  style={{ width: "100%", maxHeight: "70vh", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
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
              {showOverlay && (
                <div
                  data-component="ProgressModalOverlayPanel"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: overlayPanelBackground,
                    color: overlayTextColor,
                    padding: theme.spacing.md,
                    display: "grid",
                    gap: theme.spacing.sm,
                    alignContent: "start",
                    overflowY: "auto",
                  }}
                >
                  {overlaySections.tracker && (
                    <div
                      style={{
                        background: overlayBlockBackground,
                        border: `1px solid ${overlayBorderColor}`,
                        borderRadius: theme.radii.input,
                        padding: theme.spacing.sm,
                        display: "grid",
                        gap: theme.spacing.xs,
                      }}
                    >
                      {trackerSummary ? (
                        <>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              gap: theme.spacing.sm,
                              alignItems: "center",
                            }}
                          >
                            <div style={{ display: "grid", gap: 4 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>
                                {trackerSummary.dayLabel}, {formatDisplayDate(activeEntry.date)}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: theme.spacing.xs,
                                  fontSize: 11,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {(["AM", "PM"] as const).map(time => {
                                  const count = trackerSummary.sessionsByTime[time];
                                  return (
                                    <span
                                      key={time}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        fontSize: 9,
                                        fontWeight: 700,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        background: hexToRgba(overlayTextColor, 0.12),
                                      }}
                                    >
                                      <span>{time}</span>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          minWidth: 14,
                                          height: 14,
                                          borderRadius: 999,
                                          background: overlayTextColor,
                                          color: overlayBgColor,
                                          fontSize: 9,
                                          fontWeight: 800,
                                          lineHeight: 1,
                                        }}
                                      >
                                        {count}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div style={{ display: "grid", justifyItems: "end", gap: 4 }}>
                              <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                {trackerSummary.weekLabel || "Week"}
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 700, textAlign: "right" }}>
                                {activeEntry.weight ? `${activeEntry.weight} lbs` : "No weigh-in"}
                              </div>
                            </div>
                          </div>

                        </>
                      ) : (
                        <div style={{ fontSize: 12 }}>No tracker data for this day.</div>
                      )}
                    </div>
                  )}
                  {overlaySections.exercises && activeEntry.trackerSummary && (
                    <div
                      style={{
                        background: overlayBlockBackground,
                        border: `1px solid ${overlayBorderColor}`,
                        borderRadius: theme.radii.input,
                        padding: theme.spacing.sm,
                        display: "grid",
                        gap: theme.spacing.sm,
                        fontSize: 12,
                      }}
                    >
                      {activeEntry.trackerSummary.sessions.map((session, index) => (
                        <div key={`${session.label}-${index}`}>
                          <div
                            style={{
                              fontWeight: 700,
                              marginBottom: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              borderBottom: `1px solid ${overlayDividerColor}`,
                              paddingBottom: 4,
                            }}
                          >
                            <span>{session.time} {session.label}</span>
                          </div>
                          {session.exercises.map((exercise, exerciseIndex) => {
                            const setCount = exercise.sets.length;
                            const hasDuration = exercise.sets.some(set =>
                              (set.actualDuration ?? set.durationMinutes) !== undefined && (set.actualDuration ?? set.durationMinutes) !== null
                            );
                            const totalDuration = exercise.sets.reduce((total, set) => {
                              const value = set.actualDuration ?? set.durationMinutes ?? 0;
                              return total + value;
                            }, 0);
                            const totalReps = exercise.sets.reduce((total, set) => {
                              const value = set.actualReps ?? set.reps ?? 0;
                              return total + value;
                            }, 0);
                            return (
                              <div
                                key={`${exercise.title}-${exerciseIndex}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: theme.spacing.xs,
                                  marginBottom: 6,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    opacity: 0.8,
                                    width: 32,
                                  }}
                                >
                                  {exerciseIndex + 1}
                                </div>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ fontWeight: 700 }}>{exercise.title}</span>
                                  <span style={{ fontSize: 11, opacity: 0.75 }}>Sets</span>
                                  <span style={{ fontSize: 13, fontWeight: 700 }}>{setCount}</span>
                                  {hasDuration ? (
                                    <>
                                      <span style={{ fontSize: 11, opacity: 0.75 }}>Total duration</span>
                                      <span style={{ fontSize: 13, fontWeight: 700 }}>{totalDuration} min</span>
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ fontSize: 11, opacity: 0.75 }}>Total reps</span>
                                      <span style={{ fontSize: 13, fontWeight: 700 }}>{totalReps}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {(showNutrition || showQrCode) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: showNutrition && showQrCode ? "space-between" : showQrCode ? "flex-end" : "flex-start",
                        gap: theme.spacing.sm,
                        marginTop: "auto",
                      }}
                    >
                      {showNutrition && (
                        <div
                          style={{
                            background: overlayBlockBackground,
                            border: `1px solid ${overlayBorderColor}`,
                            borderRadius: theme.radii.input,
                            padding: theme.spacing.sm,
                            textAlign: "center",
                            fontSize: 12,
                            flex: showQrCode ? "1 1 auto" : "0 0 auto",
                          }}
                        >
                          {activeEntry.nutritionSummary ? (
                            <div style={{ display: "grid", gap: theme.spacing.sm }}>
                              <div style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                Nutrition Goals
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: theme.spacing.xs }}>
                                {[
                                  { key: "protein", label: "Protein", value: activeEntry.nutritionSummary.protein, unit: "g", accent: theme.colors.primary },
                                  { key: "carbs", label: "Carbs", value: activeEntry.nutritionSummary.carbs, unit: "g", accent: theme.colors.accent },
                                  { key: "fat", label: "Fat", value: activeEntry.nutritionSummary.fat, unit: "g", accent: theme.colors.accent2 },
                                  { key: "calories", label: "Calories", value: activeEntry.nutritionSummary.calories, unit: "kcal", accent: theme.colors.textSecondary },
                                ].map(item => (
                                  <div
                                    key={item.key}
                                    style={{
                                      display: "grid",
                                      gap: 4,
                                      padding: theme.spacing.xs,
                                      borderRadius: theme.radii.input,
                                      border: `1px solid ${overlayBorderColor}`,
                                      background: `linear-gradient(135deg, ${item.accent}33, ${overlayBlockBackground})`,
                                    }}
                                  >
                                    <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff" }}>
                                      {item.label}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                                      <span style={{ fontSize: 16, fontWeight: 700 }}>{item.value}</span>
                                      <span style={{ fontSize: 10, opacity: 0.8 }}>{item.unit}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>No nutrition logged for this day.</div>
                          )}
                        </div>
                      )}
                      {showQrCode && (
                        <div
                          style={{
                            background: overlayBlockBackground,
                            border: `1px solid ${overlayBorderColor}`,
                            borderRadius: theme.radii.input,
                            padding: theme.spacing.sm,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                          }}
                        >
                          <img
                            src={qrCodeUrl || ""}
                            alt="Promo QR code"
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: theme.radii.input,
                              border: `2px solid ${overlayBorderColor}`,
                              background: "#fff",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {activeEntry.photoUrls && activeEntry.photoUrls.length > 0 && (
              <div
                data-component="ProgressModalThumbs"
                style={{
                  display: "flex",
                  gap: theme.spacing.xs,
                  overflowX: "auto",
                  paddingBottom: theme.spacing.xs,
                }}
              >
                {activeEntry.photoUrls.map((url, index) => (
                  <button
                    key={`${activeEntry.id}-modal-${index}`}
                    type="button"
                    onClick={() => setActiveImageUrl(url)}
                    style={{
                      border: url === activeImageUrl
                        ? `2px solid ${theme.colors.accent2}`
                        : `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.input,
                      padding: 2,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    aria-label={`Select photo ${index + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Progress option ${index + 1}`}
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: theme.radii.input }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default FitnessProgressTab;
