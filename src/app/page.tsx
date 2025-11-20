"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isToday, parseISO } from "date-fns";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, Calendar, CheckCircle2, Clock, Flame, Play, Sparkles, Target } from "lucide-react";
import CategoryBadge from "@/components/ui/category-badge";
import PriorityBadge from "@/components/ui/priority-badge";
import StatusBadge from "@/components/ui/status-badge";
import ProgressRing from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_USER_ID } from "@/lib/constants";
import { Category, FocusSession, Task, TaskStatus } from "@/lib/types";
import { daysUntil, focusMinutesThisWeek, formatShortDate, greetingByTime, isOverdue, todayTasks } from "@/lib/utils";
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

interface DbFocusSessionRow {
  id: string;
  duration_minutes: number;
  session_date: string | null;
  created_at: string;
}

type DashboardTimetableEvent = {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  category: Category;
  location?: string;
};

interface DeadlineSummary {
  id: string;
  title: string;
  dueDate: string;
  category: Category;
  status: TaskStatus;
}

interface DashboardSettings {
  name: string;
  dailyFocusTargetMinutes: number;
  timezone: string;
}

const categoryMap: Record<string, Category> = {
  uni: "Uni",
  work: "Work",
  personal: "Personal",
  classes: "Uni",
  dissertation: "Personal",
  home: "Personal",
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

const defaultSettings: DashboardSettings = {
  name: "Student",
  dailyFocusTargetMinutes: 120,
  timezone: "UTC",
};

const normalizeCategory = (value: string | null): Category => {
  const normalized = (value ?? "personal").toLowerCase();
  return categoryMap[normalized] ?? "Personal";
};

const normalizeStatus = (value: string | null): TaskStatus => {
  const normalized = (value ?? "todo").toLowerCase();
  return statusMap[normalized] ?? "To Do";
};

const mapTask = (row: DbTaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  dueDate: row.due_date,
  priority: priorityMap[(row.priority ?? "medium") as keyof typeof priorityMap] as Task["priority"],
  category: normalizeCategory(row.category),
  status: normalizeStatus(row.status),
});

const mapDeadline = (row: DbDeadlineRow): DeadlineSummary => ({
  id: row.id,
  title: row.title,
  dueDate: row.due_date,
  category: normalizeCategory(row.category),
  status: normalizeStatus(row.status),
});

const mapTimetable = (row: DbTimetableRow): DashboardTimetableEvent => ({
  id: row.id,
  title: row.title,
  dayOfWeek: dayOptions[row.day] ?? "Monday",
  startTime: row.start_time,
  endTime: row.end_time,
  category: normalizeCategory(row.category),
  location: row.location ?? "",
});

const mapFocusSession = (row: DbFocusSessionRow): FocusSession => ({
  id: row.id,
  startTime: row.session_date ?? row.created_at,
  endTime: row.session_date ?? row.created_at,
  durationMinutes: row.duration_minutes ?? 0,
});

