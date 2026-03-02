import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Task } from "../../backend.d";
import { Variant_pending_completed } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useDeleteTask,
  useGetUserProfile,
  useMarkTaskComplete,
  useMarkTaskPending,
} from "../../hooks/useQueries";
import { formatNanosDate, isDueToday, isOverdue } from "../../utils/taskUtils";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onView?: (task: Task) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

function AssigneeName({ principal }: { principal: string }) {
  const { data: profile } = useGetUserProfile(principal);
  if (!profile)
    return (
      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
        {principal.slice(0, 8)}…
      </span>
    );
  return (
    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
      {profile.name}
    </span>
  );
}

export function TaskCard({
  task,
  onEdit,
  onView,
  draggable,
  onDragStart,
}: TaskCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const { identity } = useInternetIdentity();
  const markComplete = useMarkTaskComplete();
  const markPending = useMarkTaskPending();
  const deleteTask = useDeleteTask();

  const isCompleted = task.status === Variant_pending_completed.completed;
  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isDueToday(task.dueDate);
  const isOwner =
    identity?.getPrincipal().toString() === task.createdBy.toString();

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isCompleted) {
        await markPending.mutateAsync(task.id);
        toast.success("Task marked as pending");
      } else {
        await markComplete.mutateAsync(task.id);
        toast.success("Task completed! 🎉");
      }
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onView?.(task);
  };

  return (
    <>
      <article
        className={cn(
          "group relative flex flex-col gap-3 p-4 rounded-lg border bg-card text-card-foreground task-card-hover cursor-pointer",
          isCompleted ? "opacity-75" : "",
          overdue ? "overdue-glow border-destructive/40" : "border-border",
          "shadow-card",
        )}
        onClick={() => onView?.(task)}
        onKeyDown={handleCardKeyDown}
        draggable={draggable}
        onDragStart={draggable ? (e) => onDragStart?.(e, task) : undefined}
      >
        {/* Top row: status toggle + title + priority */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleStatusToggle}
            className={cn(
              "mt-0.5 shrink-0 transition-colors",
              isCompleted
                ? "text-[oklch(var(--success))] hover:text-[oklch(var(--success)/0.7)]"
                : "text-muted-foreground/40 hover:text-primary",
            )}
            disabled={markComplete.isPending || markPending.isPending}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            ) : (
              <Circle className="w-[18px] h-[18px]" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <PriorityBadge priority={task.priority} size="sm" />
        </div>

        {/* Bottom row: metadata + actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Due date */}
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              overdue
                ? "text-destructive font-medium"
                : dueToday
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
            )}
          >
            {overdue ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
            {formatNanosDate(task.dueDate)}
          </div>

          {/* Reminder */}
          {task.reminder !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Reminder set
            </div>
          )}

          {/* Assignee */}
          {task.assignedTo !== undefined && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-muted-foreground" />
              <AssigneeName principal={task.assignedTo.toString()} />
            </div>
          )}

          {/* Status badge */}
          <div className="ml-auto">
            <StatusBadge status={task.status} size="sm" />
          </div>
        </div>

        {/* Actions (shown on hover) */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </article>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{task.title}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
