export interface OutflowBreakdownProps {
  totalOutflow: number;
  actualSpend: number;
  invested: number;
  lentOut: number;
}

export default function OutflowBreakdownCard({ totalOutflow, actualSpend, invested, lentOut }: OutflowBreakdownProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Tier 1 — the totals, equal size/weight */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">Total outflow</span>
        <span className="font-ledger tabular text-3xl text-ink-text">₹{totalOutflow.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-text">Actual spend</span>
        <span className="font-ledger tabular text-3xl text-brass-400">₹{actualSpend.toLocaleString('en-IN')}</span>
      </div>

      {/* Tier 2 — secondary but still real numbers, not muted fine print */}
      <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-ink-line/60">
        <span className="text-sm text-ink-muted">Invested</span>
        <span className="font-ledger tabular text-xl font-semibold text-mint-400">₹{invested.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">Lent out</span>
        <span className="font-ledger tabular text-xl font-semibold text-[#8FA6D9]">₹{lentOut.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