export default function DashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineSummary[]>([]);
  const [timetable, setTimetable] = useState<DashboardTimetableEvent[]>([]);
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingFocus, setLoadingFocus] = useState(true);
  const [focusStats, setFocusStats] = useState({ todayMinutes: 0, weekMinutes: 0 });
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,description,due_date,priority,category,status")
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
      .select("id,title,category,due_date,status,description")
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
      .select("id,title,day,start_time,end_time,category,location")
      .eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to load timetable", { description: error.message });
      setTimetable([]);
    } else {
      setTimetable((data ?? []).map(mapTimetable));
    }
    setLoadingTimetable(false);
  }, [supabase]);

  const fetchFocusSessions = useCallback(async () => {
    setLoadingFocus(true);
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("id,duration_minutes,session_date,created_at")
      .eq("user_id", MOCK_USER_ID)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("Unable to load focus history", { description: error.message });
      setFocusStats({ todayMinutes: 0, weekMinutes: 0 });
    } else {
      const sessions = (data ?? []).map(mapFocusSession);
      const todayMinutes = sessions
        .filter((session) => isToday(parseISO(session.startTime)))
        .reduce((total, session) => total + session.durationMinutes, 0);
      setFocusStats({
        todayMinutes,
        weekMinutes: focusMinutesThisWeek(sessions),
      });
    }
    setLoadingFocus(false);
  }, [supabase]);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from("user_settings")
      .select("preferred_name,theme,timezone,daily_focus_target")
      .eq("user_id", MOCK_USER_ID)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      toast.error("Unable to load settings", { description: error.message });
    } else {
      setSettings({
        name: data?.preferred_name ?? defaultSettings.name,
        dailyFocusTargetMinutes: typeof data?.daily_focus_target === "number" ? data.daily_focus_target : defaultSettings.dailyFocusTargetMinutes,
        timezone: data?.timezone ?? defaultSettings.timezone,
      });
    }
    setLoadingSettings(false);
  }, [supabase]);

  useEffect(() => {
    void fetchTasks();
    void fetchDeadlines();
    void fetchTimetable();
    void fetchSettings();
    void fetchFocusSessions();
  }, [fetchDeadlines, fetchFocusSessions, fetchSettings, fetchTasks, fetchTimetable]);

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
  const overdueCount = tasks.filter((task) => isOverdue(task.dueDate)).length;
  const focusTarget = (loadingSettings ? defaultSettings.dailyFocusTargetMinutes : settings.dailyFocusTargetMinutes) || defaultSettings.dailyFocusTargetMinutes;
  const focusProgressToday = focusTarget === 0 ? 0 : Math.min(100, Math.round((focusStats.todayMinutes / focusTarget) * 100));
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

  const name = loadingSettings ? defaultSettings.name : settings.name;
  const heroStats = [
    {
      label: "Today focus",
      value: `${focusStats.todayMinutes}m`,
      helper: `${focusProgressToday}% of ${focusTarget}m`,
      icon: Flame,
      loading: loadingFocus,
      progress: focusProgressToday,
    },
    {
      label: "Today’s tasks",
      value: `${todaysTasks.length}`,
      helper: overdueCount > 0 ? `${overdueCount} overdue` : "All clear",
      icon: CheckCircle2,
      loading: loadingTasks,
      progress,
    },
    {
      label: "Next deadline",
      value: loadingDeadlines ? "" : upComings[0] ? formatShortDate(upComings[0].dueDate) : "None",
      helper: upComings[0]?.title ?? "Nothing due soon",
      icon: Calendar,
      loading: loadingDeadlines,
      progress: upComings[0] ? Math.min(100, Math.max(8, Math.round(((14 - daysUntil(upComings[0].dueDate)) / 14) * 100))) : 0,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 md:p-8 text-white shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {todayLabel}
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{greetingByTime(name)}</h1>
              <p className="text-white/85">
                Build calm momentum. {todaysTasks.length > 0 ? "Prioritise what matters first." : "You’re clear for launch."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/focus"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4" />
                Start Focus
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Plan Tasks
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-xl grid-cols-2 gap-3 lg:max-w-lg">
            {heroStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur shadow-lg">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/80">
                    <span>{stat.label}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  {stat.loading ? (
                    <Skeleton className="mt-3 h-8 w-24 bg-white/30" />
                  ) : (
                    <>
                      <p className="mt-2 text-lg font-semibold leading-tight">{stat.value}</p>
                      <p className="text-sm text-white/80">{stat.helper}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                        <div className="h-full bg-white" style={{ width: `${stat.progress}%` }} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-4 border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="subtle">Weekly momentum</p>
              <h3 className="text-xl font-semibold text-slate-900">Progress pulse</h3>
            </div>
            <Target className="h-6 w-6 text-slate-400" />
          </div>
          {loadingTasks ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-[auto,1fr] items-center gap-4">
              <ProgressRing value={progress} />
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {completed} of {tasks.length || 1} tasks completed
                </p>
                <p>{focusStats.weekMinutes} min focused this week</p>
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Steady progress
                </p>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
            {overdueCount > 0 ? `Tackle ${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} first.` : "Stay on the streak—short focused blocks win."}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Next block</p>
              <h3 className="text-2xl font-semibold tracking-tight">{todaysSlots[0]?.title ?? "Start a sprint"}</h3>
            </div>
            <Clock className="h-6 w-6 opacity-90" />
          </div>
          <p className="text-sm text-white/80">
            {todaysSlots[0]
              ? `${todaysSlots[0].startTime} – ${todaysSlots[0].endTime}`
              : "No calendar events today. Create a 25 minute sprint instead."}
          </p>
          <div className="mt-auto pt-6">
            <Link
              href={todaysSlots[0] ? "/timetable" : "/focus"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-blue-700 font-semibold shadow-md transition hover:-translate-y-0.5"
            >
              <Play className="h-5 w-5" />
              {todaysSlots[0] ? "Open timetable" : "Start sprint"}
            </Link>
          </div>
        </div>

        <div className="card flex flex-col justify-between border border-gray-100 p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="subtle">Daily Motivation</p>
                <h3 className="text-xl font-semibold text-slate-900">Reminder</h3>
              </div>
              <span className="badge">{loadingSettings ? "..." : settings.timezone}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 italic text-lg leading-relaxed">“{quote}”</p>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
            Target: {focusTarget} min • Theme: {loadingSettings ? "Loading" : settings.name}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card border border-gray-100 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="subtle">Weekly timetable</p>
              <h3 className="text-xl font-semibold text-slate-900">Today&apos;s schedule</h3>
            </div>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {loadingTimetable ? (
              Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full rounded-2xl" />)
            ) : todaysSlots.length === 0 ? (
              <p className="subtle">No events for today. Add one from Timetable.</p>
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
                    {slot.location && <p className="text-xs text-slate-500">Location: {slot.location}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card border border-gray-100 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="subtle">Never miss important coursework</p>
              <h3 className="text-xl font-semibold text-slate-900">Upcoming deadlines</h3>
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
                        {deadline.category} • {formatShortDate(deadline.dueDate)}
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

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="subtle">Due or overdue items you should ship today.</p>
            <h2 className="section-title">Today&apos;s tasks</h2>
          </div>
          <Link href="/tasks" className="btn-ghost px-3">
            Manage all tasks
          </Link>
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
