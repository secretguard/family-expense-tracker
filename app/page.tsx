export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Family Expense Tracker</h1>
      <p>
        This page is a placeholder — the dashboard (charts, budgets, AI analysis) is
        the next build step, not built yet.
      </p>
      <p>
        Right now this app only runs the Telegram ingestion backend, live at{' '}
        <code>/api/telegram-webhook</code>.
      </p>
    </main>
  );
}
