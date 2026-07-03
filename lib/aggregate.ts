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
