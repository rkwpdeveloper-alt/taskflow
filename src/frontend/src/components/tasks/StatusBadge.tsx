import { cn } from "@/lib/utils";
import { Variant_pending_completed } from "../../backend.d";

interface StatusBadgeProps {
  status: Variant_pending_completed;
  size?: "sm" | "default";
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const isCompleted = status === Variant_pending_completed.completed;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        isCompleted
          ? "text-[oklch(var(--success))] bg-[oklch(var(--success)/0.1)] border-[oklch(var(--success)/0.3)]"
          : "text-muted-foreground bg-muted/50 border-border",
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0 w-1.5 h-1.5",
          isCompleted ? "bg-[oklch(var(--success))]" : "bg-muted-foreground",
        )}
      />
      {isCompleted ? "Completed" : "Pending"}
    </span>
  );
}
