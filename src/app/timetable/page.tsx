"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { MOCK_USER_ID } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayToIndex = dayOptions.reduce<Record<string, number>>((acc, day, idx) => ({ ...acc, [day]: idx }), {});
const indexToDay = dayOptions;

const categoryOptions = [
  { label: "Classes", value: "classes", color: "bg-blue-500", pill: "bg-blue-50 text-blue-600" },
  { label: "Work", value: "work", color: "bg-amber-500", pill: "bg-amber-50 text-amber-600" },
  { label: "Dissertation", value: "dissertation", color: "bg-green-500", pill: "bg-green-50 text-green-600" },
  { label: "Personal", value: "personal", color: "bg-purple-500", pill: "bg-purple-50 text-purple-600" },
];

const hourBlocks = Array.from({ length: 13 }, (_, idx) => 8 + idx); // 08:00 – 20:00
const hourHeight = 64;

interface DbTimetableRow {
  id: string;
  title: string;
  day: number;
  start_time: string;
  end_time: string;
  category: string | null;
  location: string | null;
  created_at: string;
}

interface TimetableEvent {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  category: string;
  location: string;
}

interface FormState {
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  category: string;
  location: string;
}

interface FormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
}

const buildInitialForm = (): FormState => ({
  title: "",
  dayOfWeek: dayOptions[0],
  startTime: "09:00",
  endTime: "10:00",
  category: categoryOptions[0].value,
  location: "",
});

const mapRow = (row: DbTimetableRow): TimetableEvent => ({
  id: row.id,
  title: row.title,
  dayOfWeek: indexToDay[row.day] ?? dayOptions[0],
  startTime: row.start_time,
  endTime: row.end_time,
  category: row.category ?? "classes",
  location: row.location ?? "",
});

