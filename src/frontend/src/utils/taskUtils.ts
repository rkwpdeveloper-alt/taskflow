import {
  Variant_low_high_medium,
  Variant_pending_completed,
} from "../backend.d";

// ─── Timestamp conversions ───────────────────────────────────────────────────

/** Convert JS Date to nanoseconds bigint */
export function dateToNanos(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/** Convert nanoseconds bigint to JS Date */
export function nanosToDate(nanos: bigint): Date {
  return new Date(Number(nanos / 1_000_000n));
}

/** Format a bigint nanosecond timestamp for display */
export function formatNanosDate(nanos: bigint): string {
  const date = nanosToDate(nanos);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a bigint nanosecond timestamp with time */
export function formatNanosDateTime(nanos: bigint): string {
  const date = nanosToDate(nanos);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Get relative time string */
export function getRelativeTime(nanos: bigint): string {
  const date = nanosToDate(nanos);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffMins = Math.floor(diff / 60000);
  const diffHours = Math.floor(diff / 3600000);
  const diffDays = Math.floor(diff / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatNanosDate(nanos);
}

/** Check if a task is overdue */
export function isOverdue(
  dueDate: bigint,
  status: Variant_pending_completed,
): boolean {
  if (status === Variant_pending_completed.completed) return false;
  return nanosToDate(dueDate) < new Date();
}

/** Check if due today */
export function isDueToday(dueDate: bigint): boolean {
  const due = nanosToDate(dueDate);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

/** Check if due in next N days */
export function isDueInDays(dueDate: bigint, days: number): boolean {
  const due = nanosToDate(dueDate);
  const future = new Date();
  future.setDate(future.getDate() + days);
  return due <= future && due >= new Date();
}

// ─── Priority helpers ─────────────────────────────────────────────────────────

export function getPriorityLabel(priority: Variant_low_high_medium): string {
  switch (priority) {
    case Variant_low_high_medium.high:
      return "High";
    case Variant_low_high_medium.medium:
      return "Medium";
    case Variant_low_high_medium.low:
      return "Low";
  }
}

export function getPriorityColor(priority: Variant_low_high_medium): string {
  switch (priority) {
    case Variant_low_high_medium.high:
      return "priority-high";
    case Variant_low_high_medium.medium:
      return "priority-medium";
    case Variant_low_high_medium.low:
      return "priority-low";
  }
}

export function getPriorityOrder(priority: Variant_low_high_medium): number {
  switch (priority) {
    case Variant_low_high_medium.high:
      return 0;
    case Variant_low_high_medium.medium:
      return 1;
    case Variant_low_high_medium.low:
      return 2;
  }
}

// ─── Name helper ─────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/** Shorten principal for display */
export function shortenPrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
}

// ─── Date to input value ──────────────────────────────────────────────────────

export function nanosToDateInputValue(nanos: bigint): string {
  const date = nanosToDate(nanos);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nanosToTimeInputValue(nanos: bigint): string {
  const date = nanosToDate(nanos);
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
}

export function nanosToDatetimeLocalValue(nanos: bigint): string {
  const date = nanosToDate(nanos);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${mins}`;
}
