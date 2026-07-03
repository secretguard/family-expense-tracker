'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Incorrect password.');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-widest uppercase text-brass-400 mb-2 text-center">Household ledger</p>
        <h1 className="font-display text-2xl text-ink-text text-center mb-8">Family Expense Tracker</h1>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-6">
          <label className="block text-sm text-ink-muted mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full bg-ink-bg border border-ink-line rounded-lg px-3 py-2.5 text-ink-text focus:border-brass-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-brass-400 text-ink-bg font-medium py-2.5 hover:bg-brass-300 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
          {error && <p className="mt-3 text-sm text-coral-400 text-center">{error}</p>}
        </form>
      </div>
    </main>
  );
}
