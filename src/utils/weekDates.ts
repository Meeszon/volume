import type { Day } from "../types";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(monday: Date): Day[] {
  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return { id: name, date };
  });
}

export function shiftWeek(monday: Date, direction: 1 | -1): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + direction * 7);
  return d;
}

export function formatWeekLabel(monday: Date, today?: Date): string {
  const currentMonday = getMonday(today ?? new Date());
  if (monday.getTime() === currentMonday.getTime()) return "This week";
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export function isCurrentWeek(monday: Date, today?: Date): boolean {
  const currentMonday = getMonday(today ?? new Date());
  return monday.getTime() === currentMonday.getTime();
}

// ISO-8601 week number. Weeks start on Monday; week 1 is the week containing
// the first Thursday of the year (equivalently: the week containing Jan 4th).
export function getISOWeekNumber(date: Date): number {
  // Work in UTC against a day-only copy to avoid DST / TZ drift.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO weekday: Mon=1 … Sun=7
  const isoDay = d.getUTCDay() || 7;
  // Shift to the Thursday in the same ISO week.
  d.setUTCDate(d.getUTCDate() + 4 - isoDay);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
