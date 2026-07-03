import { NextRequest, NextResponse } from 'next/server';
import { getAllExpenses } from '@/lib/sheets';
import { buildWeeklyRecap, formatChange } from '@/lib/recap';
import { formatDayLabel } from '@/lib/aggregate';
import { sendTelegramMessage } from '@/lib/telegram';
import { config } from '@/lib/config';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${config.cronSecret()}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expenses = await getAllExpenses();
    const recap = buildWeeklyRecap(expenses);

    const lines: string[] = [];
    lines.push(`🗓️ <b>Weekly recap — ${formatDayLabel(recap.weekStartKey)} to ${formatDayLabel(recap.weekEndKey)}</b>`);
    lines.push('');

    if (recap.thisWeekTotal === 0) {
      lines.push('No expenses logged this week.');
    } else {
      lines.push(`This week: ₹${recap.thisWeekTotal.toLocaleString('en-IN')}`);
      lines.push(`Last week: ₹${recap.lastWeekTotal.toLocaleString('en-IN')}`);
      lines.push(formatChange(recap.thisWeekTotal, recap.lastWeekTotal) + ' than last week');

      const sorted = Object.entries(recap.thisWeekByCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (sorted.length) {
        lines.push('');
        lines.push('Top categories:');
        sorted.forEach(([category, amount], i) => {
          lines.push(`${i + 1}. ${category} — ₹${amount.toLocaleString('en-IN')}`);
        });
      }
    }

    await sendTelegramMessage(config.allowedChatId(), lines.join('\n'), 'HTML');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('weekly-recap cron error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to send weekly recap' }, { status: 500 });
  }
}