export default function TimetablePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [form, setForm] = useState<FormState>(buildInitialForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const currentWeekEnd = useMemo(
    () => endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const rangeLabel = `${format(currentWeekStart, "MMM d")} – ${format(currentWeekEnd, "MMM d, yyyy")}`;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("timetable_events")
      .select("id,title,day,start_time,end_time,category,location,created_at")
      .eq("user_id", MOCK_USER_ID)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      toast.error("Unable to load timetable", { description: error.message });
      setEvents([]);
    } else {
      setEvents((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const grouped = useMemo(() => {
    return dayOptions.map((day) => ({
      day,
      events: events.filter((event) => event.dayOfWeek === day),
    }));
  }, [events]);

  const upcoming = useMemo(() => {
    return [...events].sort((a, b) => {
      const dayDiff = dayToIndex[a.dayOfWeek] - dayToIndex[b.dayOfWeek];
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [events]);

  const nextFew = upcoming.slice(0, 4);

  const validate = (): FormErrors => {
    const validation: FormErrors = {};
    if (!form.title.trim()) validation.title = "Title is required";
    if (!form.startTime) validation.startTime = "Start time required";
    if (!form.endTime) validation.endTime = "End time required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      validation.endTime = "End time must be after start";
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
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      day: dayToIndex[form.dayOfWeek],
      start_time: form.startTime,
      end_time: form.endTime,
      category: form.category,
      location: form.location.trim() || null,
      user_id: MOCK_USER_ID,
    };
    const { data, error } = await supabase.from("timetable_events").insert(payload).select().single();
    if (error) {
      toast.error("Unable to add event", { description: error.message });
    } else if (data) {
      toast.success("Event added");
      setEvents((prev) => [...prev, mapRow(data)]);
      setForm(buildInitialForm());
      setErrors({});
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("timetable_events").delete().eq("id", id).eq("user_id", MOCK_USER_ID);
    if (error) {
      toast.error("Unable to delete event", { description: error.message });
    } else {
      toast.success("Event removed");
      setEvents((prev) => prev.filter((event) => event.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="subtle">Weekly timetable</p>
          <h1 className="section-title text-2xl">Week View</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost px-2 py-1"
              aria-label="Show previous week"
              onClick={() => setWeekOffset((prev) => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 font-medium">
              <CalendarRange className="h-4 w-4" />
              <span>{rangeLabel}</span>
            </div>
            <button
              type="button"
              className="btn-ghost px-2 py-1"
              aria-label="Show next week"
              onClick={() => setWeekOffset((prev) => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {categoryOptions.slice(0, 3).map((option) => (
              <span key={option.value} className={`pill ${option.pill}`}>
                {option.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="card p-5 space-y-5">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-6">
          <div className="space-y-1 md:col-span-2">
            <input
              className={`input ${errors.title ? "border-red-500" : ""}`}
              placeholder="Event title"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>
          <select
            className="input"
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
          >
            {dayOptions.map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>
          <div className="space-y-1">
            <input
              type="time"
              className={`input ${errors.startTime ? "border-red-500" : ""}`}
              value={form.startTime}
              onChange={(e) => {
                setForm({ ...form, startTime: e.target.value });
                setErrors((prev) => ({ ...prev, startTime: undefined, endTime: undefined }));
              }}
            />
            {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
          </div>
          <div className="space-y-1">
            <input
              type="time"
              className={`input ${errors.endTime ? "border-red-500" : ""}`}
              value={form.endTime}
              onChange={(e) => {
                setForm({ ...form, endTime: e.target.value });
                setErrors((prev) => ({ ...prev, endTime: undefined }));
              }}
            />
            {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
          </div>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <button type="submit" className="btn-primary md:w-auto" disabled={submitting}>
            {submitting ? "Adding..." : "Add event"}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Agenda</h3>
            <span className="subtle">{events.length} events</span>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : nextFew.length === 0 ? (
            <p className="subtle">No events scheduled yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {nextFew.map((event) => {
                const categoryMeta = categoryOptions.find((option) => option.value === event.category);
                return (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {event.dayOfWeek} • {event.startTime} – {event.endTime}
                        </p>
                      </div>
                      {categoryMeta && <span className={`pill ${categoryMeta.pill}`}>{categoryMeta.label}</span>}
                    </div>
                    {event.location && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.location}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:hidden">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">Mobile schedule</h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-24 w-full rounded-2xl" />)
          ) : events.length === 0 ? (
            <p className="subtle">No events yet. Add one above.</p>
          ) : (
            grouped
              .filter((dayGroup) => dayGroup.events.length > 0)
              .map((dayGroup) => (
                <div
                  key={dayGroup.day}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{dayGroup.day}</p>
                    <span className="subtle">
                      {dayGroup.events.length} event{dayGroup.events.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {dayGroup.events.map((event) => {
                    const categoryMeta = categoryOptions.find((option) => option.value === event.category);
                    return (
                      <div
                        key={event.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm shadow-inner dark:border-slate-800 dark:bg-slate-800/60 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</p>
                          {categoryMeta && <span className={`pill ${categoryMeta.pill}`}>{categoryMeta.label}</span>}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {event.startTime} – {event.endTime}
                        </p>
                        {event.location && <p className="text-xs text-slate-500 dark:text-slate-400">Location: {event.location}</p>}
                        <button
                          type="button"
                          className="text-xs text-red-500 underline underline-offset-2 disabled:opacity-50"
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                        >
                          {deletingId === event.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
          )}
        </div>

        <div className="overflow-x-auto hidden lg:block">
          <div className="min-w-[980px] rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            {loading ? (
              <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                <Skeleton className="h-12 col-span-8" />
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={idx} className="border-l border-slate-100 dark:border-slate-800">
                    <Skeleton className="m-4 h-32" />
                  </div>
                ))}
              </div>
            ) : (
              <>
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
                    {hourBlocks.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-slate-100 px-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 flex items-start pt-1"
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>
                  {grouped.map(({ day, events: dayEvents }) => (
                    <div key={day} className="relative border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                      {hourBlocks.map((hour) => (
                        <div key={hour} className="h-16 border-b border-slate-100 dark:border-slate-800" />
                      ))}
                      {dayEvents.map((event) => {
                        const startMinutes = parseTime(event.startTime);
                        const endMinutes = parseTime(event.endTime);
                        const offset = Math.max(startMinutes - 8 * 60, 0);
                        const height = Math.max(endMinutes - startMinutes, 30);
                        const color = categoryOptions.find((option) => option.value === event.category)?.color ?? "bg-blue-500";
                        return (
                          <div
                            key={event.id}
                            className={`absolute left-2 right-2 rounded-2xl p-3 text-white shadow-lg ${color}`}
                            style={{ top: (offset / 60) * hourHeight, height: (height / 60) * hourHeight }}
                          >
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span className="text-ellipsis overflow-hidden whitespace-nowrap">{event.title}</span>
                              <CalendarClock className="h-4 w-4 opacity-80" />
                            </div>
                            <p className="text-xs opacity-90">
                              {event.startTime} – {event.endTime}
                            </p>
                            {event.location && <p className="text-xs opacity-90 line-clamp-2">{event.location}</p>}
                            <button
                              type="button"
                              className="mt-2 text-xs underline underline-offset-2 disabled:opacity-50"
                              onClick={() => handleDelete(event.id)}
                              disabled={deletingId === event.id}
                            >
                              {deletingId === event.id ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {!loading && events.length === 0 && (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No events scheduled yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
