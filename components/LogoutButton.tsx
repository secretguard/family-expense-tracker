'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-ink-muted hover:text-ink-text border border-ink-line rounded-full px-4 py-1.5 transition-colors"
    >
      Log out
    </button>
  );
}
