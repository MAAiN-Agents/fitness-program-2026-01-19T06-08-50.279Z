import React from "react";
import { Inline, Button, Text } from "@sanity/ui";
import { set, unset } from "sanity";

type Props = {
  value?: number | null;
  onChange?: (patch: any) => void;
};

export default function InternalRatingStars(props: Props) {
  const { value, onChange } = props;
  const current = typeof value === "number" ? value : 0;

  const selectRating = (rating: number) => {
    if (!onChange) return;
    if (rating <= 0) {
      onChange(unset());
      return;
    }
    onChange(set(rating));
  };

  return (
    <Inline space={2} style={{ alignItems: "center", flexWrap: "wrap" }}>
      {[1, 2, 3, 4, 5].map(rating => {
        const filled = rating <= current;
        return (
          <Button
            key={rating}
            mode={filled ? "default" : "ghost"}
            tone={filled ? "positive" : "default"}
            onClick={() => selectRating(rating)}
            text={"★".repeat(rating)}
            style={{ minWidth: 48, justifyContent: "center" }}
          />
        );
      })}
      <Button mode="ghost" text="Clear" onClick={() => selectRating(0)} style={{ minWidth: 64 }} />
      {current > 0 && <Text size={1}>Current: {current}/5</Text>}
    </Inline>
  );
}
