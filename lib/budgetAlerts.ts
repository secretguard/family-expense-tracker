import { BudgetMap } from './sheets';

export interface BudgetAlert {
  category: string;
  threshold: 80 | 100;
  spent: number;
  budget: number;
  pct: number;
}

/**
 * Compares month-to-date spend against each budgeted category and returns only the
 * (category, threshold) crossings that haven't been alerted on yet this month, per
 * `alreadySent` (built from the BudgetAlerts sheet — see lib/sheets.ts). 80% and 100%
 * are checked independently so both fire in the same run if spend jumps straight past
 * both in one entry.
 */
export function computeBudgetAlerts(
  categoryTotals: Record<string, number>,
  budgets: BudgetMap,
  alreadySent: Set<string>
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  for (const [category, budget] of Object.entries(budgets)) {
    if (budget <= 0) continue;
    const spent = categoryTotals[category] || 0;
    const pct = spent / budget;

    if (pct >= 0.8 && !alreadySent.has(`${category}|80`)) {
      alerts.push({ category, threshold: 80, spent, budget, pct });
    }
    if (pct >= 1 && !alreadySent.has(`${category}|100`)) {
      alerts.push({ category, threshold: 100, spent, budget, pct });
    }
  }

  return alerts;
}

export function formatBudgetAlertMessage(alert: BudgetAlert): string {
  const budgetStr = `₹${alert.budget.toLocaleString('en-IN')}`;
  const spentStr = `₹${alert.spent.toLocaleString('en-IN')}`;

  if (alert.threshold === 100) {
    return `🔴 <b>${alert.category}</b> has exceeded this month's budget — ${spentStr} of ${budgetStr}`;
  }

  const pct = Math.round(alert.pct * 100);
  return `⚠️ <b>${alert.category}</b> at ${pct}% of this month's ${budgetStr} budget`;
}
