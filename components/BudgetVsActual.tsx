export interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
}

export default function BudgetVsActual({ rows }: { rows: BudgetRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-ink-muted py-6 text-center">No budgets or spending recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => {
        const pct = r.budget > 0 ? Math.min(100, Math.round((r.actual / r.budget) * 100)) : 0;
        const over = r.budget > 0 && r.actual > r.budget;
        return (
          <div key={r.category}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm text-ink-text">{r.category}</span>
              <span className={`font-ledger tabular text-sm ${over ? 'text-coral-400' : 'text-ink-muted'}`}>
                ₹{r.actual.toLocaleString('en-IN')}
                {r.budget > 0 ? (
                  <span className="text-ink-muted/70"> / ₹{r.budget.toLocaleString('en-IN')}</span>
                ) : (
                  <span className="text-ink-muted/50"> · no budget set</span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-line overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${over ? 'bg-coral-400' : 'bg-mint-400'}`}
                style={{ width: `${r.budget > 0 ? pct : 0}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
