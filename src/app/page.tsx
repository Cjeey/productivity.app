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

      {/* Stats grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700">Weekly Progress</h3>
            <Target className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex items-center justify-center mb-4">
            <ProgressRing value={progress} />
          </div>
          <p className="text-sm text-slate-500 text-center">
            {completed} of {tasks.length || 1} tasks completed
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3>Focus Session</h3>
            <Clock className="h-5 w-5 opacity-90" />
          </div>
          <p className="text-sm opacity-90 mb-6">Start a deep work session for your dissertation</p>
          <Link
            href="/focus"
            className="w-full bg-white text-blue-600 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors font-medium"
          >
            <Play className="h-5 w-5" />
            Start Session
          </Link>
        </div>

        <div className="card p-6 shadow-sm border border-gray-100 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-slate-600 italic text-lg">“{quote}”</p>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto" />
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900">Today&apos;s Schedule</h3>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {todaysSlots.length === 0 && <p className="subtle">No events for today.</p>}
            {todaysSlots.map((slot) => {
              const colors: Record<string, string> = {
                Uni: "bg-blue-500",
                Work: "bg-yellow-500",
                Personal: "bg-green-500",
              };
              const color = colors[slot.category] ?? "bg-blue-500";
              return (
                <div key={slot.id} className="flex items-center gap-4">
                  <div className="text-sm text-slate-500 w-16">{slot.startTime}</div>
                  <div
                    className={`flex-1 ${color} bg-opacity-10 border-l-4 ${color.replace("bg-", "border-")} rounded-lg p-3`}
                  >
                    <p className="text-slate-900 text-sm dark:text-slate-50">{slot.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {slot.startTime} - {slot.endTime} {slot.location ? `· ${slot.location}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900">Upcoming Deadlines</h3>
            <AlertCircle className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 && <p className="subtle">No deadlines yet.</p>}
            {upcomingDeadlines.map((deadline) => {
              const daysLeft = daysUntil(deadline.dueDate);
              const color = deadline.category === "Personal" ? "bg-green-500" : "bg-red-500";
              return (
                <div
                  key={deadline.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <div className={`w-2 h-2 ${color} rounded-full mt-2`} />
                  <div className="flex-1">
                    <p className="text-slate-900 mb-1 dark:text-slate-50">{deadline.title}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                      <span>{deadline.category}</span>
                      <span>•</span>
                      <span>{daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 dark:text-slate-300">{deadline.dueDate.slice(0, 10)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <SectionHeader title="Today&apos;s tasks" description="Due or overdue items you should ship today." />
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
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
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-50">{task.title}</p>
          <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-300">
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
        <StatusBadge status={task.status} />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button className="btn-ghost px-3 py-1.5" onClick={onToggle} type="button">
          Next status
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
