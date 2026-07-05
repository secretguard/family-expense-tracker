export interface FixedVsDiscretionaryProps {
  fixedTotal: number;
  discretionaryTotal: number;
  fixedByCategory: { category: string; amount: number }[];
  discretionaryByCategory: { category: string; amount: number }[];
}

function CategoryList({ rows, dotClass }: { rows: { category: string; amount: number }[]; dotClass: string }) {
  if (!rows.length) {
    return <p className="text-sm text-ink-muted">None yet.</p>;
  }
  const sorted = [...rows].sort((a, b) => b.amount - a.amount);
  return (
    <ul className="space-y-1.5">
      {sorted.map((r) => (
        <li key={r.category} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-ink-text">
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            {r.category}
          </span>
          <span className="font-ledger tabular text-ink-muted">₹{r.amount.toLocaleString('en-IN')}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FixedVsDiscretionaryCard({
  fixedTotal,
  discretionaryTotal,
  fixedByCategory,
  discretionaryByCategory,
}: FixedVsDiscretionaryProps) {
  const total = fixedTotal + discretionaryTotal;

  if (total === 0) {
    return <p className="text-sm text-ink-muted py-6 text-center">No expenses logged yet this month.</p>;
  }

  const fixedPct = Math.round((fixedTotal / total) * 100);
  const discretionaryPct = 100 - fixedPct;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <span className="text-sm text-ink-text">
          Fixed <span className="font-ledger tabular text-brass-400">₹{fixedTotal.toLocaleString('en-IN')}</span>
        </span>
        <span className="text-sm text-ink-text">
          Discretionary <span className="font-ledger tabular text-ink-muted">₹{discretionaryTotal.toLocaleString('en-IN')}</span>
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-ink-line overflow-hidden flex">
        <div className="h-full bg-brass-400" style={{ width: `${fixedPct}%` }} />
        <div className="h-full bg-ink-muted/50" style={{ width: `${discretionaryPct}%` }} />
      </div>
      <p className="text-xs text-ink-muted mt-2">
        {fixedPct}% fixed · {discretionaryPct}% discretionary
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-6">
        <div>
          <h3 className="text-xs tracking-widest uppercase text-brass-400 mb-2">Fixed by category</h3>
          <CategoryList rows={fixedByCategory} dotClass="bg-brass-400" />
        </div>
        <div>
          <h3 className="text-xs tracking-widest uppercase text-ink-muted mb-2">Discretionary by category</h3>
          <CategoryList rows={discretionaryByCategory} dotClass="bg-ink-muted" />
        </div>
      </div>
    </div>
  );
}
