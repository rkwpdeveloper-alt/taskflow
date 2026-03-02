import { cn } from "@/lib/utils";
import { Variant_low_high_medium } from "../../backend.d";

interface PriorityBadgeProps {
  priority: Variant_low_high_medium;
  size?: "sm" | "default";
}

export function PriorityBadge({
  priority,
  size = "default",
}: PriorityBadgeProps) {
  const labels = {
    [Variant_low_high_medium.high]: "High",
    [Variant_low_high_medium.medium]: "Medium",
    [Variant_low_high_medium.low]: "Low",
  };

  const dotColors = {
    [Variant_low_high_medium.high]: "bg-[oklch(var(--high-priority))]",
    [Variant_low_high_medium.medium]: "bg-[oklch(var(--medium-priority))]",
    [Variant_low_high_medium.low]: "bg-[oklch(var(--low-priority))]",
  };

  const textColors = {
    [Variant_low_high_medium.high]: "text-[oklch(var(--high-priority))]",
    [Variant_low_high_medium.medium]: "text-[oklch(var(--medium-priority))]",
    [Variant_low_high_medium.low]: "text-[oklch(var(--low-priority))]",
  };

  const bgColors = {
    [Variant_low_high_medium.high]:
      "bg-[oklch(var(--high-priority)/0.1)] border-[oklch(var(--high-priority)/0.3)]",
    [Variant_low_high_medium.medium]:
      "bg-[oklch(var(--medium-priority)/0.1)] border-[oklch(var(--medium-priority)/0.3)]",
    [Variant_low_high_medium.low]:
      "bg-[oklch(var(--low-priority)/0.1)] border-[oklch(var(--low-priority)/0.3)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        textColors[priority],
        bgColors[priority],
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          size === "sm" ? "w-1.5 h-1.5" : "w-1.5 h-1.5",
          dotColors[priority],
        )}
      />
      {labels[priority]}
    </span>
  );
}
