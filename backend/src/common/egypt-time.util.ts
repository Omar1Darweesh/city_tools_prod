export const EGYPT_TIMEZONE = 'Africa/Cairo';

export type TimezoneDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function getDatePartsInTimezone(
  date: Date,
  timeZone: string = EGYPT_TIMEZONE,
): TimezoneDateParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second'),
  };
}

function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

/** Convert an Egypt local calendar date/time to a UTC Date instant. */
export function egyptLocalToUtc(
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

export function formatEgyptDateKey(date: Date): string {
  const { year, month, day } = getDatePartsInTimezone(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getEgyptHourLabel(date: Date): string {
  const { hour } = getDatePartsInTimezone(date);
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getEgyptDayBounds(ref: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const { year, month, day } = getDatePartsInTimezone(ref);
  return {
    start: egyptLocalToUtc(year, month, day, 0, 0, 0, 0),
    end: egyptLocalToUtc(year, month, day, 23, 59, 59, 999),
  };
}

export function getEgyptDayBoundsWithOffset(
  ref: Date = new Date(),
  dayOffset: number,
): { start: Date; end: Date } {
  const { year, month, day } = getDatePartsInTimezone(ref);
  const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return getEgyptDayBounds(shifted);
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse API date query params; YYYY-MM-DD is treated as a full Egypt calendar day. */
export function parseQueryDateRange(
  startStr?: string,
  endStr?: string,
): { startDate?: Date; endDate?: Date } {
  if (!startStr && !endStr) return {};

  const parseStart = (s: string): Date => {
    const m = DATE_ONLY_RE.exec(s.trim());
    if (m) {
      return egyptLocalToUtc(+m[1], +m[2], +m[3], 0, 0, 0, 0);
    }
    return new Date(s);
  };

  const parseEnd = (s: string): Date => {
    const m = DATE_ONLY_RE.exec(s.trim());
    if (m) {
      return egyptLocalToUtc(+m[1], +m[2], +m[3], 23, 59, 59, 999);
    }
    return new Date(s);
  };

  return {
    startDate: startStr ? parseStart(startStr) : undefined,
    endDate: endStr ? parseEnd(endStr) : undefined,
  };
}

/** Ensure report queries never use a zero-length window (same instant start/end). */
export function normalizeReportDateRange(
  startDate?: Date,
  endDate?: Date,
): { startDate?: Date; endDate?: Date } {
  if (!startDate && !endDate) return {};
  if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
    const { year, month, day } = getDatePartsInTimezone(startDate);
    return {
      startDate: egyptLocalToUtc(year, month, day, 0, 0, 0, 0),
      endDate: egyptLocalToUtc(year, month, day, 23, 59, 59, 999),
    };
  }
  return { startDate, endDate };
}
