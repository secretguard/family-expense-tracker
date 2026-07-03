import { NextRequest, NextResponse } from 'next/server';
import { upsertBudgetsForMonth } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  const { month, entries } = await req.json();
  if (!month || !entries || typeof entries !== 'object') {
    return NextResponse.json({ ok: false, error: 'month and entries required' }, { status: 400 });
  }
  await upsertBudgetsForMonth(month, entries);
  return NextResponse.json({ ok: true });
}
