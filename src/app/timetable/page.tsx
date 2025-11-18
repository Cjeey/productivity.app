"use client";

import { useMemo, useState } from "react";
import { CalendarRange, CalendarClock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Category, TimetableEvent } from "@/lib/types";

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const categoryOptions: Category[] = ["Uni", "Work", "Personal"];

const categoryColors: Record<Category, string> = {
  Uni: "bg-blue-500",
  Work: "bg-amber-500",
  Personal: "bg-green-500",
};

export default function TimetablePage() {
  const { timetable, addTimetableEvent, deleteTimetableEvent } = useAppStore();
  const [newEvent, setNewEvent] = useState<Omit<TimetableEvent, "id">>({
    title: "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    category: "Uni",
    location: "",
    repeat: "Weekly",
  });

  const grouped = useMemo(() => {
    return dayOptions.map((day) => ({
      day,
      events: timetable
        .filter((event) => event.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }, [timetable]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addTimetableEvent(newEvent);
    setNewEvent((prev) => ({ ...prev, title: "", location: "" }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="subtle">Weekly timetable</p>
          <h1 className="section-title text-2xl">Week View</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <CalendarRange className="h-4 w-4" /> Nov 17 – Nov 23, 2025
          <span className="pill bg-blue-50 text-blue-600">Classes</span>
          <span className="pill bg-amber-50 text-amber-600">Work</span>
          <span className="pill bg-green-50 text-green-600">Personal</span>
        </div>
      </header>

      <section className="card p-5 space-y-4">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-5">
          <input
            className="input md:col-span-2"
            placeholder="Event title"
            value={newEvent.title}
            required
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />
          <select
            className="input"
            value={newEvent.dayOfWeek}
            onChange={(e) => setNewEvent({ ...newEvent, dayOfWeek: e.target.value })}
          >
            {dayOptions.map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            className="input"
            value={newEvent.startTime}
            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
          />
          <input
            type="time"
            className="input"
            value={newEvent.endTime}
            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
          />
          <select
            className="input"
            value={newEvent.category}
            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as Category })}
          >
            {categoryOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Location"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />
          <button type="submit" className="btn-primary md:w-auto">
            Add event
          </button>
        </form>

        <div className="overflow-x-auto">
          <div className="min-w-[900px] grid grid-cols-7 gap-3">
            {grouped.map(({ day, events }) => (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {day}
                  <span className="subtle">{events.length} events</span>
                </div>
                <div className="min-h-[520px] rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={`rounded-xl p-3 text-white shadow-sm flex flex-col gap-1 ${categoryColors[event.category]}`}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{event.title}</span>
                        <CalendarClock className="h-4 w-4 opacity-80" />
                      </div>
                      <span className="text-xs opacity-90">
                        {event.startTime} - {event.endTime}
                      </span>
                      {event.location && <span className="text-xs opacity-90">{event.location}</span>}
                      <button
                        type="button"
                        className="text-xs underline underline-offset-2"
                        onClick={() => deleteTimetableEvent(event.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {events.length === 0 && <p className="subtle">No events</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
