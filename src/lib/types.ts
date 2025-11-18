export type Priority = "Low" | "Medium" | "High";
export type Category = "Uni" | "Work" | "Personal";
export type TaskStatus = "To Do" | "In Progress" | "Done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  category: Category;
  status: TaskStatus;
  estimatedHours?: number;
  module?: string;
  notes?: string;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  category: Category;
  module?: string;
  estimatedHours?: number;
  status: TaskStatus;
  notes?: string;
  description?: string;
}

export interface TimetableEvent {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location?: string;
  category: Category;
  repeat?: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface UserSettings {
  name: string;
  theme: "light" | "dark";
  timezone: string;
  dailyFocusTargetMinutes: number;
}
