import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import {
  Variant_low_high_medium,
  Variant_pending_completed,
} from "../../backend.d";

export type SortOrder = "asc" | "desc";

export interface FilterState {
  search: string;
  priority: Variant_low_high_medium | "all";
  status: Variant_pending_completed | "all";
  assignee: string | "all";
  sortOrder: SortOrder;
}

interface TaskFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  members?: Array<{ principal: string; name?: string }>;
}

export function TaskFilters({ filters, onChange, members }: TaskFiltersProps) {
  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Priority filter */}
      <Select
        value={filters.priority}
        onValueChange={(v) =>
          update({ priority: v as Variant_low_high_medium | "all" })
        }
      >
        <SelectTrigger className="h-9 text-sm w-full sm:w-[130px]">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value={Variant_low_high_medium.high}>🔴 High</SelectItem>
          <SelectItem value={Variant_low_high_medium.medium}>
            🟡 Medium
          </SelectItem>
          <SelectItem value={Variant_low_high_medium.low}>🔵 Low</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status}
        onValueChange={(v) =>
          update({ status: v as Variant_pending_completed | "all" })
        }
      >
        <SelectTrigger className="h-9 text-sm w-full sm:w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value={Variant_pending_completed.pending}>
            Pending
          </SelectItem>
          <SelectItem value={Variant_pending_completed.completed}>
            Completed
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee filter */}
      {members && members.length > 0 && (
        <Select
          value={filters.assignee}
          onValueChange={(v) => update({ assignee: v })}
        >
          <SelectTrigger className="h-9 text-sm w-full sm:w-[140px]">
            <SelectValue placeholder="Assigned to" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.principal} value={m.principal}>
                {m.name ?? `${m.principal.slice(0, 10)}…`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 whitespace-nowrap"
        onClick={() =>
          update({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })
        }
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        Due {filters.sortOrder === "asc" ? "↑" : "↓"}
      </Button>
    </div>
  );
}

// Helper to filter and sort tasks
import type { Task } from "../../backend.d";

export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  let result = [...tasks];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }

  if (filters.priority !== "all") {
    result = result.filter((t) => t.priority === filters.priority);
  }

  if (filters.status !== "all") {
    result = result.filter((t) => t.status === filters.status);
  }

  if (filters.assignee !== "all") {
    result = result.filter(
      (t) =>
        t.assignedTo !== undefined &&
        t.assignedTo.toString() === filters.assignee,
    );
  }

  result.sort((a, b) => {
    const diff = Number(a.dueDate) - Number(b.dueDate);
    return filters.sortOrder === "asc" ? diff : -diff;
  });

  return result;
}
