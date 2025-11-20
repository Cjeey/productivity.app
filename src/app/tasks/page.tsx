"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CategoryBadge from "@/components/ui/category-badge";
import PriorityBadge from "@/components/ui/priority-badge";
import StatusBadge from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_USER_ID } from "@/lib/constants";
import { Category, Priority, Task, TaskStatus } from "@/lib/types";
import { formatShortDate, isOverdue } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const priorityOptions: Priority[] = ["High", "Medium", "Low"];
const categoryOptions: Category[] = ["Uni", "Work", "Personal"];
const statusColumns: TaskStatus[] = ["To Do", "In Progress", "Done"];

interface TaskFormState {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
}

interface DbTaskRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  due_date: string | null;
  status: string | null;
  created_at: string;
}

const statusToDb: Record<TaskStatus, string> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  Done: "done",
};

const dbToStatus: Record<string, TaskStatus> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const priorityToDb: Record<Priority, string> = {
  High: "high",
  Medium: "medium",
  Low: "low",
};

const dbToPriority: Record<string, Priority> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const buildInitialForm = (): TaskFormState => ({
  title: "",
  description: "",
  category: "Uni",
  priority: "Medium",
  status: "To Do",
  dueDate: new Date().toISOString().slice(0, 10),
});

function mapRowToTask(row: DbTaskRow): Task {
  const normalizedPriority = (row.priority ?? "medium") as keyof typeof dbToPriority;
  const normalizedStatus = (row.status ?? "todo") as keyof typeof dbToStatus;
  const normalizedCategory = (row.category ?? "uni").toLowerCase();

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: (normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)) as Category,
    priority: dbToPriority[normalizedPriority],
    status: dbToStatus[normalizedStatus],
    dueDate: row.due_date ?? new Date().toISOString(),
  };
}

function validateTask(values: TaskFormState) {
  const errors: Partial<Record<keyof TaskFormState, string>> = {};
  if (!values.title.trim()) {
    errors.title = "Title is required";
  }
  if (!values.dueDate) {
    errors.dueDate = "Pick a due date";
  } else if (Number.isNaN(new Date(values.dueDate).getTime())) {
    errors.dueDate = "Invalid date";
  }
  return errors;
}

