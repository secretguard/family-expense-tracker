export interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
}

export default function BudgetVsActual({ rows }: { rows: BudgetRow[] }) {
  if (!rows.length) return <p style={{ color: '#666' }}>No budgets or spending recorded yet.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {rows.map((r) => {
        const pct = r.budget > 0 ? Math.min(100, Math.round((r.actual / r.budget) * 100)) : 0;
        const over = r.budget > 0 && r.actual > r.budget;
        return (
          <div key={r.category}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 2 }}>
              <span>{r.category}</span>
              <span style={{ color: over ? '#dc2626' : '#333' }}>
                ₹{r.actual.toLocaleString('en-IN')}
                {r.budget > 0 ? ` / ₹${r.budget.toLocaleString('en-IN')}` : ' (no budget set)'}
              </span>
            </div>
            <div style={{ background: '#eee', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, background: over ? '#dc2626' : '#059669', height: '100%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
