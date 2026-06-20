export const EGYPT_TIMEZONE = 'Africa/Cairo';

function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

function egyptLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const utcNominal = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, ms),
  );
  const offsetMin = getTimezoneOffsetMinutes(EGYPT_TIMEZONE, utcNominal);
  return new Date(utcNominal.getTime() - offsetMin * 60 * 1000);
}

/** YYYY-MM-DD calendar day in Egypt → UTC ISO range for API queries. */
export function getEgyptDayIsoRange(dateStr: string): {
  startDate: string;
  endDate: string;
} {
  const [year, month, day] = dateStr.split('-').map(Number);
  return {
    startDate: egyptLocalToUtc(year, month, day, 0, 0, 0, 0).toISOString(),
    endDate: egyptLocalToUtc(year, month, day, 23, 59, 59, 999).toISOString(),
  };
}

export function getTodayInEgypt(): string {
  return formatEgyptDate(new Date());
}

export function formatEgyptDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIMEZONE,
  }).format(date);
}

export function shiftEgyptDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function getEgyptDayOfWeek(date: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: EGYPT_TIMEZONE,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function formatInEgypt(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleString('ar-EG', { timeZone: EGYPT_TIMEZONE, ...options });
}