export default function TasksPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormState, string>>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskFormState>(buildInitialForm());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,description,category,priority,due_date,status,created_at")
      .eq("user_id", MOCK_USER_ID)
      .order("due_date", { ascending: true });

    if (error) {
      toast.error("Unable to load tasks", { description: error.message });
      setTasks([]);
    } else {
      const rows = (data ?? []) as DbTaskRow[];
      setTasks(rows.map(mapRowToTask));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateTask(newTask);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Fix validation errors before submitting");
      return;
    }
    setSubmitting(true);
    const payload = {
      title: newTask.title.trim(),
      description: newTask.description.trim() || null,
      category: newTask.category.toLowerCase(),
      priority: priorityToDb[newTask.priority],
      status: statusToDb[newTask.status],
      due_date: newTask.dueDate,
      user_id: MOCK_USER_ID,
    };
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    if (error) {
      toast.error("Unable to create task", { description: error.message });
    } else if (data) {
      toast.success("Task added");
      setTasks((prev) => [mapRowToTask(data as DbTaskRow), ...prev]);
      setNewTask(buildInitialForm());
      setErrors({});
    }
    setSubmitting(false);
  };

  const handleAdvance = async (task: Task) => {
    const order: TaskStatus[] = ["To Do", "In Progress", "Done"];
    const currentIndex = order.indexOf(task.status);
    const nextStatus = currentIndex === order.length - 1 ? "Done" : order[currentIndex + 1];
    if (nextStatus === task.status) return;
    setStatusLoading(task.id);
    const { error } = await supabase
      .from("tasks")
      .update({ status: statusToDb[nextStatus] })
      .eq("id", task.id)
      .eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to update task", { description: error.message });
    } else {
      toast.success("Task updated");
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    }
    setStatusLoading(null);
  };

  const handleDelete = async (taskId: string) => {
    const confirmed = window.confirm("Delete this task? This cannot be undone.");
    if (!confirmed) return;
    setDeletingId(taskId);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to delete task", { description: error.message });
    } else {
      toast.success("Task deleted");
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    }
    setDeletingId(null);
  };

  const grouped = useMemo(() => {
    return statusColumns.map((col) => ({
      status: col,
      items: tasks.filter((task) => task.status === col),
    }));
  }, [tasks]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="subtle">AI dissertation & coursework tracker</p>
          <h1 className="section-title text-2xl">Project Management Board</h1>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            const ref = document.getElementById("new-task-title");
            ref?.scrollIntoView({ behavior: "smooth" });
            (ref as HTMLInputElement | null)?.focus();
          }}
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="soft-card p-4 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-28" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((column) => (
            <div key={column.status} className="soft-card p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Column</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{column.status}</p>
                </div>
                <span className="badge">{column.items.length}</span>
              </div>
              <div className="space-y-3 flex-1">
                {column.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onAdvance={() => handleAdvance(task)}
                    onDelete={() => handleDelete(task.id)}
                    advancing={statusLoading === task.id}
                    deleting={deletingId === task.id}
                  />
                ))}
                {column.items.length === 0 && <p className="subtle">No tasks</p>}
              </div>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400"
                onClick={() => {
                  const ref = document.getElementById("new-task-title");
                  ref?.scrollIntoView({ behavior: "smooth" });
                  (ref as HTMLInputElement | null)?.focus();
                }}
              >
                + Add Card
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-5 space-y-3" id="new-task-form">
        <p className="font-semibold text-slate-900 dark:text-slate-50">Quick add</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="label" htmlFor="new-task-title">
              Title
            </label>
            <input
              id="new-task-title"
              className={`input ${errors.title ? "border-red-500" : ""}`}
              value={newTask.title}
              onChange={(e) => {
                setNewTask({ ...newTask, title: e.target.value });
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Research transfer learning"
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="input"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Add supporting details"
            />
          </div>
          <div className="space-y-1">
            <label className="label">Category</label>
            <select
              className="input"
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value as Category })}
            >
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Priority</label>
            <select
              className="input"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
            >
              {priorityOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Status</label>
            <select
              className="input"
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
            >
              {statusColumns.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Due date</label>
            <input
              type="date"
              className={`input ${errors.dueDate ? "border-red-500" : ""}`}
              value={newTask.dueDate}
              onChange={(e) => {
                setNewTask({ ...newTask, dueDate: e.target.value });
                setErrors((prev) => ({ ...prev, dueDate: undefined }));
              }}
            />
            {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full md:w-auto" disabled={submitting}>
          {submitting ? "Adding..." : "Add task"}
        </button>
      </form>
    </div>
  );
}

function TaskCard({
  task,
  onAdvance,
  onDelete,
  advancing,
  deleting,
}: {
  task: Task;
  onAdvance: () => void;
  onDelete: () => void;
  advancing: boolean;
  deleting: boolean;
}) {
  const busyness = task.status === "Done" ? 100 : task.status === "In Progress" ? 60 : 25;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 overflow-hidden">
          <p className="font-semibold text-slate-900 dark:text-slate-50 text-ellipsis overflow-hidden whitespace-nowrap">
            {task.title}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2">{task.description || "No details"}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
        <CategoryBadge category={task.category} />
        <PriorityBadge priority={task.priority} />
        <span className="pill bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {formatShortDate(task.dueDate)}
        </span>
        {isOverdue(task.dueDate) && (
          <span className="pill bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">Overdue</span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-brand-500" style={{ width: `${busyness}%` }} />
        </div>
        <div className="flex items-center gap-2 ml-3">
          <button className="btn-ghost px-2 py-1 text-xs" type="button" onClick={onAdvance} disabled={advancing || task.status === "Done"}>
            {advancing ? "..." : "Advance"}
          </button>
          <button
            className="btn-ghost px-2 py-1 text-xs text-red-500 hover:text-red-600"
            type="button"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
