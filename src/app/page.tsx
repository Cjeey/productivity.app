"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { AlertCircle, Calendar, Clock, Play, Target } from "lucide-react";
import CategoryBadge from "@/components/ui/category-badge";
import PriorityBadge from "@/components/ui/priority-badge";
import StatusBadge from "@/components/ui/status-badge";
import ProgressRing from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_USER_ID } from "@/lib/constants";
import { Category, Task, TaskStatus, TimetableEvent } from "@/lib/types";
import { daysUntil, formatShortDate, greetingByTime, isOverdue, todayTasks } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface DbTaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: string | null;
  category: string | null;
  status: string | null;
}

interface DbDeadlineRow {
  id: string;
  title: string;
  category: string | null;
  due_date: string;
  status: string | null;
  description: string | null;
}

interface DbTimetableRow {
  id: string;
  title: string;
  day: number;
  start_time: string;
  end_time: string;
  category: string | null;
  location: string | null;
}

interface DbSettingsRow {
  preferred_name: string | null;
  theme: "light" | "dark" | null;
}

interface DeadlineSummary {
  id: string;
  title: string;
  dueDate: string;
  category: Category;
  status: TaskStatus;
}

const categoryMap: Record<string, Category> = {
  uni: "Uni",
  work: "Work",
  personal: "Personal",
  classes: "Uni",
  dissertation: "Personal",
};

const statusMap: Record<string, TaskStatus> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const statusToDb: Record<TaskStatus, string> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  Done: "done",
};

const priorityMap = {
  low: "Low",
  medium: "Medium",
  high: "High",
} as const;

const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const mapTask = (row: DbTaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  dueDate: row.due_date,
  priority: priorityMap[(row.priority ?? "medium") as keyof typeof priorityMap] as Task["priority"],
  category: categoryMap[(row.category ?? "personal") as keyof typeof categoryMap],
  status: statusMap[(row.status ?? "todo") as keyof typeof statusMap],
});

const mapDeadline = (row: DbDeadlineRow): DeadlineSummary => ({
  id: row.id,
  title: row.title,
  dueDate: row.due_date,
  category: (categoryMap[(row.category ?? "personal") as keyof typeof categoryMap] ?? "Personal") as Category,
  status: (statusMap[(row.status ?? "todo") as keyof typeof statusMap] ?? "To Do") as TaskStatus,
});

const mapTimetable = (row: DbTimetableRow): TimetableEvent => ({
  id: row.id,
  title: row.title,
  dayOfWeek: dayOptions[row.day] ?? "Monday",
  startTime: row.start_time,
  endTime: row.end_time,
  category: categoryMap[(row.category ?? "personal") as keyof typeof categoryMap] ?? "Personal",
  location: row.location ?? "",
});

