import { ExpenseRow } from './sheets';
import { toISTDateKey, istDateKeyDaysAgo } from './timezone';

export interface DailyRecapData {
  todayKey: string;
  yesterdayKey: string;
  todayTotal: number;
  yesterdayTotal: number;
  todayByCategory: Record<string, number>;
}

export function buildDailyRecap(expenses: ExpenseRow[]): DailyRecapData {
  const todayKey = istDateKeyDaysAgo(0);
  const yesterdayKey = istDateKeyDaysAgo(1);

  let todayTotal = 0;
  let yesterdayTotal = 0;
  const todayByCategory: Record<string, number> = {};

  expenses.forEach((e) => {
    const key = toISTDateKey(e.date);
    if (key === todayKey) {
      todayTotal += e.amount;
      todayByCategory[e.category] = (todayByCategory[e.category] || 0) + e.amount;
    } else if (key === yesterdayKey) {
      yesterdayTotal += e.amount;
    }
  });

  return { todayKey, yesterdayKey, todayTotal, yesterdayTotal, todayByCategory };
}

export interface WeeklyRecapData {
  weekStartKey: string;
  weekEndKey: string;
  thisWeekTotal: number;
  lastWeekTotal: number;
  thisWeekByCategory: Record<string, number>;
}

/** Rolling 7-day windows (today back 6 days) rather than calendar Mon-Sun weeks — simpler and unambiguous. */
export function buildWeeklyRecap(expenses: ExpenseRow[]): WeeklyRecapData {
  const thisWeekKeys = new Set(Array.from({ length: 7 }, (_, i) => istDateKeyDaysAgo(i)));
  const lastWeekKeys = new Set(Array.from({ length: 7 }, (_, i) => istDateKeyDaysAgo(i + 7)));

  let thisWeekTotal = 0;
  let lastWeekTotal = 0;
  const thisWeekByCategory: Record<string, number> = {};

  expenses.forEach((e) => {
    const key = toISTDateKey(e.date);
    if (thisWeekKeys.has(key)) {
      thisWeekTotal += e.amount;
      thisWeekByCategory[e.category] = (thisWeekByCategory[e.category] || 0) + e.amount;
    } else if (lastWeekKeys.has(key)) {
      lastWeekTotal += e.amount;
    }
  });

  return {
    weekStartKey: istDateKeyDaysAgo(6),
    weekEndKey: istDateKeyDaysAgo(0),
    thisWeekTotal,
    lastWeekTotal,
    thisWeekByCategory,
  };
}

/** e.g. "▲ 24% vs yesterday" / "▼ 12%" / "No change" / "First spending logged" */
export function formatChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? 'No comparison — nothing logged in the prior period' : 'No change';
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return 'No change';
  return pct > 0 ? `▲ ${pct}% more` : `▼ ${Math.abs(pct)}% less`;
}

export function topCategory(byCategory: Record<string, number>): { category: string; amount: number } | null {
  const entries = Object.entries(byCategory);
  if (!entries.length) return null;
  const [category, amount] = entries.sort((a, b) => b[1] - a[1])[0];
  return { category, amount };
}
