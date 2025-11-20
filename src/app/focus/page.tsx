"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isToday, parseISO } from "date-fns";
import { toast } from "sonner";
import FocusTimer from "@/components/focus/focus-timer";
import CategoryBadge from "@/components/ui/category-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { preferenceDefaults, usePreferences } from "@/lib/preferences";
import { formatShortDate } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { MOCK_USER_ID } from "@/lib/constants";
import { Category } from "@/lib/types";

interface DbFocusSession {
  id: string;
  task_id: string | null;
  duration_minutes: number;
  session_date: string | null;
  created_at: string;
}

interface TaskOption {
  id: string;
  title: string;
  category: Category;
}

const formatCategory = (value: string | null): Category => {
  const normalized = (value ?? "personal").toLowerCase();
  if (normalized === "uni") return "Uni";
  if (normalized === "work") return "Work";
  return "Personal";
};

export default function FocusPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { preferences, updatePreferences } = usePreferences();
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [sessions, setSessions] = useState<DbFocusSession[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [duration, setDuration] = useState(preferenceDefaults.defaultFocusMinutes);
  const [savingSession, setSavingSession] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(120);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase.from("tasks").select("id,title,category").eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to load tasks", { description: error.message });
      setTasks([]);
    } else {
      const mapped = (data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        category: formatCategory(task.category),
      }));
      setTasks(mapped);
      setSelectedTask((prev) => prev || mapped[0]?.id || "");
    }
    setLoadingTasks(false);
  }, [supabase]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("id,task_id,duration_minutes,session_date,created_at")
      .eq("user_id", MOCK_USER_ID)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) {
      toast.error("Unable to load sessions", { description: error.message });
      setSessions([]);
    } else {
      setSessions(data ?? []);
    }
    setLoadingSessions(false);
  }, [supabase]);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from("user_settings")
      .select("daily_focus_target")
      .eq("user_id", MOCK_USER_ID)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      toast.error("Unable to load preferences", { description: error.message });
    } else {
      setDailyTarget(data?.daily_focus_target ?? 120);
    }
    setLoadingSettings(false);
  }, [supabase]);

  useEffect(() => {
    void loadTasks();
    void loadSessions();
    void loadSettings();
  }, [loadSessions, loadSettings, loadTasks]);

  useEffect(() => {
    setDuration(preferences.defaultFocusMinutes);
  }, [preferences.defaultFocusMinutes]);

  const handleLogSession = async ({
    taskId,
    startedAt,
    durationSeconds,
  }: {
    taskId?: string;
    startedAt: string;
    durationSeconds: number;
  }) => {
    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    setSavingSession(true);
    const payload = {
      task_id: taskId ?? null,
      duration_minutes: durationMinutes,
      session_date: startedAt.slice(0, 10),
      user_id: MOCK_USER_ID,
    };
    const { data, error } = await supabase.from("focus_sessions").insert(payload).select().single();
    if (error) {
      toast.error("Could not save session", { description: error.message });
    } else if (data) {
      toast.success("Session logged");
      setSessions((prev) => [data, ...prev]);
      if (preferences.breakReminders) {
        toast("Take a break", { description: `Walk or stretch for ${preferences.breakMinutes} minutes.` });
      }
    }
    setSavingSession(false);
  };

  const todayMinutes = useMemo(
    () =>
      sessions
        .filter((session) => {
          const date = session.session_date ?? session.created_at;
          return date ? isToday(parseISO(date)) : false;
        })
        .reduce((acc, session) => acc + session.duration_minutes, 0),
    [sessions]
  );

  const todayProgress = dailyTarget === 0 ? 0 : Math.min(100, Math.round((todayMinutes / dailyTarget) * 100));

  const enrichedSessions = useMemo(() => {
    return sessions.map((session) => ({
      ...session,
      displayDate: session.session_date ?? session.created_at,
      task: tasks.find((task) => task.id === session.task_id),
    }));
  }, [sessions, tasks]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="subtle">Stay focused and log your sessions.</p>
        <h1 className="section-title">Focus</h1>
      </header>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="subtle">Daily target</p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {loadingSettings ? "Loading..." : `${todayMinutes} / ${dailyTarget} minutes`}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Default sprint {preferences.defaultFocusMinutes}m • Break {preferences.breakMinutes}m
          </p>
        </div>
        <div className="w-full md:w-64">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500" style={{ width: `${todayProgress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{todayProgress}% of goal</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 card p-5 space-y-4">
          <div className="space-y-1">
            <label className="label">Link to task</label>
            {loadingTasks ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <select className="input" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                <option value="">Unlinked session</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1">
            <label className="label">Session length (minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              className="input"
              value={duration}
              onChange={(e) => {
                const next = Math.min(120, Math.max(5, Number(e.target.value) || preferenceDefaults.defaultFocusMinutes));
                setDuration(next);
                updatePreferences({ defaultFocusMinutes: next });
              }}
            />
            <p className="text-xs text-slate-500">Saved as your default sprint length.</p>
          </div>
          <FocusTimer minutes={duration} taskId={selectedTask || undefined} onLog={handleLogSession} />
          {savingSession && <p className="text-xs text-slate-500">Saving session...</p>}
        </div>

        <div className="lg:col-span-2 card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Session history</h2>
            <span className="subtle">{sessions.length} sessions</span>
          </div>
          <div className="space-y-2 text-sm">
            {loadingSessions ? (
              Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full rounded-2xl" />)
            ) : enrichedSessions.length === 0 ? (
              <p className="subtle">No sessions yet. Start one to log.</p>
            ) : (
              enrichedSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {session.task?.title ?? "Unlinked session"}
                    </p>
                    <p className="text-slate-500 dark:text-slate-300">
                      {session.duration_minutes} min · {formatShortDate(session.displayDate)}
                    </p>
                  </div>
                  {session.task && <CategoryBadge category={session.task.category} />}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
