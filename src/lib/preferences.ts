/* Client-side preferences stored locally for quick UX wins without touching the DB */
"use client";

import { useEffect, useState } from "react";

export type Preferences = {
  defaultFocusMinutes: number;
  breakMinutes: number;
  breakReminders: boolean;
};

const STORAGE_KEY = "focusflow-preferences";

export const preferenceDefaults: Preferences = {
  defaultFocusMinutes: 25,
  breakMinutes: 5,
  breakReminders: true,
};

const isBrowser = typeof window !== "undefined";

export function loadPreferences(): Preferences {
  if (!isBrowser) return preferenceDefaults;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return preferenceDefaults;
    const parsed = JSON.parse(saved) as Partial<Preferences>;
    return { ...preferenceDefaults, ...parsed };
  } catch {
    return preferenceDefaults;
  }
}

export function savePreferences(next: Preferences) {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(preferenceDefaults);

  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  const updatePreferences = (updates: Partial<Preferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      savePreferences(next);
      return next;
    });
  };

  return { preferences, updatePreferences };
}
