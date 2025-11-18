import { differenceInCalendarDays, format, isPast, isThisWeek, isToday, parseISO } from "date-fns";
import { FocusSession, Task } from "./types";

export function formatShortDate(value: string) {
  return format(parseISO(value), "eee d MMM");
}

export function formatTime(value: string) {
  return format(parseISO(value), "HH:mm");
}

export function isOverdue(value: string) {
  const date = parseISO(value);
  return isPast(date) && !isToday(date);
}

export function daysUntil(value: string) {
  return differenceInCalendarDays(parseISO(value), new Date());
}

export function greetingByTime(name?: string) {
  const hour = new Date().getHours();
  const base = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name}` : base;
}

export function todayTasks(tasks: Task[]) {
  return tasks.filter((task) => isToday(parseISO(task.dueDate)) || isOverdue(task.dueDate));
}

export function weekTasks(tasks: Task[]) {
  return tasks.filter((task) => isThisWeek(parseISO(task.dueDate), { weekStartsOn: 1 }));
}

export function completedTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status === "Done").length;
}

export function focusMinutesThisWeek(sessions: FocusSession[]) {
  const total = sessions
    .filter((session) => isThisWeek(parseISO(session.startTime), { weekStartsOn: 1 }))
    .reduce((acc, session) => acc + session.durationMinutes, 0);
  return total;
}

export function percentage(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
