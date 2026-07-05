'use client';

import { useState } from 'react';

function renderAnalysis(text: string) {
  // Lightweight formatting: lines starting with "- " become list items,
  // everything else becomes a paragraph. No markdown library needed for this.
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const blocks: { type: 'p' | 'li'; text: string }[] = lines.map((l) =>
    l.trim().startsWith('- ') ? { type: 'li', text: l.trim().slice(2) } : { type: 'p', text: l.trim() }
  );

  const out: JSX.Element[] = [];
  let currentList: string[] = [];

  function flushList() {
    if (currentList.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="list-disc list-inside space-y-1.5 mt-2 mb-3 text-ink-text">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  }

  blocks.forEach((b, i) => {
    if (b.type === 'li') {
      currentList.push(b.text);
    } else {
      flushList();
      out.push(
        <p key={i} className="text-sm leading-relaxed text-ink-text mb-2">
          {b.text}
        </p>
      );
    }
  });
  flushList();

  return out;
}

const MAX_QUESTION_LENGTH = 500;

export default function AIAnalyseCard() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  async function handleAnalyse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyse', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      setAnalysis(data.analysis);
    } catch {
      setError('Could not generate analysis right now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) {
      setAskError('Type a question first.');
      return;
    }
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      setAskError(`Keep it under ${MAX_QUESTION_LENGTH} characters.`);
      return;
    }

    setAsking(true);
    setAskError(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      setAnswer(data.answer);
    } catch {
      setAskError('Could not get an answer right now. Try again in a moment.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-widest uppercase text-brass-400 mb-1">On demand</p>
          <h2 className="font-display text-lg text-ink-text">AI analysis</h2>
          <p className="text-sm text-ink-muted mt-1 max-w-md">
            A written breakdown of this month's spending and specific tips, generated only when you ask —
            never automatically.
          </p>
        </div>
        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="shrink-0 rounded-full bg-brass-400 text-ink-bg text-sm font-medium px-5 py-2 hover:bg-brass-300 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Analysing…' : analysis ? 'Re-analyse' : 'AI Analyse'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-coral-400">{error}</p>}

      {analysis && (
        <div className="mt-5 rounded-xl border border-ink-line bg-ink-bg/50 p-4 sm:p-5">
          {renderAnalysis(analysis)}
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-ink-line/60">
        <p className="text-xs tracking-widest uppercase text-brass-400 mb-2">Ask a question</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. how much did we spend on eating out last month?"
            maxLength={MAX_QUESTION_LENGTH}
            className="flex-1 min-w-0 bg-transparent text-sm text-ink-text placeholder:text-ink-muted/50 border border-ink-line rounded-lg px-3 py-2 focus:border-brass-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={asking}
            className="shrink-0 rounded-full bg-brass-400 text-ink-bg text-sm font-medium px-5 py-2 hover:bg-brass-300 disabled:opacity-60 transition-colors"
          >
            {asking ? 'Asking…' : 'Ask'}
          </button>
        </form>

        {askError && <p className="mt-3 text-sm text-coral-400">{askError}</p>}

        {answer && (
          <div className="mt-4 rounded-xl border border-ink-line bg-ink-bg/50 p-4 sm:p-5">
            {renderAnalysis(answer)}
          </div>
        )}
      </div>
    </div>
  );
}
