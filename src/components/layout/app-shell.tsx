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
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-slate-950 flex">
      <aside className="hidden md:flex w-20 flex-col items-center border-r border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 py-6 gap-6">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center font-semibold">
          S
        </div>
        <nav className="flex-1 flex flex-col items-center gap-4 w-full">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                  active
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    active ? "bg-blue-50 text-blue-600" : "bg-transparent"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="pb-2">
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex-1">
        <header className="md:hidden border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="container-page flex items-center justify-between py-4">
            <Link href="/" className="font-semibold text-lg text-brand-600 dark:text-brand-400">
              FocusFlow
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="container-page space-y-8">{children}</main>
      </div>
    </div>
  );
}
