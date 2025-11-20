"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import CategoryBadge from "@/components/ui/category-badge";
import StatusBadge from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_USER_ID } from "@/lib/constants";
import { Category, Deadline, TaskStatus } from "@/lib/types";
import { daysUntil, formatShortDate } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const categoryOptions: Category[] = ["Uni", "Work", "Personal"];
const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Done"];

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

const buildInitialForm = () => ({
  title: "",
  category: "Uni" as Category,
  dueDate: new Date().toISOString().slice(0, 10),
  status: "To Do" as TaskStatus,
  description: "",
});

interface DbDeadlineRow {
  id: string;
  title: string;
  category: string | null;
  due_date: string | null;
  status: string | null;
  description: string | null;
  created_at: string;
}

function mapRow(row: DbDeadlineRow): Deadline {
  const normalizedCategory = (row.category ?? "uni").toLowerCase();
  return {
    id: row.id,
    title: row.title,
    category: (normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)) as Category,
    dueDate: row.due_date ?? new Date().toISOString(),
    status: dbToStatus[row.status ?? "todo"],
    description: row.description ?? "",
  };
}

interface FormErrors {
  title?: string;
  dueDate?: string;
}

export default function DeadlinesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(buildInitialForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deadlines")
      .select<DbDeadlineRow>("id,title,category,due_date,status,description,created_at")
      .eq("user_id", MOCK_USER_ID)
      .order("due_date", { ascending: true });
    if (error) {
      toast.error("Unable to load deadlines", { description: error.message });
      setDeadlines([]);
    } else {
      setDeadlines((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchDeadlines();
  }, [fetchDeadlines]);

  const validate = () => {
    const validation: FormErrors = {};
    if (!form.title.trim()) validation.title = "Title is required";
    if (!form.dueDate) {
      validation.dueDate = "Due date required";
    } else if (Number.isNaN(new Date(form.dueDate).getTime())) {
      validation.dueDate = "Invalid date";
    }
    return validation;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Fix validation errors");
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      category: form.category.toLowerCase(),
      due_date: form.dueDate,
      status: statusToDb[form.status],
      description: form.description.trim() || null,
      user_id: MOCK_USER_ID,
    };
    const { data, error } = await supabase.from("deadlines").insert(payload).select<DbDeadlineRow>().single();
    if (error) {
      toast.error("Unable to create deadline", { description: error.message });
    } else if (data) {
      toast.success("Deadline added");
      setDeadlines((prev) => [mapRow(data), ...prev]);
      setForm(buildInitialForm());
      setErrors({});
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("deadlines")
      .update({ status: statusToDb[status] })
      .eq("id", id)
      .eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to update deadline", { description: error.message });
    } else {
      toast.success("Deadline updated");
      setDeadlines((prev) => prev.map((deadline) => (deadline.id === id ? { ...deadline, status } : deadline)));
    }
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this deadline?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("deadlines").delete().eq("id", id).eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to delete deadline", { description: error.message });
    } else {
      toast.success("Deadline removed");
      setDeadlines((prev) => prev.filter((deadline) => deadline.id !== id));
    }
    setDeletingId(null);
  };

  const ordered = useMemo(
    () => [...deadlines].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [deadlines]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="subtle">Track all your coursework and dissertation deadlines</p>
        <h1 className="section-title text-2xl">Deadlines</h1>
      </header>

      <section className="space-y-6">
        <div className="card p-5 space-y-4">
          <div>
            <p className="subtle">Add deadline</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Stay ahead of submissions</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2 space-y-1">
              <input
                className={`input ${errors.title ? "border-red-500" : ""}`}
                placeholder="Machine Learning Coursework"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            >
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="space-y-1">
              <input
                type="date"
                className={`input ${errors.dueDate ? "border-red-500" : ""}`}
                value={form.dueDate}
                onChange={(e) => {
                  setForm({ ...form, dueDate: e.target.value });
                  setErrors((prev) => ({ ...prev, dueDate: undefined }));
                }}
              />
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
            </div>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            >
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="md:col-span-3">
              <input
                className="input"
                placeholder="Add context or notes"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full md:w-auto" disabled={submitting}>
              {submitting ? "Saving..." : "Add deadline"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="section-title">Upcoming Deadlines</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : ordered.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <AlertCircle className="h-4 w-4" /> No deadlines yet.
            </div>
          ) : (
            ordered.map((deadline) => {
              const daysLeft = daysUntil(deadline.dueDate);
              const tone =
                daysLeft <= 3
                  ? "text-red-500 bg-red-50"
                  : daysLeft <= 7
                  ? "text-orange-500 bg-orange-50"
                  : "text-emerald-600 bg-emerald-50";
              return (
                <div
                  key={deadline.id}
                  className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-50 text-ellipsis overflow-hidden line-clamp-2">
                          {deadline.title}
                        </p>
                        <p className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                          {daysLeft < 0 ? "Overdue" : `${daysLeft} days remaining`}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2">
                        {deadline.description || "No description"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                        <span className="font-medium">{formatShortDate(deadline.dueDate)}</span>
                        <span>•</span>
                        <CategoryBadge category={deadline.category} />
                        <StatusBadge status={deadline.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <select
                          className="input text-xs md:w-auto"
                          value={deadline.status}
                          onChange={(e) => handleStatusChange(deadline.id, e.target.value as TaskStatus)}
                          disabled={updatingId === deadline.id}
                        >
                          {statusOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                        <button
                          className="btn-ghost text-red-500 hover:text-red-600 text-xs"
                          onClick={() => handleDelete(deadline.id)}
                          type="button"
                          disabled={deletingId === deadline.id}
                        >
                          {deletingId === deadline.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
