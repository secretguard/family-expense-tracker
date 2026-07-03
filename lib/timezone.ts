const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Converts a stored UTC timestamp into an IST calendar-day key ('YYYY-MM-DD'). */
export function toISTDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const shifted = new Date(d.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

/** IST calendar-day key for N days ago (0 = today, 1 = yesterday, ...), regardless of server timezone. */
export function istDateKeyDaysAgo(daysAgo: number): string {
  const shifted = new Date(Date.now() + IST_OFFSET_MS - daysAgo * 86400000);
  return shifted.toISOString().slice(0, 10);
}
