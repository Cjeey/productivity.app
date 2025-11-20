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

const hours = Array.from({ length: 13 }, (_, idx) => 8 + idx); // 8am - 20pm
const hourHeight = 64;

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

      <section className="card p-5 space-y-5">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-6">
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
          <div className="min-w-[1100px] rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-300">
              <div className="p-4">Time</div>
              {dayOptions.map((day) => (
                <div key={day} className="p-4 text-center text-slate-700 dark:text-slate-100">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[80px_repeat(7,1fr)]">
              <div className="border-r border-slate-200 dark:border-slate-800">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-slate-100 px-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 flex items-start pt-1"
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>
              {dayOptions.map((day) => (
                <div key={day} className="relative border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                  {hours.map((hour) => (
                    <div key={hour} className="h-16 border-b border-slate-100 dark:border-slate-800" />
                  ))}
                  {grouped
                    .find((d) => d.day === day)
                    ?.events.map((event) => {
                      const startMinutes = parseMinutes(event.startTime);
                      const endMinutes = parseMinutes(event.endTime);
                      const offset = Math.max(startMinutes - 8 * 60, 0);
                      const height = Math.max(endMinutes - startMinutes, 30);
                      return (
                        <div
                          key={event.id}
                          className={`absolute left-2 right-2 rounded-2xl p-3 text-white shadow-lg ${categoryColors[event.category]}`}
                          style={{
                            top: (offset / 60) * hourHeight,
                            height: (height / 60) * hourHeight,
                          }}
                        >
                          <div className="flex items-center justify-between text-sm font-semibold">
                            <span>{event.title}</span>
                            <CalendarClock className="h-4 w-4 opacity-80" />
                          </div>
                          <p className="text-xs opacity-90">
                            {event.startTime} - {event.endTime}
                          </p>
                          {event.location && <p className="text-xs opacity-90">{event.location}</p>}
                          <button
                            type="button"
                            className="mt-2 text-xs underline underline-offset-2"
                            onClick={() => deleteTimetableEvent(event.id)}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function parseMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
