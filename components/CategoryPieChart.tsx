'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PALETTE = ['#E8B75E', '#5FCBA1', '#8FA6D9', '#F2897E', '#C9A6E8', '#7FD1D1', '#E8A5C4', '#B8C97F', '#E8C979', '#9BA3B7'];

export default function CategoryPieChart({ data }: { data: { category: string; amount: number }[] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-ink-muted py-10 text-center">No expenses logged yet this month.</p>
    );
  }

  const total = data.reduce((a, b) => a + b.amount, 0);
  const sorted = [...data].sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-full sm:w-56 h-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {sorted.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']}
              contentStyle={{ background: '#1A1D29', border: '1px solid #272B3B', borderRadius: 10, color: '#EEF0F6', fontSize: 13 }}
              labelStyle={{ color: '#8D93A6' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full space-y-2">
        {sorted.map((row, i) => {
          const pct = total > 0 ? Math.round((row.amount / total) * 100) : 0;
          return (
            <li key={row.category} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-text">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                {row.category}
              </span>
              <span className="font-ledger tabular text-ink-muted">
                ₹{row.amount.toLocaleString('en-IN')} <span className="text-ink-muted/70">· {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
