import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, LayoutGrid, List, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import { Variant_pending_completed } from "../backend.d";
import { PageWrapper } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import { TaskCard } from "../components/tasks/TaskCard";
import { TaskDetailSheet } from "../components/tasks/TaskDetailSheet";
import {
  type FilterState,
  TaskFilters,
  applyFilters,
} from "../components/tasks/TaskFilters";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import {
  useGetAllTasks,
  useGetMembers,
  useGetMyTasks,
  useMarkTaskComplete,
  useMarkTaskPending,
} from "../hooks/useQueries";

type ViewMode = "list" | "kanban";

interface TaskListPageProps {
  mode: "my" | "all";
}

function KanbanColumn({
  title,
  tasks,
  status,
  onEdit,
  onView,
  onDrop,
}: {
  title: string;
  tasks: Task[];
  status: Variant_pending_completed;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDrop: (taskId: bigint, newStatus: Variant_pending_completed) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDrop(BigInt(taskId), status);
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className={`w-2 h-2 rounded-full ${
            status === Variant_pending_completed.completed
              ? "bg-[oklch(var(--success))]"
              : "bg-muted-foreground"
          }`}
        />
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div
        className={`flex-1 space-y-2.5 min-h-32 p-2 rounded-xl border-2 border-dashed transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-transparent bg-muted/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id.toString()}
            task={task}
            onEdit={onEdit}
            onView={onView}
            draggable
            onDragStart={(e, t) => {
              e.dataTransfer.setData("taskId", t.id.toString());
            }}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskListPage({ mode }: TaskListPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: "all",
    status: "all",
    assignee: "all",
    sortOrder: "asc",
  });

  const { data: myTasks = [], isLoading: myLoading } = useGetMyTasks();
  const { data: allTasks = [], isLoading: allLoading } = useGetAllTasks();
  const { data: members = [] } = useGetMembers();
  const markComplete = useMarkTaskComplete();
  const markPending = useMarkTaskPending();

  const rawTasks = mode === "all" ? allTasks : myTasks;
  const isLoading = mode === "all" ? allLoading : myLoading;
  const title = mode === "all" ? "All Tasks" : "My Tasks";

  const filteredTasks = applyFilters(rawTasks, filters);

  const memberOptions = members.map((m) => ({
    principal: m.principal.toString(),
    name: undefined as string | undefined,
  }));

  const handleEdit = (task: Task) => {
    setEditTask(task);
  };

  const handleView = (task: Task) => {
    setViewTask(task);
    setViewSheetOpen(true);
  };

  const handleKanbanDrop = async (
    taskId: bigint,
    newStatus: Variant_pending_completed,
  ) => {
    const task = rawTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      if (newStatus === Variant_pending_completed.completed) {
        await markComplete.mutateAsync(taskId);
        toast.success("Task completed! 🎉");
      } else {
        await markPending.mutateAsync(taskId);
        toast.success("Task moved to pending");
      }
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const pendingTasks = filteredTasks.filter(
    (t) => t.status === Variant_pending_completed.pending,
  );
  const completedTasks = filteredTasks.filter(
    (t) => t.status === Variant_pending_completed.completed,
  );

  return (
    <>
      <Header title={title} />
      <PageWrapper>
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1">
            <h2 className="font-display font-semibold text-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-24 inline-block" />
              ) : (
                `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-7 p-0 ${viewMode === "list" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-7 p-0 ${viewMode === "kanban" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"}`}
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <TaskFilters
            filters={filters}
            onChange={setFilters}
            members={memberOptions}
          />
        </div>

        {/* Task display */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="flex gap-3 pl-8">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <GripVertical className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No tasks found
            </p>
            <p className="text-xs text-muted-foreground">
              {filters.search ||
              filters.priority !== "all" ||
              filters.status !== "all"
                ? "Try adjusting your filters"
                : "Create your first task to get started"}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id.toString()}
                task={task}
                onEdit={handleEdit}
                onView={handleView}
                draggable
                onDragStart={(e, t) => {
                  e.dataTransfer.setData("taskId", t.id.toString());
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <KanbanColumn
              title="Pending"
              tasks={pendingTasks}
              status={Variant_pending_completed.pending}
              onEdit={handleEdit}
              onView={handleView}
              onDrop={handleKanbanDrop}
            />
            <KanbanColumn
              title="Completed"
              tasks={completedTasks}
              status={Variant_pending_completed.completed}
              onEdit={handleEdit}
              onView={handleView}
              onDrop={handleKanbanDrop}
            />
          </div>
        )}
      </PageWrapper>

      <TaskFormModal
        open={createOpen || editTask !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditTask(null);
        }}
        editTask={editTask}
      />

      <TaskDetailSheet
        task={viewTask}
        open={viewSheetOpen}
        onClose={() => {
          setViewSheetOpen(false);
          setViewTask(null);
        }}
        onEdit={handleEdit}
      />
    </>
  );
}
