import { NextRequest, NextResponse } from 'next/server';
import { ensureSheetsExist } from '@/lib/sheets';
import { config } from '@/lib/config';

/**
 * Visit this once after deploying: https://<your-app-url>/api/setup?secret=<SETUP_SECRET>
 * Creates the Expenses / Categories / Budgets / ProcessedUpdates / PendingConfirmations /
 * BudgetAlerts tabs if they don't already exist. Safe to call more than once.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expected = config.setupSecret();

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Missing or incorrect secret.' }, { status: 401 });
  }

  const created = await ensureSheetsExist();
  return NextResponse.json({
    ok: true,
    created: created.length ? created : 'Nothing to create — all tabs already existed.',
  });
}
