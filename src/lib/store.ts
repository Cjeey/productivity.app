"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { defaultSettings, seedDeadlines, seedFocusSessions, seedTasks, seedTimetable } from "./seed-data";
import { Deadline, FocusSession, Task, TaskStatus, TimetableEvent, UserSettings } from "./types";

interface AppState {
  tasks: Task[];
  deadlines: Deadline[];
  timetable: TimetableEvent[];
  focusSessions: FocusSession[];
  settings: UserSettings;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addDeadline: (deadline: Omit<Deadline, "id">) => void;
  updateDeadline: (id: string, updates: Partial<Deadline>) => void;
  deleteDeadline: (id: string) => void;
  addTimetableEvent: (event: Omit<TimetableEvent, "id">) => void;
  updateTimetableEvent: (id: string, updates: Partial<TimetableEvent>) => void;
  deleteTimetableEvent: (id: string) => void;
  logFocusSession: (session: Omit<FocusSession, "id">) => void;
  setSettings: (settings: Partial<UserSettings>) => void;
  toggleTaskStatus: (id: string, nextStatus?: TaskStatus) => void;
}

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  key: () => null,
  clear: () => undefined,
  length: 0,
};

const storage = createJSONStorage(() =>
  typeof window === "undefined" ? noopStorage : window.localStorage
);

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: seedTasks,
      deadlines: seedDeadlines,
      timetable: seedTimetable,
      focusSessions: seedFocusSessions,
      settings: defaultSettings,
      addTask: (task) =>
        set((state) => ({
          tasks: [
            {
              id: crypto.randomUUID(),
              ...task,
            },
            ...state.tasks,
          ],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
      addDeadline: (deadline) =>
        set((state) => ({
          deadlines: [
            {
              id: crypto.randomUUID(),
              ...deadline,
            },
            ...state.deadlines,
          ],
        })),
      updateDeadline: (id, updates) =>
        set((state) => ({
          deadlines: state.deadlines.map((deadline) =>
            deadline.id === id ? { ...deadline, ...updates } : deadline
          ),
        })),
      deleteDeadline: (id) =>
        set((state) => ({
          deadlines: state.deadlines.filter((deadline) => deadline.id !== id),
        })),
      addTimetableEvent: (event) =>
        set((state) => ({
          timetable: [
            {
              id: crypto.randomUUID(),
              ...event,
            },
            ...state.timetable,
          ],
        })),
      updateTimetableEvent: (id, updates) =>
        set((state) => ({
          timetable: state.timetable.map((slot) =>
            slot.id === id ? { ...slot, ...updates } : slot
          ),
        })),
      deleteTimetableEvent: (id) =>
        set((state) => ({
          timetable: state.timetable.filter((slot) => slot.id !== id),
        })),
      logFocusSession: (session) =>
        set((state) => ({
          focusSessions: [
            {
              id: crypto.randomUUID(),
              ...session,
            },
            ...state.focusSessions,
          ],
        })),
      setSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      toggleTaskStatus: (id, nextStatus) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) return task;
            const order: TaskStatus[] = ["To Do", "In Progress", "Done"];
            const target = nextStatus ?? order[(order.indexOf(task.status) + 1) % order.length];
            return { ...task, status: target };
          }),
        })),
    }),
    {
      name: "focusflow-store",
      storage,
    }
  )
);