export default function DashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineSummary[]>([]);
  const [timetable, setTimetable] = useState<TimetableEvent[]>([]);
  const [settings, setSettings] = useState<{ name: string }>({ name: "Student" });
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("tasks")
      .select<DbTaskRow>("id,title,description,due_date,priority,category,status")
      .eq("user_id", MOCK_USER_ID)
      .order("due_date", { ascending: true })
      .limit(20);
    if (error) {
      toast.error("Unable to load tasks", { description: error.message });
      setTasks([]);
    } else {
      setTasks((data ?? []).map(mapTask));
    }
    setLoadingTasks(false);
  }, [supabase]);

  const fetchDeadlines = useCallback(async () => {
    setLoadingDeadlines(true);
    const { data, error } = await supabase
      .from("deadlines")
      .select<DbDeadlineRow>("id,title,category,due_date,status,description")
      .eq("user_id", MOCK_USER_ID)
      .order("due_date", { ascending: true })
      .limit(4);
    if (error) {
      toast.error("Unable to load deadlines", { description: error.message });
      setDeadlines([]);
    } else {
      setDeadlines((data ?? []).map(mapDeadline));
    }
    setLoadingDeadlines(false);
  }, [supabase]);

  const fetchTimetable = useCallback(async () => {
    setLoadingTimetable(true);
    const { data, error } = await supabase
      .from("timetable_events")
      .select<DbTimetableRow>("id,title,day,start_time,end_time,category,location")
      .eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to load timetable", { description: error.message });
      setTimetable([]);
    } else {
      setTimetable((data ?? []).map(mapTimetable));
    }
    setLoadingTimetable(false);
  }, [supabase]);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from("user_settings")
      .select<DbSettingsRow>("preferred_name,theme")
      .eq("user_id", MOCK_USER_ID)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      toast.error("Unable to load settings", { description: error.message });
    } else {
      setSettings({ name: data?.preferred_name ?? "Student" });
    }
    setLoadingSettings(false);
  }, [supabase]);

  useEffect(() => {
    void fetchTasks();
    void fetchDeadlines();
    void fetchTimetable();
    void fetchSettings();
  }, [fetchDeadlines, fetchSettings, fetchTasks, fetchTimetable]);

  const handleAdvanceTask = async (task: Task) => {
    const order: Task["status"][] = ["To Do", "In Progress", "Done"];
    const currentIdx = order.indexOf(task.status);
    const nextStatus = currentIdx === order.length - 1 ? "Done" : order[currentIdx + 1];
    if (nextStatus === task.status) return;
    setUpdatingTask(task.id);
    const nextStatusDb = statusToDb[nextStatus];
    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatusDb })
      .eq("id", task.id)
      .eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to update task", { description: error.message });
    } else {
      toast.success("Task updated");
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    }
    setUpdatingTask(null);
  };

  const todayLabel = format(new Date(), "EEEE, d MMM");
  const todaysTasks = todayTasks(tasks).slice(0, 5);
  const todayName = format(new Date(), "EEEE");
  const todaysSlots = timetable.filter((slot) => slot.dayOfWeek === todayName);
  const upComings = deadlines
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const completed = tasks.filter((task) => task.status === "Done").length;
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
  const quote = useMemo(() => {
    const quotes = [
      "Progress, not perfection.",
      "One step at a time.",
      "Your future self will thank you.",
      "Consistency is key.",
    ];
    const index = new Date().getDate() % quotes.length;
    return quotes[index];
  }, []);

  const name = !loadingSettings ? settings.name : "Student";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="subtle">{todayLabel}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {greetingByTime(name)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">Here&apos;s your overview for today</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="subtle">Weekly Progress</p>
              <h3 className="text-xl font-semibold text-slate-900">Keep the streak alive</h3>
            </div>
            <Target className="h-6 w-6 text-slate-400" />
          </div>
          {loadingTasks ? (
            <div className="py-6 space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <ProgressRing value={progress} />
                <p className="text-sm text-slate-500">
                  {completed} of {tasks.length || 1} tasks completed
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Stay focused on high-impact tasks today.
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Focus Session</p>
              <h3 className="text-2xl font-semibold tracking-tick">2-hour deep work</h3>
            </div>
            <Clock className="h-6 w-6 opacity-90" />
          </div>
          <p className="text-sm opacity-90 mt-2 mb-6">
            Start a focused block for your dissertation research.
          </p>
          <Link
            href="/focus"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white/95 py-3 text-blue-600 font-semibold hover:bg-white"
          >
            <Play className="h-5 w-5" />
            Start Session
          </Link>
        </div>

        <div className="card p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <p className="subtle">Daily Motivation</p>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Reminder</h3>
            <p className="text-slate-600 italic text-lg leading-relaxed">“{quote}”</p>
          </div>
          <div className="mt-6 rounded-full h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="subtle">Weekly Timetable</p>
              <h3 className="text-xl font-semibold text-slate-900">Today&apos;s Schedule</h3>
            </div>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {loadingTimetable ? (
              Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full rounded-2xl" />)
            ) : todaysSlots.length === 0 ? (
              <p className="subtle">No events for today.</p>
            ) : (
              todaysSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-semibold text-slate-500">{slot.startTime}</div>
                  <div
                    className={`flex-1 rounded-2xl p-3 border ${getTimetableColor(slot.category).border} ${getTimetableColor(slot.category).bg}`}
                  >
                    <p className="text-slate-900 text-sm">{slot.title}</p>
                    <p className="text-xs text-slate-500">
                      {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="subtle">Never miss important coursework</p>
              <h3 className="text-xl font-semibold text-slate-900">Upcoming Deadlines</h3>
            </div>
            <AlertCircle className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {loadingDeadlines ? (
              Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-20 w-full rounded-2xl" />)
            ) : upComings.length === 0 ? (
              <p className="subtle">No deadlines yet.</p>
            ) : (
              upComings.map((deadline) => {
                const daysLeft = daysUntil(deadline.dueDate);
                return (
                  <div
                    key={deadline.id}
                    className="flex items-center rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{deadline.title}</p>
                      <p className="text-slate-500 dark:text-slate-300">
                        {deadline.category} • {deadline.dueDate.slice(0, 10)}
                      </p>
                    </div>
                    <p className="text-right font-semibold text-blue-500">
                      {daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="subtle">Due or overdue items you should ship today.</p>
            <h2 className="section-title">Today&apos;s tasks</h2>
          </div>
        </div>
        <div className="space-y-3">
          {loadingTasks ? (
            Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-20 w-full rounded-2xl" />)
          ) : todaysTasks.length === 0 ? (
            <p className="subtle">No tasks for today. Add some from the Tasks page.</p>
          ) : (
            todaysTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => handleAdvanceTask(task)} disabled={updatingTask === task.id} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

const TaskRow = ({ task, onToggle, disabled }: { task: Task; onToggle: () => void; disabled: boolean }) => {
  const daysLeft = daysUntil(task.dueDate);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-50">{task.title}</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
            <span>{formatShortDate(task.dueDate)}</span>
            <PriorityBadge priority={task.priority} />
            <CategoryBadge category={task.category} />
            {isOverdue(task.dueDate) && <span className="badge bg-red-100 text-red-700">Overdue</span>}
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm text-slate-500">{daysLeft < 0 ? "Overdue" : `${daysLeft} days`}</p>
          <StatusBadge status={task.status} />
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${task.status === "Done" ? 100 : task.status === "In Progress" ? 60 : 25}%` }} />
        </div>
        <button className="btn-ghost px-3 py-1.5" onClick={onToggle} type="button" disabled={disabled}>
          {disabled ? "Updating" : "Advance"}
        </button>
      </div>
    </div>
  );
};

function getTimetableColor(category: Category) {
  const map: Record<Category, { bg: string; border: string }> = {
    Uni: { bg: "bg-blue-50", border: "border-blue-100" },
    Work: { bg: "bg-amber-50", border: "border-amber-100" },
    Personal: { bg: "bg-purple-50", border: "border-purple-100" },
  };
  return map[category] ?? map.Personal;
}
