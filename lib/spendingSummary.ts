import { getAllExpenses, getBudgetsForMonth, getCategoryTypeMap } from './sheets';
import { currentMonthKey, aggregateByCategory, aggregateByMonth, formatMonthLabel } from './aggregate';

export interface SpendingSummary {
  summary: string | null;
  emptyMessage?: string;
}

/**
 * Shared data-fetch + summarization used by both the AI Analyse report and the
 * free-text ask box. True spend (Expense-type categories) is reported as the main
 * figure; invested and lent-out totals are called out as separate line items so the
 * AI doesn't fold a SIP payment or a loan given to a friend into "overspending."
 */
export async function buildSpendingSummary(): Promise<SpendingSummary> {
  const month = currentMonthKey();
  const [expenses, budgetInfo, categoryTypes] = await Promise.all([
    getAllExpenses(),
    getBudgetsForMonth(month),
    getCategoryTypeMap(),
  ]);

  const typeOf = (category: string) => categoryTypes[category] ?? 'Expense';
  const monthExpenses = expenses.filter((e) => e.month === month);
  const spendExpenses = monthExpenses.filter((e) => typeOf(e.category) === 'Expense');
  const investedTotal = monthExpenses.filter((e) => typeOf(e.category) === 'Investment').reduce((a, b) => a + b.amount, 0);
  const lentTotal = monthExpenses.filter((e) => typeOf(e.category) === 'Transfer').reduce((a, b) => a + b.amount, 0);

  const categoryTotals = aggregateByCategory(spendExpenses, month);
  const expenseOnlyAll = expenses.filter((e) => typeOf(e.category) === 'Expense');
  const trend = aggregateByMonth(expenseOnlyAll, 6).map((t) => ({
    month: formatMonthLabel(t.month, true),
    total: t.total,
  }));
  const expenseBudgets = Object.fromEntries(
    Object.entries(budgetInfo.budgets).filter(([category]) => typeOf(category) === 'Expense')
  );

  if (Object.keys(categoryTotals).length === 0 && investedTotal === 0 && lentTotal === 0) {
    return {
      summary: null,
      emptyMessage: `No expenses logged yet for ${formatMonthLabel(month, true)} — nothing to analyse yet.`,
    };
  }

  const summary = [
    `Month: ${formatMonthLabel(month, true)}`,
    `True spend by category this month, Expense-type only (INR): ${JSON.stringify(categoryTotals)}`,
    `Budgets set for this month, Expense-type categories only (INR): ${JSON.stringify(expenseBudgets)}`,
    `Total true spend, last ${trend.length} months, Expense-type only (INR): ${JSON.stringify(trend)}`,
  ];

  if (investedTotal > 0) {
    summary.push(`Total invested this month (INR): ${investedTotal} — this is savings/investment, NOT spend. Do not count it toward "overspending."`);
  }
  if (lentTotal > 0) {
    summary.push(`Total lent to others this month (INR): ${lentTotal} — this is money given to friends/family expected back, NOT spend. Do not count it toward "overspending."`);
  }

  return { summary: summary.join('\n') };
}
