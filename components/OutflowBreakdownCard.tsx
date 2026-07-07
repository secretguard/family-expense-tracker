export interface OutflowBreakdownProps {
  totalOutflow: number;
  actualSpend: number;
  invested: number;
  lentOut: number;
}

export default function OutflowBreakdownCard({ totalOutflow, actualSpend, invested, lentOut }: OutflowBreakdownProps) {
  return (
    <div>
      <p className="text-sm text-ink-muted pb-4 mb-4 border-b border-ink-line/60">
        Total outflow this month ·{' '}
        <span className="font-ledger tabular text-ink-text">₹{totalOutflow.toLocaleString('en-IN')}</span>
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-text">Actual spend</span>
          <span className="font-ledger tabular text-2xl text-brass-400">₹{actualSpend.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">Invested</span>
          <span className="font-ledger tabular text-sm text-ink-muted">₹{invested.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">Lent out</span>
          <span className="font-ledger tabular text-sm text-ink-muted">₹{lentOut.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
