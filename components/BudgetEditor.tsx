'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMonthLabel } from '@/lib/aggregate';

export default function BudgetEditor({
  month,
  categories,
  initialBudgets,
  isCarriedForward,
}: {
  month: string;
  categories: string[];
  initialBudgets: Record<string, number>;
  isCarriedForward: boolean;
}) {
  const allCategories = ['Overall', ...categories];
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(allCategories.map((c) => [c, initialBudgets[c] ? String(initialBudgets[c]) : '']))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const entries: Record<string, number> = {};
    for (const c of allCategories) {
      const n = Number(values[c]);
      if (!isNaN(n) && n > 0) entries[c] = n;
    }
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, entries }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      {isCarriedForward && (
        <p className="text-sm text-ink-muted mb-4">
          No budget saved yet for {formatMonthLabel(month, true)} — showing last month's values as a
          starting point. Edit and save to lock these in.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-2xl">
        {allCategories.map((c) => (
          <label key={c} className="flex items-center justify-between gap-3 py-1.5 border-b border-ink-line/60">
            <span className="text-sm text-ink-text">{c}</span>
            <span className="flex items-center gap-1">
              <span className="text-ink-muted text-sm">₹</span>
              <input
                type="number"
                min="0"
                value={values[c]}
                onChange={(e) => setValues({ ...values, [c]: e.target.value })}
                placeholder="0"
                className="w-28 bg-transparent text-right font-ledger tabular text-sm text-ink-text placeholder:text-ink-muted/40 border border-ink-line rounded-lg px-2 py-1 focus:border-brass-400"
              />
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brass-400 text-ink-bg text-sm font-medium px-5 py-2 hover:bg-brass-300 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save budgets'}
        </button>
        {saved && <span className="text-sm text-mint-400">Saved.</span>}
      </div>
    </div>
  );
}
