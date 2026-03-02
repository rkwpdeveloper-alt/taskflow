import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { Task } from "../backend.d";
import { Variant_pending_completed } from "../backend.d";
import { PageWrapper } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import { PriorityBadge } from "../components/tasks/PriorityBadge";
import { TaskDetailSheet } from "../components/tasks/TaskDetailSheet";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { useGetMyTasks } from "../hooks/useQueries";
import { nanosToDate } from "../utils/taskUtils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const days: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month fill
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrev - i);
    days.push({ date: d, isCurrentMonth: false, isToday: false });
  }

  // Current month
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    days.push({ date, isCurrentMonth: true, isToday });
  }

  // Next month fill (to complete 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return days;
}

function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((task) => {
    const due = nanosToDate(task.dueDate);
    return (
      due.getFullYear() === date.getFullYear() &&
      due.getMonth() === date.getMonth() &&
      due.getDate() === date.getDate()
    );
  });
}

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);

  const { data: tasks = [], isLoading } = useGetMyTasks();
  const days = getCalendarDays(year, month);

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const selectedDayTasks = selectedDate
    ? getTasksForDate(tasks, selectedDate)
    : [];

  return (
    <>
      <Header title="Calendar" />
      <PageWrapper>
        <div className="flex flex-col xl:flex-row gap-5">
          {/* Calendar grid */}
          <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-card">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-foreground">
                {MONTHS[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => {
                    setMonth(today.getMonth());
                    setYear(today.getFullYear());
                    setSelectedDate(today);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-[10px] font-semibold text-muted-foreground text-center py-1.5 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: 42 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px">
                {days.map(({ date, isCurrentMonth, isToday }, i) => {
                  const dayTasks = getTasksForDate(tasks, date);
                  const isSelected =
                    selectedDate !== null &&
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();

                  return (
                    <button
                      // biome-ignore lint/suspicious/noArrayIndexKey: calendar days are positional
                      key={i}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "min-h-[56px] sm:min-h-[68px] p-1.5 rounded-lg flex flex-col items-start text-left transition-all duration-100",
                        isCurrentMonth
                          ? "bg-background hover:bg-muted/50"
                          : "bg-transparent opacity-40",
                        isSelected && "bg-primary/10 ring-1 ring-primary",
                        isToday && !isSelected && "ring-1 ring-primary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold leading-none mb-1.5 w-5 h-5 flex items-center justify-center rounded-full",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                        {dayTasks.slice(0, 2).map((task) => (
                          <span
                            key={task.id.toString()}
                            className={cn(
                              "text-[9px] leading-tight px-1 py-0.5 rounded truncate block w-full",
                              task.status ===
                                Variant_pending_completed.completed
                                ? "bg-[oklch(var(--success)/0.15)] text-[oklch(var(--success))]"
                                : "bg-primary/15 text-primary",
                            )}
                          >
                            {task.title}
                          </span>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="text-[9px] text-muted-foreground px-1">
                            +{dayTasks.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side panel: selected day tasks */}
          <div className="xl:w-72 bg-card border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-foreground">
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select a day"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {selectedDate === null ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click a day to see its tasks
              </p>
            ) : selectedDayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tasks on this day
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedDayTasks.map((task) => (
                  <button
                    type="button"
                    key={task.id.toString()}
                    onClick={() => {
                      setViewTask(task);
                      setViewSheetOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p
                        className={cn(
                          "text-sm font-medium text-foreground leading-snug flex-1",
                          task.status === Variant_pending_completed.completed &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </p>
                    </div>
                    <PriorityBadge priority={task.priority} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
        onEdit={setEditTask}
      />
    </>
  );
}
