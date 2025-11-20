"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ThemeToggle from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { MOCK_USER_ID } from "@/lib/constants";
import { preferenceDefaults, usePreferences } from "@/lib/preferences";

interface DbSettingsRow {
  id: string;
  preferred_name: string | null;
  timezone: string | null;
  daily_focus_target: number | null;
  theme: "light" | "dark" | null;
  updated_at: string;
}

interface FormState {
  name: string;
  timezone: string;
  dailyFocusTargetMinutes: number;
  theme: "light" | "dark";
}

interface FormErrors {
  name?: string;
  timezone?: string;
  dailyFocusTargetMinutes?: string;
}

const detectedTimezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

const buildDefaults = (): FormState => ({
  name: "Student",
  timezone: detectedTimezone,
  dailyFocusTargetMinutes: 120,
  theme: "light",
});

const mapRowToForm = (row: DbSettingsRow | null): FormState => ({
  name: row?.preferred_name || "Student",
  timezone: row?.timezone || detectedTimezone,
  dailyFocusTargetMinutes: row?.daily_focus_target || 120,
  theme: (row?.theme as "light" | "dark") || "light",
});

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormState>(buildDefaults());
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_settings")
      .select("id,preferred_name,timezone,daily_focus_target,theme,updated_at")
      .eq("user_id", MOCK_USER_ID)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      toast.error("Unable to load settings", { description: error.message });
      setForm(buildDefaults());
    } else {
      const mapped = mapRowToForm(data);
      setForm(mapped);
      setTheme(mapped.theme);
    }
    setLoading(false);
  }, [setTheme, supabase]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const validate = (): FormErrors => {
    const validation: FormErrors = {};
    if (!form.name.trim()) validation.name = "Name is required";
    if (!form.timezone.trim()) validation.timezone = "Timezone required";
    if (!form.dailyFocusTargetMinutes || form.dailyFocusTargetMinutes <= 0) {
      validation.dailyFocusTargetMinutes = "Target must be greater than 0";
    }
    return validation;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Fix validation errors");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: MOCK_USER_ID,
      preferred_name: form.name.trim(),
      timezone: form.timezone.trim(),
      daily_focus_target: form.dailyFocusTargetMinutes,
      theme: form.theme,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("user_settings").upsert(payload, { onConflict: "user_id" });
    if (error) {
      toast.error("Unable to save settings", { description: error.message });
    } else {
      toast.success("Settings saved");
      setTheme(form.theme);
    }
    setSaving(false);
  };

  const handleUseSystemTimezone = () => {
    setForm((prev) => ({ ...prev, timezone: detectedTimezone }));
    setErrors((prev) => ({ ...prev, timezone: undefined }));
  };

  const handleMatchSystemTheme = () => {
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = prefersDark ? "dark" : "light";
    setForm((prev) => ({ ...prev, theme: nextTheme }));
    setTheme(nextTheme);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="subtle">Personalise FocusFlow for you.</p>
        <h1 className="section-title">Settings</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6 space-y-4 lg:col-span-2">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="label" htmlFor="name">
                    Preferred name
                  </label>
                  <input
                    id="name"
                    className={`input ${errors.name ? "border-red-500" : ""}`}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="label" htmlFor="timezone">
                    Timezone
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="timezone"
                      className={`input ${errors.timezone ? "border-red-500" : ""}`}
                      value={form.timezone}
                      onChange={(e) => {
                        setForm({ ...form, timezone: e.target.value });
                        setErrors((prev) => ({ ...prev, timezone: undefined }));
                      }}
                      placeholder="UTC"
                    />
                    <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={handleUseSystemTimezone}>
                      Use system
                    </button>
                  </div>
                  {errors.timezone && <p className="text-sm text-red-500">{errors.timezone}</p>}
                </div>
                <div className="space-y-1">
                  <label className="label" htmlFor="focus">
                    Daily focus target (minutes)
                  </label>
                  <input
                    id="focus"
                    type="number"
                    className={`input ${errors.dailyFocusTargetMinutes ? "border-red-500" : ""}`}
                    value={form.dailyFocusTargetMinutes}
                    onChange={(e) => {
                      setForm({ ...form, dailyFocusTargetMinutes: Number(e.target.value) });
                      setErrors((prev) => ({ ...prev, dailyFocusTargetMinutes: undefined }));
                    }}
                    min={15}
                    max={480}
                  />
                  {errors.dailyFocusTargetMinutes && <p className="text-sm text-red-500">{errors.dailyFocusTargetMinutes}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400">Used across the dashboard and focus tracker.</p>
                </div>
                <div className="space-y-1">
                  <label className="label">Theme</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      className="input"
                      value={form.theme}
                      onChange={(e) => {
                        const value = e.target.value as FormState["theme"];
                        setForm({ ...form, theme: value });
                        setTheme(value);
                      }}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                    <ThemeToggle />
                    <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={handleMatchSystemTheme}>
                      Match system
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" className="btn-primary" disabled={saving || loading}>
                {saving ? "Saving..." : "Save settings"}
              </button>
              <p className="text-xs text-slate-400">Settings sync automatically with your account.</p>
            </div>
          </div>

          <section className="card p-6 space-y-4">
            <div>
              <p className="subtle">Focus defaults</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Productivity preferences</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">These are saved locally and apply instantly in the Focus page.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="label" htmlFor="default-focus">
                  Default focus length (minutes)
                </label>
                <input
                  id="default-focus"
                  type="number"
                  className="input"
                  min={5}
                  max={120}
                  value={preferences.defaultFocusMinutes}
                  onChange={(e) =>
                    updatePreferences({
                      defaultFocusMinutes: Math.min(120, Math.max(5, Number(e.target.value) || preferenceDefaults.defaultFocusMinutes)),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="label" htmlFor="break-length">
                  Break length (minutes)
                </label>
                <input
                  id="break-length"
                  type="number"
                  className="input"
                  min={1}
                  max={30}
                  value={preferences.breakMinutes}
                  onChange={(e) =>
                    updatePreferences({
                      breakMinutes: Math.min(30, Math.max(1, Number(e.target.value) || preferenceDefaults.breakMinutes)),
                    })
                  }
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={preferences.breakReminders}
                  onChange={(e) => updatePreferences({ breakReminders: e.target.checked })}
                  className="h-4 w-4 accent-brand-500"
                />
                Enable gentle break reminders after logging a session
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost px-3 py-2 text-xs"
                  onClick={() => updatePreferences(preferenceDefaults)}
                >
                  Reset preferences
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-2 text-xs"
                  onClick={() => {
                    updatePreferences(preferences);
                    toast.success("Preferences saved locally");
                  }}
                >
                  Save now
                </button>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
