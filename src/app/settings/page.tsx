"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ThemeToggle from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { MOCK_USER_ID } from "@/lib/constants";

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

const buildDefaults = (): FormState => ({
  name: "Student",
  timezone: "UTC",
  dailyFocusTargetMinutes: 120,
  theme: "light",
});

const mapRowToForm = (row: DbSettingsRow | null): FormState => ({
  name: row?.preferred_name || "Student",
  timezone: row?.timezone || "UTC",
  dailyFocusTargetMinutes: row?.daily_focus_target || 120,
  theme: (row?.theme as "light" | "dark") || "light",
});

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormState>(buildDefaults());
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_settings")
      .select<DbSettingsRow>("id,preferred_name,timezone,daily_focus_target,theme,updated_at")
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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="subtle">Personalise FocusFlow for you.</p>
        <h1 className="section-title">Settings</h1>
      </header>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-3xl">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
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
              />
              {errors.dailyFocusTargetMinutes && <p className="text-sm text-red-500">{errors.dailyFocusTargetMinutes}</p>}
            </div>
            <div className="space-y-1">
              <label className="label">Theme</label>
              <div className="flex items-center gap-3">
                <select
                  className="input"
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value as FormState["theme"] })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <ThemeToggle />
                <span className="subtle">Preview</span>
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
      </form>
    </div>
  );
}
