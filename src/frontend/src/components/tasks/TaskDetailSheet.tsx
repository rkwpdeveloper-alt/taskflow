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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Task } from "../../backend.d";
import { Variant_pending_completed } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAddComment,
  useDeleteComment,
  useDeleteTask,
  useGetTaskActivityLog,
  useGetTaskComments,
  useGetUserProfile,
  useMarkTaskComplete,
  useMarkTaskPending,
} from "../../hooks/useQueries";
import {
  formatNanosDate,
  formatNanosDateTime,
  getInitials,
  getRelativeTime,
  isOverdue,
} from "../../utils/taskUtils";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

function UserName({ principal }: { principal: string }) {
  const { data: profile } = useGetUserProfile(principal);
  return <span>{profile?.name ?? `${principal.slice(0, 12)}…`}</span>;
}

export function TaskDetailSheet({
  task,
  open,
  onClose,
  onEdit,
}: TaskDetailSheetProps) {
  const { identity } = useInternetIdentity();
  const [commentText, setCommentText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">(
    "comments",
  );

  const { data: comments = [], isLoading: commentsLoading } =
    useGetTaskComments(task?.id ?? null);
  const { data: activityLog = [], isLoading: activityLoading } =
    useGetTaskActivityLog(task?.id ?? null);

  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const markComplete = useMarkTaskComplete();
  const markPending = useMarkTaskPending();
  const deleteTask = useDeleteTask();

  if (!task) return null;

  const isCompleted = task.status === Variant_pending_completed.completed;
  const overdue = isOverdue(task.dueDate, task.status);
  const isOwner =
    identity?.getPrincipal().toString() === task.createdBy.toString();

  const handleStatusToggle = async () => {
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({
        taskId: task.id,
        text: commentText.trim(),
      });
      setCommentText("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Task deleted");
      onClose();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <SheetTitle className="font-display text-xl leading-snug flex-1">
                {task.title}
              </SheetTitle>
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      onEdit(task);
                      onClose();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status toggle + badges */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleStatusToggle}
                disabled={markComplete.isPending || markPending.isPending}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[oklch(var(--success))]" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {isCompleted ? "Mark pending" : "Mark complete"}
              </Button>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-5">
              {/* Description */}
              {task.description && (
                <div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-medium">Due</span>
                    <span
                      className={`text-xs ml-auto ${overdue ? "text-destructive font-medium" : "text-foreground"}`}
                    >
                      {formatNanosDate(task.dueDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-medium">Created</span>
                    <span className="text-xs text-foreground ml-auto">
                      {formatNanosDate(task.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-medium">Author</span>
                    <span className="text-xs text-foreground ml-auto truncate max-w-[80px]">
                      <UserName principal={task.createdBy.toString()} />
                    </span>
                  </div>
                  {task.assignedTo && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-medium">Assigned</span>
                      <span className="text-xs text-foreground ml-auto truncate max-w-[80px]">
                        <UserName principal={task.assignedTo.toString()} />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {task.reminder !== undefined && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5 rounded-md bg-muted/50 border border-border">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    Reminder set for {formatNanosDateTime(task.reminder)}
                  </span>
                </div>
              )}

              <Separator />

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("comments")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "comments"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments {comments.length > 0 && `(${comments.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "activity"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Activity
                </button>
              </div>

              {/* Comments */}
              {activeTab === "comments" && (
                <div className="space-y-3">
                  {commentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const isCommentOwner =
                          identity?.getPrincipal().toString() ===
                          comment.userId.toString();
                        return (
                          <div
                            key={comment.id.toString()}
                            className="flex gap-3 group/comment"
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                ?
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium text-foreground truncate">
                                  <UserName
                                    principal={comment.userId.toString()}
                                  />
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {getRelativeTime(comment.createdAt)}
                                </span>
                                {isCommentOwner && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteComment.mutate({
                                        commentId: comment.id,
                                        taskId: task.id,
                                      })
                                    }
                                    className="ml-auto opacity-0 group-hover/comment:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add comment */}
                  <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 text-sm h-9"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9"
                      disabled={!commentText.trim() || addComment.isPending}
                    >
                      {addComment.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Activity */}
              {activeTab === "activity" && (
                <div className="space-y-2">
                  {activityLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : activityLog.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No activity recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {[...activityLog]
                        .sort(
                          (a, b) => Number(b.timestamp) - Number(a.timestamp),
                        )
                        .map((log, i) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: activity log has no stable id
                            key={i}
                            className="flex items-start gap-3 text-xs"
                          >
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground">
                                {log.action}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-muted-foreground">
                                  by{" "}
                                </span>
                                <span className="text-muted-foreground">
                                  <UserName principal={log.userId.toString()} />
                                </span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">
                                  {getRelativeTime(log.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
              onClick={handleDeleteTask}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
