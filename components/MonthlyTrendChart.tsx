'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatMonthLabel } from '@/lib/aggregate';

export default function MonthlyTrendChart({ data }: { data: { month: string; total: number }[] }) {
  if (!data.length) {
    return <p className="text-sm text-ink-muted py-10 text-center">Not enough data yet.</p>;
  }

  const chartData = data.map((d) => ({ label: formatMonthLabel(d.month), total: d.total }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ left: -12, right: 8, top: 4 }}>
        <CartesianGrid stroke="#272B3B" vertical={false} />
        <XAxis dataKey="label" stroke="#8D93A6" fontSize={12} tickLine={false} axisLine={{ stroke: '#272B3B' }} />
        <YAxis stroke="#8D93A6" fontSize={12} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Spend']}
          contentStyle={{ background: '#1A1D29', border: '1px solid #272B3B', borderRadius: 10, color: '#EEF0F6', fontSize: 13 }}
          labelStyle={{ color: '#8D93A6' }}
          cursor={{ fill: '#272B3B', opacity: 0.4 }}
        />
        <Bar dataKey="total" fill="#E8B75E" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
