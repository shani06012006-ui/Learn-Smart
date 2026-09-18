import Badge from "../../../../components/ui/Badge";

// Maps the four performance levels from the proposal to Badge variants.
// The label text comes from the API (`level_label`), the color is chosen
// here so the palette stays in one place.
const VARIANT_BY_LEVEL = {
  excellent: "success",
  very_good: "brand",
  average: "warning",
  needs_improvement: "danger",
};

export default function PerformanceLevelBadge({ level, label }) {
  return (
    <Badge variant={VARIANT_BY_LEVEL[level] || "neutral"} dot>
      {label}
    </Badge>
  );
}
