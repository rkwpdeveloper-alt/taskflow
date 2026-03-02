import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task, TaskInput } from "../../backend.d";
import { Variant_low_high_medium } from "../../backend.d";
import {
  useCreateTask,
  useGetMembers,
  useUpdateTask,
} from "../../hooks/useQueries";
import {
  dateToNanos,
  nanosToDateInputValue,
  nanosToDatetimeLocalValue,
  nanosToTimeInputValue,
} from "../../utils/taskUtils";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

export function TaskFormModal({ open, onClose, editTask }: TaskFormModalProps) {
  const { data: members = [] } = useGetMembers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Variant_low_high_medium>(
    Variant_low_high_medium.medium,
  );
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("09:00");
  const [assignedTo, setAssignedTo] = useState<string>("none");
  const [reminder, setReminder] = useState("");

  // Populate form when editing
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resets on open change
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setPriority(editTask.priority);
      setDueDate(nanosToDateInputValue(editTask.dueDate));
      setDueTime(nanosToTimeInputValue(editTask.dueDate));
      setAssignedTo(
        editTask.assignedTo ? editTask.assignedTo.toString() : "none",
      );
      setReminder(
        editTask.reminder ? nanosToDatetimeLocalValue(editTask.reminder) : "",
      );
    } else {
      // Reset form
      setTitle("");
      setDescription("");
      setPriority(Variant_low_high_medium.medium);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split("T")[0]);
      setDueTime("09:00");
      setAssignedTo("none");
      setReminder("");
    }
  }, [editTask, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }

    // Build dueDate as nanoseconds
    const dueDateObj = new Date(`${dueDate}T${dueTime || "09:00"}:00`);
    const dueDateNanos = dateToNanos(dueDateObj);

    // Build reminder nanos
    let reminderNanos: bigint | undefined;
    if (reminder) {
      reminderNanos = dateToNanos(new Date(reminder));
    }

    // Build assignedTo Principal
    let assignedToPrincipal: Principal | undefined;
    if (assignedTo !== "none") {
      const { Principal } = await import("@dfinity/principal");
      assignedToPrincipal = Principal.fromText(assignedTo);
    }

    const taskInput: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDateNanos,
      assignedTo: assignedToPrincipal,
      reminder: reminderNanos,
    };

    try {
      if (editTask) {
        await updateTask.mutateAsync({ taskId: editTask.id, taskInput });
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync(taskInput);
        toast.success("Task created successfully");
      }
      onClose();
    } catch {
      toast.error(editTask ? "Failed to update task" : "Failed to create task");
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Priority + Assign row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Variant_low_high_medium)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Variant_low_high_medium.high}>
                    🔴 High
                  </SelectItem>
                  <SelectItem value={Variant_low_high_medium.medium}>
                    🟡 Medium
                  </SelectItem>
                  <SelectItem value={Variant_low_high_medium.low}>
                    🔵 Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem
                      key={member.principal.toString()}
                      value={member.principal.toString()}
                    >
                      {member.principal.toString().slice(0, 14)}…
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-1.5">
            <Label htmlFor="reminder">Reminder (optional)</Label>
            <Input
              id="reminder"
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
