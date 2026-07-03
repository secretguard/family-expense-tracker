import { NextResponse } from 'next/server';
import { getAllExpenses, getBudgetsForMonth } from '@/lib/sheets';
import { currentMonthKey, aggregateByCategory, aggregateByMonth, formatMonthLabel } from '@/lib/aggregate';
import { generateAnalysis } from '@/lib/openrouter';

export async function POST() {
  try {
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
      return NextResponse.json({
        ok: true,
        analysis: `No expenses logged yet for ${formatMonthLabel(month, true)} — nothing to analyse yet.`,
      });
    }

    const summary = [
      `Month: ${formatMonthLabel(month, true)}`,
      `Spend by category this month (INR): ${JSON.stringify(categoryTotals)}`,
      `Budgets set for this month (INR): ${JSON.stringify(budgetInfo.budgets)}`,
      `Total spend, last ${trend.length} months (INR): ${JSON.stringify(trend)}`,
    ].join('\n');

    const analysis = await generateAnalysis(summary);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error('analyse route error:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not generate analysis right now. Try again in a moment.' },
      { status: 500 }
    );
  }
}
