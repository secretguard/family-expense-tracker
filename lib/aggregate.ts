import { ExpenseRow } from './sheets';

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function aggregateByCategory(expenses: ExpenseRow[], month: string): Record<string, number> {
  const map: Record<string, number> = {};
  expenses.filter((e) => e.month === month).forEach((e) => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return map;
}

export function aggregateByMonth(expenses: ExpenseRow[], lastN = 6): { month: string; total: number }[] {
  const map: Record<string, number> = {};
  expenses.forEach((e) => {
    if (!e.month) return;
    map[e.month] = (map[e.month] || 0) + e.amount;
  });
  const months = Object.keys(map).sort();
  return months.slice(-lastN).map((month) => ({ month, total: map[month] }));
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-07' -> 'Jul', or 'Jul 2026' with withYear */
export function formatMonthLabel(monthKey: string, withYear = false): string {
  const [year, m] = monthKey.split('-');
  const idx = Number(m) - 1;
  const name = MONTH_NAMES[idx] ?? monthKey;
  return withYear ? `${name} ${year}` : name;
}

/** '2026-07-03' -> 'Jul 3' */
export function formatDayLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  const idx = Number(m) - 1;
  const name = MONTH_NAMES[idx] ?? m;
  return `${name} ${Number(d)}`;
}
