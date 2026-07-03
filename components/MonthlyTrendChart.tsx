'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function MonthlyTrendChart({ data }: { data: { month: string; total: number }[] }) {
  if (!data.length) return <p style={{ color: '#666' }}>Not enough data yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
        <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
