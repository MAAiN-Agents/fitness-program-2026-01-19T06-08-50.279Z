import React from "react";

type ParsedTags = {
  tip?: string;
  caution?: string;
  variations?: string;
};

type ParsedInstructions = {
  main: string;
  tags: ParsedTags;
};

const TAG_PATTERNS = [
  { key: "tip", label: "Tip", tone: "tip" },
  { key: "caution", label: "Caution", tone: "caution" },
  { key: "variations", label: "Variations", tone: "variations" },
] as const;

const TAG_REGEX = /(Tip|Caution|Variations):/gi;

export function parseExerciseInstructions(text: string): ParsedInstructions {
  const cleanText = text || "";
  const matches = Array.from(cleanText.matchAll(TAG_REGEX));
  if (matches.length === 0) {
    return { main: cleanText.trim(), tags: {} };
  }

  const tags: ParsedTags = {};
  matches.forEach((match, index) => {
    const label = match[1];
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? cleanText.length : cleanText.length;
    const content = cleanText.slice(start, end).trim();
    const key = label.toLowerCase() as keyof ParsedTags;
    if (content) {
      tags[key] = content;
    }
  });

  const mainEnd = matches[0].index ?? cleanText.length;
  return {
    main: cleanText.slice(0, mainEnd).trim(),
    tags,
  };
}

type ExerciseInstructionDisplayProps = {
  text?: string | null;
  textSecondary: string;
  accentColors?: {
    tip?: string;
    caution?: string;
    variations?: string;
    safety?: string;
  };
};

const ExerciseInstructionDisplay: React.FC<ExerciseInstructionDisplayProps> = ({
  text,
  textSecondary,
  accentColors,
}) => {
  const parsed = parseExerciseInstructions(text || "");
  const hasTags = TAG_PATTERNS.some(tag => parsed.tags[tag.key]);
  const tones = {
    tip: accentColors?.tip || "#2E7D32",
    caution: accentColors?.caution || "#C62828",
    variations: accentColors?.variations || "#8E24AA",
    safety: accentColors?.safety || "#F9A825",
  };

  if (!parsed.main && !hasTags) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {parsed.main && <div style={{ fontSize: 14 }}>{parsed.main}</div>}
      {TAG_PATTERNS.map(tag => {
        const value = parsed.tags[tag.key];
        if (!value) return null;
        const toneColor = tones[tag.tone];
        return (
          <div key={tag.key} style={{ display: "grid", gap: 2 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: toneColor,
                fontWeight: 700,
              }}
            >
              {tag.label}
            </div>
            <div style={{ fontSize: 12, color: toneColor }}>{value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseInstructionDisplay;
