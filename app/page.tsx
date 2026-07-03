import { getAllExpenses, getCategoryList, getBudgetsForMonth } from '@/lib/sheets';
import { currentMonthKey, aggregateByCategory, aggregateByMonth } from '@/lib/aggregate';
import CategoryPieChart from '@/components/CategoryPieChart';
import MonthlyTrendChart from '@/components/MonthlyTrendChart';
import BudgetVsActual from '@/components/BudgetVsActual';
import BudgetEditor from '@/components/BudgetEditor';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic'; // always fetch fresh sheet data, never statically cache

export default async function DashboardPage() {
  const month = currentMonthKey();

  const [expenses, categories, budgetInfo] = await Promise.all([
    getAllExpenses(),
    getCategoryList(),
    getBudgetsForMonth(month),
  ]);

  const categoryTotals = aggregateByCategory(expenses, month);
  const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({ category, amount }));
  const monthlyTrend = aggregateByMonth(expenses, 6);

  const allCategoriesForBudget = Array.from(new Set([...categories, ...Object.keys(categoryTotals)]));
  const budgetRows = allCategoriesForBudget
    .map((c) => ({ category: c, budget: budgetInfo.budgets[c] ?? 0, actual: categoryTotals[c] ?? 0 }))
    .filter((r) => r.budget > 0 || r.actual > 0)
    .sort((a, b) => b.actual - a.actual);

  const overallActual = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const overallBudget = budgetInfo.budgets['Overall'] ?? 0;

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Family Expense Tracker</h1>
        <LogoutButton />
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>
          This month: ₹{overallActual.toLocaleString('en-IN')}
          {overallBudget > 0 ? ` of ₹${overallBudget.toLocaleString('en-IN')} budget` : ''}
        </h2>
        {overallBudget > 0 && (
          <BudgetVsActual rows={[{ category: 'Overall', budget: overallBudget, actual: overallActual }]} />
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Spend by category — {month}</h2>
        <CategoryPieChart data={pieData} />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Monthly trend</h2>
        <MonthlyTrendChart data={monthlyTrend} />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Budget vs actual by category</h2>
        <BudgetVsActual rows={budgetRows} />
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem' }}>Edit budgets — {month}</h2>
        <BudgetEditor
          month={month}
          categories={categories}
          initialBudgets={budgetInfo.budgets}
          isCarriedForward={budgetInfo.isCarriedForward}
        />
      </section>
    </main>
  );
}
