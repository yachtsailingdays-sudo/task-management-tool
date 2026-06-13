/** Calendar grid configuration. */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 22;
export const SLOT_MINUTES = 30;
export const SLOTS_PER_DAY = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Local IANA time zone, e.g. "Asia/Tokyo". */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Midnight (00:00) of the Monday on or before the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Format a Date as a local ISO string without timezone suffix, e.g. 2026-06-13T09:30:00. */
export function toLocalISO(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDayHeading(date: Date): string {
  return `${WEEKDAY_LABELS[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  return `${weekStart.getFullYear()}年 ${weekStart.getMonth() + 1}/${weekStart.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
}

/** Human readable minutes, e.g. 90 -> "1時間30分". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

/** The Date corresponding to a given day column and slot index in the grid. */
export function slotToDate(weekStart: Date, dayIndex: number, slotIndex: number): Date {
  const d = addDays(weekStart, dayIndex);
  d.setHours(DAY_START_HOUR, 0, 0, 0);
  return addMinutes(d, slotIndex * SLOT_MINUTES);
}

/** Vertical offset (in slot units) of a time within the visible day. */
export function minutesFromDayStart(date: Date): number {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
}
