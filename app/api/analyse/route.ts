import { NextResponse } from 'next/server';
import { buildSpendingSummary } from '@/lib/spendingSummary';
import { generateAnalysis } from '@/lib/openrouter';

export async function POST() {
  try {
    const { summary, emptyMessage } = await buildSpendingSummary();

    if (!summary) {
      return NextResponse.json({ ok: true, analysis: emptyMessage });
    }

    const analysis = await generateAnalysis(summary);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error('analyse route error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: `Could not generate analysis: ${message}` },
      { status: 500 }
    );
  }
}
