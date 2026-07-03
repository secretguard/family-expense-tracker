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
    <main style={{ fontFamily: 'sans-serif', maxWidth: 360, margin: '5rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.4rem' }}>Family Expense Tracker</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', boxSizing: 'border-box' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: '0.75rem', padding: '0.6rem 1.2rem', width: '100%', cursor: 'pointer' }}
        >
          {loading ? 'Checking…' : 'Enter'}
        </button>
        {error && <p style={{ color: 'crimson', marginTop: '0.5rem' }}>{error}</p>}
      </form>
    </main>
  );
}
