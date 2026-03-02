import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
} from "lucide-react";
import { useState } from "react";
import type { Task } from "../backend.d";
import {
  Variant_low_high_medium,
  Variant_pending_completed,
} from "../backend.d";
import { PageWrapper } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import { TaskCard } from "../components/tasks/TaskCard";
import { TaskDetailSheet } from "../components/tasks/TaskDetailSheet";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { useGetCallerUserProfile, useGetMyTasks } from "../hooks/useQueries";
import { isDueToday, isOverdue } from "../utils/taskUtils";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-12 mt-0.5" />
        ) : (
          <p className="font-display text-2xl font-bold text-foreground leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  loading,
  onEdit,
  onView,
  emptyText,
}: {
  title: string;
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  emptyText?: string;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-semibold text-base text-foreground">
          {title}
        </h2>
        {!loading && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {emptyText ?? "No tasks here."}
        </p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id.toString()}
              task={task}
              onEdit={onEdit}
              onView={onView}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);

  const { data: tasks = [], isLoading } = useGetMyTasks();
  const { data: userProfile } = useGetCallerUserProfile();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === Variant_pending_completed.completed,
  );
  const pendingTasks = tasks.filter(
    (t) => t.status === Variant_pending_completed.pending,
  );
  const highPriorityTasks = tasks.filter(
    (t) =>
      t.priority === Variant_low_high_medium.high &&
      t.status === Variant_pending_completed.pending,
  );

  const todayTasks = tasks.filter(
    (t) =>
      isDueToday(t.dueDate) && t.status === Variant_pending_completed.pending,
  );

  const recentlyCompleted = completedTasks
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
    .slice(0, 5);

  const upcomingPending = pendingTasks
    .filter((t) => !isDueToday(t.dueDate) && !isOverdue(t.dueDate, t.status))
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))
    .slice(0, 8);

  const handleEdit = (task: Task) => {
    setEditTask(task);
  };

  const handleView = (task: Task) => {
    setViewTask(task);
    setViewSheetOpen(true);
  };

  const firstName = userProfile?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <Header title="Dashboard" />
      <PageWrapper>
        {/* Welcome + CTA */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Good day, {firstName} 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pendingTasks.length === 0
                ? "You're all caught up! Great work."
                : `You have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? "s" : ""} to tackle.`}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="gap-1.5 shadow-glow"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={ListTodo}
            color="bg-primary/10 text-primary"
            loading={isLoading}
          />
          <StatCard
            label="Completed"
            value={completedTasks.length}
            icon={CheckCircle2}
            color="bg-[oklch(var(--success)/0.15)] text-[oklch(var(--success))]"
            loading={isLoading}
          />
          <StatCard
            label="Pending"
            value={pendingTasks.length}
            icon={Clock}
            color="bg-muted text-muted-foreground"
            loading={isLoading}
          />
          <StatCard
            label="High Priority"
            value={highPriorityTasks.length}
            icon={AlertTriangle}
            color="bg-[oklch(var(--high-priority)/0.1)] text-[oklch(var(--high-priority))]"
            loading={isLoading}
          />
        </div>

        {/* Task sections */}
        <div className="space-y-8">
          <TaskSection
            title="Due Today"
            tasks={todayTasks}
            loading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
            emptyText="Nothing due today — enjoy the breathing room! 🎉"
          />

          <TaskSection
            title="Upcoming"
            tasks={upcomingPending}
            loading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
            emptyText="No upcoming tasks scheduled."
          />

          <TaskSection
            title="Recently Completed"
            tasks={recentlyCompleted}
            loading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
            emptyText="No completed tasks yet."
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 py-4 text-center text-xs text-muted-foreground border-t border-border">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
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
