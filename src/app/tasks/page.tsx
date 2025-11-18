"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import CategoryBadge from "@/components/ui/category-badge";
import PriorityBadge from "@/components/ui/priority-badge";
import StatusBadge from "@/components/ui/status-badge";
import { useAppStore } from "@/lib/store";
import { Category, Priority, TaskStatus, Task } from "@/lib/types";
import { formatShortDate, isOverdue } from "@/lib/utils";

const priorityOptions: Priority[] = ["High", "Medium", "Low"];
const categoryOptions: Category[] = ["Uni", "Work", "Personal"];
const statusColumns: TaskStatus[] = ["To Do", "In Progress", "Done"];

export default function TasksPage() {
  const { tasks, addTask, deleteTask, toggleTaskStatus } = useAppStore();
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    category: "Uni",
    priority: "Medium",
    status: "To Do",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const grouped = useMemo(() => {
    return statusColumns.map((col) => ({
      status: col,
      items: tasks.filter((task) => task.status === col),
    }));
  }, [tasks]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addTask({
      ...newTask,
      dueDate: new Date(newTask.dueDate).toISOString(),
    });
    setNewTask((prev) => ({ ...prev, title: "", description: "" }));
  };

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

      <div className="grid gap-4 md:grid-cols-3">
        {grouped.map((column) => (
          <div key={column.status} className="soft-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{column.status}</p>
              <span className="badge">{column.items.length}</span>
            </div>
            <div className="space-y-3">
              {column.items.map((task) => (
                <TaskCard key={task.id} task={task} toggle={toggleTaskStatus} remove={deleteTask} />
              ))}
              {column.items.length === 0 && <p className="subtle">No tasks</p>}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-3" id="new-task-form">
        <p className="font-semibold text-slate-900 dark:text-slate-50">Quick add</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="label" htmlFor="new-task-title">
              Title
            </label>
            <input
              id="new-task-title"
              className="input"
              value={newTask.title}
              required
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Research transfer learning"
            />
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
              className="input"
              value={newTask.dueDate?.slice(0, 10)}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full md:w-auto">
          Add task
        </button>
      </form>
    </div>
  );
}

function TaskCard({
  task,
  toggle,
  remove,
}: {
  task: Task;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-50">{task.title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-300">{task.description || "No details"}</p>
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
          <div
            className="h-2 rounded-full bg-brand-500"
            style={{ width: `${task.status === "Done" ? 100 : task.status === "In Progress" ? 60 : 25}%` }}
          />
        </div>
        <div className="flex items-center gap-2 ml-3">
          <button className="btn-ghost px-2 py-1 text-xs" type="button" onClick={() => toggle(task.id)}>
            Advance
          </button>
          <button
            className="btn-ghost px-2 py-1 text-xs text-red-500 hover:text-red-600"
            type="button"
            onClick={() => remove(task.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
