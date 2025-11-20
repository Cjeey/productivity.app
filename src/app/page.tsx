"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import CategoryBadge from "@/components/ui/category-badge";
import PriorityBadge from "@/components/ui/priority-badge";
import StatusBadge from "@/components/ui/status-badge";
import ProgressRing from "@/components/ui/progress-ring";
import { useAppStore } from "@/lib/store";
import { daysUntil, formatShortDate, greetingByTime, isOverdue, todayTasks } from "@/lib/utils";
import { Task } from "@/lib/types";
import { AlertCircle, Calendar, Clock, Play, Target } from "lucide-react";

export default function DashboardPage() {
  const { tasks, deadlines, timetable, settings, toggleTaskStatus } = useAppStore();

  const todaysTasks = todayTasks(tasks).slice(0, 5);
  const upcomingDeadlines = [...deadlines]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);
  const todayLabel = format(new Date(), "EEEE, d MMM");
  const todaysSlots = timetable.filter((slot) => slot.dayOfWeek === format(new Date(), "EEEE"));

  const completed = tasks.filter((task) => task.status === "Done").length;
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
  const quote = useMemo(() => {
    const quotes = [
      "Progress, not perfection.",
      "One step at a time.",
      "Your future self will thank you.",
      "Consistency is key.",
    ];
    // Deterministic pick based on day of month to avoid hydration mismatch
    const index = new Date().getDate() % quotes.length;
    return quotes[index];
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="subtle">{todayLabel}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {greetingByTime(settings.name ?? "Student")}
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
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <ProgressRing value={progress} />
            <p className="text-sm text-slate-500">
              {completed} of {tasks.length || 1} tasks completed
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Stay focused on high-impact tasks today.
          </div>
        </div>

        <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Focus Session</p>
              <h3 className="text-2xl font-semibold tracking-tight">2-hour deep work</h3>
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
            {todaysSlots.length === 0 && <p className="subtle">No events for today.</p>}
            {todaysSlots.map((slot) => {
              const colors: Record<string, string> = {
                Uni: "bg-blue-500",
                Work: "bg-amber-500",
                Personal: "bg-emerald-500",
              };
              const color = colors[slot.category] ?? "bg-blue-500";
              return (
                <div key={slot.id} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-semibold text-slate-500">{slot.startTime}</div>
                  <div className={`flex-1 rounded-2xl ${color} px-4 py-3 text-white shadow-inner`}>
                    <p className="font-semibold">{slot.title}</p>
                    <p className="text-xs text-white/80">
                      {slot.startTime} – {slot.endTime} {slot.location ? `· ${slot.location}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
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
            {upcomingDeadlines.length === 0 && <p className="subtle">No deadlines yet.</p>}
            {upcomingDeadlines.map((deadline) => {
              const daysLeft = daysUntil(deadline.dueDate);
              const urgency =
                daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-orange-500" : "text-emerald-500";
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
                  <p className={`text-right font-semibold ${urgency}`}>
                    {daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <SectionHeader title="Today&apos;s tasks" description="Due or overdue items you should ship today." />
        <div className="space-y-3">
          {todaysTasks.length === 0 && (
            <p className="subtle">No tasks for today. Add some from the Tasks page.</p>
          )}
          {todaysTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggleTaskStatus(task.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

const TaskRow = ({ task, onToggle }: { task: Task; onToggle: () => void }) => {
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
            {isOverdue(task.dueDate) && (
              <span className="badge bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                Overdue
              </span>
            )}
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {daysLeft < 0 ? "Overdue" : `${daysLeft} days`}
          </p>
          <StatusBadge status={task.status} />
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{
              width: `${task.status === "Done" ? 100 : task.status === "In Progress" ? 60 : 25}%`,
            }}
          />
        </div>
        <button className="btn-ghost px-3 py-1.5" onClick={onToggle} type="button">
          Advance
        </button>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="subtle">{description}</p>
      <h2 className="section-title">{title}</h2>
    </div>
  </div>
);
