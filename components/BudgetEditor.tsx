'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
          No budget saved yet for {month} — showing last month's values as a starting point.
          Edit and save to lock these in for {month}.
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 420 }}>
        <tbody>
          {allCategories.map((c) => (
            <tr key={c}>
              <td style={{ padding: '0.3rem 0.5rem 0.3rem 0' }}>{c}</td>
              <td style={{ padding: '0.3rem 0' }}>
                <input
                  type="number"
                  min="0"
                  value={values[c]}
                  onChange={(e) => setValues({ ...values, [c]: e.target.value })}
                  style={{ width: '110px', padding: '0.3rem', boxSizing: 'border-box' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: '0.75rem', padding: '0.5rem 1.1rem', cursor: 'pointer' }}
      >
        {saving ? 'Saving…' : 'Save budgets'}
      </button>
      {saved && <span style={{ marginLeft: '0.6rem', color: '#059669' }}>Saved.</span>}
    </div>
  );
}
