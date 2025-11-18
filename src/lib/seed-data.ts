import { Deadline, FocusSession, Task, TimetableEvent, UserSettings } from "./types";

export const seedTasks: Task[] = [
  {
    id: "task-1",
    title: "Read Chapter 3: Data Structures",
    description: "Summarize key concepts and flashcards",
    dueDate: new Date().toISOString(),
    priority: "High",
    category: "Uni",
    status: "In Progress",
    estimatedHours: 2,
    module: "CS210"
  },
  {
    id: "task-2",
    title: "Submit UX assignment draft",
    description: "Upload wireframes and short rationale",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    priority: "Medium",
    category: "Uni",
    status: "To Do",
    estimatedHours: 3,
    module: "DES130"
  },
  {
    id: "task-3",
    title: "Book flights for internship onboarding",
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    priority: "High",
    category: "Work",
    status: "To Do",
    estimatedHours: 1
  },
  {
    id: "task-4",
    title: "Morning workout + stretching",
    dueDate: new Date().toISOString(),
    priority: "Low",
    category: "Personal",
    status: "Done",
    estimatedHours: 1
  }
];

export const seedDeadlines: Deadline[] = [
  {
    id: "deadline-1",
    title: "Algorithms midterm",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    category: "Uni",
    module: "CS210",
    estimatedHours: 6,
    status: "To Do",
    notes: "Allocate 2h study blocks"
  },
  {
    id: "deadline-2",
    title: "Product spec review",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    category: "Work",
    estimatedHours: 2,
    status: "In Progress"
  }
];

export const seedTimetable: TimetableEvent[] = [
  {
    id: "slot-1",
    title: "Algorithms lecture",
    dayOfWeek: "Monday",
    startTime: "10:00",
    endTime: "11:30",
    location: "Room 2.13",
    category: "Uni"
  },
  {
    id: "slot-2",
    title: "Product stand-up",
    dayOfWeek: "Monday",
    startTime: "14:00",
    endTime: "14:30",
    category: "Work"
  },
  {
    id: "slot-3",
    title: "Database lab",
    dayOfWeek: "Wednesday",
    startTime: "13:00",
    endTime: "15:00",
    location: "Lab 4",
    category: "Uni"
  },
  {
    id: "slot-4",
    title: "Gym session",
    dayOfWeek: "Friday",
    startTime: "18:00",
    endTime: "19:00",
    category: "Personal"
  }
];

export const seedFocusSessions: FocusSession[] = [
  {
    id: "focus-1",
    taskId: "task-1",
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 + 45 * 60000).toISOString(),
    durationMinutes: 45
  }
];

export const defaultSettings: UserSettings = {
  name: "Mohamed",
  theme: "light",
  timezone: "UTC",
  dailyFocusTargetMinutes: 120
};
