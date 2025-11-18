"use client";

import { useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import { useAppStore } from "@/lib/store";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const { settings, setSettings } = useAppStore();
  const { setTheme, theme } = useTheme();
  const [form, setForm] = useState(settings);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettings(form);
    setTheme(form.theme);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="subtle">Personalise FocusFlow for you.</p>
        <h1 className="section-title">Settings</h1>
      </header>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label" htmlFor="name">Preferred name</label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="label" htmlFor="timezone">Timezone</label>
            <input
              id="timezone"
              className="input"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="UTC"
            />
          </div>
          <div className="space-y-1">
            <label className="label" htmlFor="focus">Daily focus target (minutes)</label>
            <input
              id="focus"
              type="number"
              className="input"
              value={form.dailyFocusTargetMinutes}
              onChange={(e) => setForm({ ...form, dailyFocusTargetMinutes: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Theme</label>
            <div className="flex items-center gap-3">
              <select
                className="input"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value as typeof form.theme })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <ThemeToggle />
              <span className="subtle">Current: {theme}</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary">Save settings</button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Supabase env keys can be added to <code>.env.local</code> to sync data later.
        </p>
      </form>
    </div>
  );
}
