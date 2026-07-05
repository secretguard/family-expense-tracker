import { NextRequest, NextResponse } from 'next/server';
import { buildSpendingSummary } from '@/lib/spendingSummary';
import { answerSpendingQuestion } from '@/lib/openrouter';

const MAX_QUESTION_LENGTH = 500;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    const trimmed = typeof question === 'string' ? question.trim() : '';

    if (!trimmed) {
      return NextResponse.json({ ok: false, error: 'Question is required.' }, { status: 400 });
    }
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Question is too long (max ${MAX_QUESTION_LENGTH} characters).` },
        { status: 400 }
      );
    }

    const { summary, emptyMessage } = await buildSpendingSummary();
    if (!summary) {
      return NextResponse.json({ ok: true, answer: emptyMessage });
    }

    const answer = await answerSpendingQuestion(summary, trimmed);
    return NextResponse.json({ ok: true, answer });
  } catch (err) {
    console.error('ask route error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: `Could not answer question: ${message}` },
      { status: 500 }
    );
  }
}
