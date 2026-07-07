import { getAllExpenses, getCategoryList, getBudgetsForMonth, getCategoryTypeMap } from '@/lib/sheets';
import { currentMonthKey, aggregateByCategory, aggregateByMonth, formatMonthLabel } from '@/lib/aggregate';
import CategoryPieChart from '@/components/CategoryPieChart';
import MonthlyTrendChart from '@/components/MonthlyTrendChart';
import BudgetVsActual from '@/components/BudgetVsActual';
import BudgetEditor from '@/components/BudgetEditor';
import AIAnalyseCard from '@/components/AIAnalyseCard';
import OutflowBreakdownCard from '@/components/OutflowBreakdownCard';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic'; // always fetch fresh sheet data, never statically cache

export default async function DashboardPage() {
  const month = currentMonthKey();

  const [expenses, categories, budgetInfo, categoryTypes] = await Promise.all([
    getAllExpenses(),
    getCategoryList(),
    getBudgetsForMonth(month),
    getCategoryTypeMap(),
  ]);

  const typeOf = (category: string) => categoryTypes[category] ?? 'Expense';

  // True spend excludes Investment/Transfer categories (chit funds, SIPs, money lent
  // out) — those are real outflows but not "spend," and shouldn't count toward budgets,
  // budget alerts, or the category/trend charts below. They're surfaced separately in
  // the hero card instead.
  const monthExpenses = expenses.filter((e) => e.month === month);
  const spendExpenses = monthExpenses.filter((e) => typeOf(e.category) === 'Expense');
  const investedTotal = monthExpenses.filter((e) => typeOf(e.category) === 'Investment').reduce((a, b) => a + b.amount, 0);
  const lentTotal = monthExpenses.filter((e) => typeOf(e.category) === 'Transfer').reduce((a, b) => a + b.amount, 0);

  const categoryTotals = aggregateByCategory(spendExpenses, month);
  const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({ category, amount }));
  const expenseOnlyAll = expenses.filter((e) => typeOf(e.category) === 'Expense');
  const monthlyTrend = aggregateByMonth(expenseOnlyAll, 6);

  const allCategoriesForBudget = Array.from(new Set([...categories, ...Object.keys(categoryTotals)]))
    .filter((c) => typeOf(c) === 'Expense');
  const budgetRows = allCategoriesForBudget
    .map((c) => ({ category: c, budget: budgetInfo.budgets[c] ?? 0, actual: categoryTotals[c] ?? 0 }))
    .filter((r) => r.budget > 0 || r.actual > 0)
    .sort((a, b) => b.actual - a.actual);

  const overallActual = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const totalOutflow = overallActual + investedTotal + lentTotal;
  const overallBudget = budgetInfo.budgets['Overall'] ?? 0;
  const overallPct = overallBudget > 0 ? Math.min(100, Math.round((overallActual / overallBudget) * 100)) : 0;
  const overallOver = overallBudget > 0 && overallActual > overallBudget;

  const topCategory = pieData.length ? [...pieData].sort((a, b) => b.amount - a.amount)[0] : null;

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-brass-400">Household ledger</p>
            <h1 className="font-display text-2xl text-ink-text mt-0.5">Family Expense Tracker</h1>
          </div>
          <LogoutButton />
        </div>

        {/* Hero card */}
        <section className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-6 sm:p-8 mb-6">
          <p className="text-sm text-ink-muted">{formatMonthLabel(month, true)} spend</p>
          <div className="flex items-end gap-3 mt-1 flex-wrap">
            <span className="font-display font-ledger text-4xl sm:text-5xl text-ink-text tabular">
              ₹{overallActual.toLocaleString('en-IN')}
            </span>
            {overallBudget > 0 && (
              <span className="text-ink-muted text-sm mb-1.5">
                of ₹{overallBudget.toLocaleString('en-IN')} budget
              </span>
            )}
          </div>

          {(investedTotal > 0 || lentTotal > 0) && (
            <p className="text-xs text-ink-muted mt-1.5">
              +{' '}
              {investedTotal > 0 && (
                <>
                  <span className="font-ledger tabular">₹{investedTotal.toLocaleString('en-IN')}</span> invested
                </>
              )}
              {investedTotal > 0 && lentTotal > 0 && ' · '}
              {lentTotal > 0 && (
                <>
                  <span className="font-ledger tabular">₹{lentTotal.toLocaleString('en-IN')}</span> lent out
                </>
              )}
            </p>
          )}

          {overallBudget > 0 ? (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-ink-line overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overallOver ? 'bg-coral-400' : 'bg-brass-400'}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${overallOver ? 'text-coral-400' : 'text-ink-muted'}`}>
                {overallOver
                  ? `Over budget by ₹${(overallActual - overallBudget).toLocaleString('en-IN')}`
                  : `${overallPct}% of budget used`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink-muted mt-3">No overall budget set yet — add one below.</p>
          )}

          {topCategory && (
            <p className="text-sm text-ink-muted mt-4 pt-4 border-t border-ink-line/60">
              Biggest category so far:{' '}
              <span className="text-ink-text">{topCategory.category}</span>{' '}
              <span className="font-ledger tabular">(₹{topCategory.amount.toLocaleString('en-IN')})</span>
            </p>
          )}
        </section>

        {/* This month's outflow breakdown */}
        <section className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-5 sm:p-6 mb-6">
          <h2 className="font-display text-lg text-ink-text mb-4">This month's outflow breakdown</h2>
          <OutflowBreakdownCard
            totalOutflow={totalOutflow}
            actualSpend={overallActual}
            invested={investedTotal}
            lentOut={lentTotal}
          />
        </section>

        {/* Category + trend grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-5 sm:p-6">
            <h2 className="font-display text-lg text-ink-text mb-4">Spend by category</h2>
            <CategoryPieChart data={pieData} />
          </section>

          <section className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-5 sm:p-6">
            <h2 className="font-display text-lg text-ink-text mb-4">Monthly trend</h2>
            <MonthlyTrendChart data={monthlyTrend} />
          </section>
        </div>

        {/* Budget vs actual */}
        <section className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-5 sm:p-6 mb-6">
          <h2 className="font-display text-lg text-ink-text mb-4">Budget vs actual</h2>
          <BudgetVsActual rows={budgetRows} />
        </section>

        {/* AI Analyse */}
        <div className="mb-6">
          <AIAnalyseCard />
        </div>

        {/* Budget editor */}
        <section className="rounded-2xl border border-ink-line bg-ink-surface shadow-card p-5 sm:p-6">
          <h2 className="font-display text-lg text-ink-text mb-4">Edit budgets — {formatMonthLabel(month, true)}</h2>
          <BudgetEditor
            month={month}
            categories={categories}
            initialBudgets={budgetInfo.budgets}
            isCarriedForward={budgetInfo.isCarriedForward}
          />
        </section>
      </div>
    </main>
  );
}
