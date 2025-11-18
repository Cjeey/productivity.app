"use client";

import { useEffect, useMemo, useState } from "react";
import FocusTimer from "@/components/focus/focus-timer";
import CategoryBadge from "@/components/ui/category-badge";
import { useAppStore } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function FocusPage() {
  const { focusSessions, tasks } = useAppStore();
  const [taskId, setTaskId] = useState<string>(tasks[0]?.id ?? "");

  useEffect(() => {
    if (!taskId && tasks[0]) {
      setTaskId(tasks[0].id);
    }
  }, [taskId, tasks]);

  const enrichedSessions = useMemo(() => {
    return focusSessions.map((session) => ({
      ...session,
      taskTitle: tasks.find((t) => t.id === session.taskId)?.title,
    }));
  }, [focusSessions, tasks]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="subtle">Stay focused and log your sessions.</p>
        <h1 className="section-title">Focus</h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 card p-5 space-y-4">
          <div className="space-y-1">
            <label className="label">Link to task</label>
            <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              {tasks.map((task) => {
                return (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                );
              })}
            </select>
          </div>
          <FocusTimer defaultMinutes={25} taskId={taskId} />
        </div>

        <div className="lg:col-span-2 card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Session history</h2>
            <span className="subtle">{focusSessions.length} sessions</span>
          </div>
          <div className="space-y-2 text-sm">
            {enrichedSessions.length === 0 && (
              <p className="subtle">No sessions yet. Start one to log.</p>
            )}
            {enrichedSessions.map((session) => (
              <div key={session.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {session.taskTitle ?? "Unlinked session"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-300">
                    {session.durationMinutes} min · {formatShortDate(session.startTime)}
                  </p>
                </div>
                {session.taskId && (
                  <CategoryBadge category={tasks.find((t) => t.id === session.taskId)?.category ?? "Personal"} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
