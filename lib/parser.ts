export interface ParsedExpense {
  amount: number | null;
  category: string;
  note: string;
}

export function parseExpenseMessage(text: string, categoryMap: Record<string, string>): ParsedExpense {
  const numberMatch = text.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!numberMatch) {
    return { amount: null, category: 'Uncategorized', note: text };
  }

  const amount = parseFloat(numberMatch[1].replace(/,/g, ''));
  const idx = numberMatch.index ?? 0;
  const remainder = (text.slice(0, idx) + ' ' + text.slice(idx + numberMatch[1].length))
    .trim()
    .replace(/\s+/g, ' ');

  const category = findCategory(remainder, categoryMap);
  return { amount, category, note: remainder };
}

export function findCategory(remainderText: string, categoryMap: Record<string, string>): string {
  const lower = remainderText.toLowerCase();
  if (!lower) return 'Uncategorized';

  let best: string | null = null;
  for (const alias in categoryMap) {
    if (lower.indexOf(alias) !== -1) {
      if (!best || alias.length > best.length) best = alias;
    }
  }
  return best ? categoryMap[best] : 'Uncategorized';
}
