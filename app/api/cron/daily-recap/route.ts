import { NextRequest, NextResponse } from 'next/server';
import { getAllExpenses, getBudgetsForMonth, getSentBudgetAlerts, recordBudgetAlerts, getCategoryTypeMap } from '@/lib/sheets';
import { buildDailyRecap, formatChange, topCategory } from '@/lib/recap';
import { currentMonthKey, aggregateByCategory, formatDayLabel } from '@/lib/aggregate';
import { computeBudgetAlerts, formatBudgetAlertMessage } from '@/lib/budgetAlerts';
import { sendTelegramMessage } from '@/lib/telegram';
import { config } from '@/lib/config';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${config.cronSecret()}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expenses = await getAllExpenses();
    const recap = buildDailyRecap(expenses);

    const lines: string[] = [];
    lines.push(`📊 <b>Daily recap — ${formatDayLabel(recap.todayKey)}</b>`);
    lines.push('');

    if (recap.todayTotal === 0) {
      lines.push('No expenses logged today.');
    } else {
      lines.push(`Today: ₹${recap.todayTotal.toLocaleString('en-IN')}`);
      lines.push(`Yesterday: ₹${recap.yesterdayTotal.toLocaleString('en-IN')}`);
      lines.push(formatChange(recap.todayTotal, recap.yesterdayTotal) + ' than yesterday');

      const top = topCategory(recap.todayByCategory);
      if (top) {
        lines.push('');
        lines.push(`Biggest today: ${top.category} (₹${top.amount.toLocaleString('en-IN')})`);
      }
    }

    await sendTelegramMessage(config.allowedChatId(), lines.join('\n'), 'HTML');

    // Piggyback budget threshold alerts on this same cron invocation — Vercel Hobby
    // only allows one cron job per schedule, so this avoids adding a second entry.
    const month = currentMonthKey();
    const categoryTotals = aggregateByCategory(expenses, month);
    const [budgetInfo, alreadySent, categoryTypes] = await Promise.all([
      getBudgetsForMonth(month),
      getSentBudgetAlerts(month),
      getCategoryTypeMap(),
    ]);
    const newAlerts = computeBudgetAlerts(categoryTotals, budgetInfo.budgets, alreadySent, categoryTypes);

    if (newAlerts.length) {
      const alertText = newAlerts.map(formatBudgetAlertMessage).join('\n\n');
      await sendTelegramMessage(config.allowedChatId(), alertText, 'HTML');
      await recordBudgetAlerts(month, newAlerts.map((a) => ({ category: a.category, threshold: a.threshold })));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('daily-recap cron error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to send daily recap' }, { status: 500 });
  }
}
