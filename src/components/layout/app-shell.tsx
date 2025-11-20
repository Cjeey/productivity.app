"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import {
  CalendarDays,
  LayoutDashboard,
  NotebookTabs,
  Settings,
  Timer,
  ListTodo,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/deadlines", label: "Deadlines", icon: NotebookTabs },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-slate-950 flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3 px-8 py-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center font-semibold">
            S
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-300">Welcome back</p>
            <p className="font-semibold text-slate-900 dark:text-white tracking-tight">Student</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-500/10 dark:text-blue-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    active
                      ? "bg-white text-blue-600 shadow-inner dark:bg-slate-900/60"
                      : "bg-white text-slate-500 shadow-inner dark:bg-slate-900/40"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Theme</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Appearance</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col pb-20 md:pb-0">
        <header className="md:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center font-semibold shadow-md">
                FF
              </span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-300">FocusFlow</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Today</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/tasks" className="btn-ghost px-3 py-1 text-xs">
                + Task
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <header className="hidden md:block sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white grid place-items-center font-semibold shadow-lg">
                FF
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">FocusFlow</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">Streamlined workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/tasks" className="btn-ghost px-3 py-2 text-sm">
                + Task
              </Link>
              <Link href="/deadlines" className="btn-ghost px-3 py-2 text-sm">
                Deadlines
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 container-page space-y-8">{children}</main>
      </div>

      <nav className="md:hidden fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center text-xs font-medium ${
                  active ? "text-blue-600" : "text-slate-500 dark:text-slate-300"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    active ? "bg-blue-50 text-blue-600" : "text-inherit"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
