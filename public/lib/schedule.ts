import { DayName, ScheduleEvent, Semester } from "./types";

export const weekdays: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

export function dayName(date = new Date()): DayName {
  return date.toLocaleDateString("en-CA", { weekday: "long" }) as DayName;
}

export function eventsForDay(semester: Semester, day: DayName) {
  return semester.schedule
    .filter((event) => event.day === day)
    .sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
}

export function getCurrentOrNextEvent(semester: Semester, now = new Date()) {
  const currentDay = dayName(now);
  const todayIndex = weekdays.indexOf(currentDay);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (todayIndex >= 0) {
    const today = eventsForDay(semester, currentDay);
    const ongoing = today.find((event) => minutesFromTime(event.start) <= nowMinutes && minutesFromTime(event.end) > nowMinutes);
    if (ongoing) return { event: ongoing, status: "ongoing" as const, daysAway: 0 };
    const upcoming = today.find((event) => minutesFromTime(event.start) > nowMinutes);
    if (upcoming) return { event: upcoming, status: "upcoming" as const, daysAway: 0 };
  }

  for (let offset = 1; offset <= 7; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const day = dayName(date);
    const events = eventsForDay(semester, day);
    if (events.length) return { event: events[0], status: "upcoming" as const, daysAway: offset };
  }

  return null;
}

export function semesterWeek(semester: Semester, now = new Date()) {
  const start = new Date(`${semester.startsOn}T00:00:00`);
  const diff = now.getTime() - start.getTime();
  if (diff < 0) return null;
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export function eventDurationMinutes(event: ScheduleEvent) {
  return minutesFromTime(event.end) - minutesFromTime(event.start);
}
