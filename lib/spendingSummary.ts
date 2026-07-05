import { getAllExpenses, getBudgetsForMonth } from './sheets';
import { currentMonthKey, aggregateByCategory, aggregateByMonth, formatMonthLabel } from './aggregate';

export interface SpendingSummary {
  summary: string | null;
  emptyMessage?: string;
}

/** Shared data-fetch + summarization used by both the AI Analyse report and the free-text ask box. */
export async function buildSpendingSummary(): Promise<SpendingSummary> {
  const month = currentMonthKey();
  const [expenses, budgetInfo] = await Promise.all([
    getAllExpenses(),
    getBudgetsForMonth(month),
  ]);

  const categoryTotals = aggregateByCategory(expenses, month);
  const trend = aggregateByMonth(expenses, 6).map((t) => ({
    month: formatMonthLabel(t.month, true),
    total: t.total,
  }));

  if (Object.keys(categoryTotals).length === 0) {
    return {
      summary: null,
      emptyMessage: `No expenses logged yet for ${formatMonthLabel(month, true)} — nothing to analyse yet.`,
    };
  }

  const summary = [
    `Month: ${formatMonthLabel(month, true)}`,
    `Spend by category this month (INR): ${JSON.stringify(categoryTotals)}`,
    `Budgets set for this month (INR): ${JSON.stringify(budgetInfo.budgets)}`,
    `Total spend, last ${trend.length} months (INR): ${JSON.stringify(trend)}`,
  ].join('\n');

  return { summary };
}
