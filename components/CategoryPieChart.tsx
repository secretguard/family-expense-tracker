'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777', '#65a30d', '#0284c7', '#ea580c'];

export default function CategoryPieChart({ data }: { data: { category: string; amount: number }[] }) {
  if (!data.length) return <p style={{ color: '#666' }}>No expenses logged yet this month.</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
