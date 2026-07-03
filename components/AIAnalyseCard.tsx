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

export default function AIAnalyseCard() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
