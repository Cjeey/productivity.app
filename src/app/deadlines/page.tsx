"use client";

import { useState } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import CategoryBadge from "@/components/ui/category-badge";
import StatusBadge from "@/components/ui/status-badge";
import { useAppStore } from "@/lib/store";
import { Category, Deadline, TaskStatus } from "@/lib/types";
import { daysUntil, formatShortDate } from "@/lib/utils";

const categoryOptions: Category[] = ["Uni", "Work", "Personal"];
const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Done"];

export default function DeadlinesPage() {
  const { deadlines, addDeadline, updateDeadline, deleteDeadline } = useAppStore();
  const [newDeadline, setNewDeadline] = useState<Omit<Deadline, "id">>({
    title: "",
    category: "Uni",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "To Do",
    description: "",
  });

  const ordered = [...deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addDeadline({
      ...newDeadline,
      dueDate: new Date(newDeadline.dueDate).toISOString(),
    });
    setNewDeadline((prev) => ({ ...prev, title: "" }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="subtle">Track all your coursework and dissertation deadlines</p>
        <h1 className="section-title text-2xl">Deadlines</h1>
      </header>

      <section className="space-y-4">
        <div className="card p-5 space-y-3">
          <p className="font-semibold text-slate-900 dark:text-slate-50">Add deadline</p>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
            <input
              className="input md:col-span-2"
              placeholder="Machine Learning Coursework"
              value={newDeadline.title}
              required
              onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
            />
            <select
              className="input"
              value={newDeadline.category}
              onChange={(e) => setNewDeadline({ ...newDeadline, category: e.target.value as Category })}
            >
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <input
              type="date"
              className="input"
              value={newDeadline.dueDate?.slice(0, 10)}
              onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })}
            />
            <select
              className="input"
              value={newDeadline.status}
              onChange={(e) => setNewDeadline({ ...newDeadline, status: e.target.value as TaskStatus })}
            >
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <input
              className="input md:col-span-3"
              placeholder="Description"
              value={newDeadline.description || ""}
              onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
            />
            <button type="submit" className="btn-primary w-full md:w-auto">
              Add
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <h2 className="section-title">Upcoming Deadlines</h2>
          {ordered.map((deadline) => {
            const daysLeft = daysUntil(deadline.dueDate);
            const tone = daysLeft <= 3 ? "text-orange-500" : daysLeft <= 7 ? "text-amber-500" : "text-emerald-600";
            return (
              <div
                key={deadline.id}
                className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{deadline.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{deadline.description ?? ""}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-300">
                      <CalendarDays className="h-4 w-4" />
                      <span>{formatShortDate(deadline.dueDate)}</span>
                      <CategoryBadge category={deadline.category} />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className={`text-sm font-semibold ${tone}`}>{daysLeft < 0 ? "Overdue" : `${daysLeft} days`}</p>
                    <StatusBadge status={deadline.status} />
                    <select
                      className="input text-xs"
                      value={deadline.status}
                      onChange={(e) => updateDeadline(deadline.id, { status: e.target.value as TaskStatus })}
                    >
                      {statusOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <button
                      className="btn-ghost text-red-500 hover:text-red-600 text-xs"
                      onClick={() => deleteDeadline(deadline.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {ordered.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <AlertCircle className="h-4 w-4" />
              No deadlines yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
