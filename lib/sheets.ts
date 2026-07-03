import { google, sheets_v4 } from 'googleapis';
import { config } from './config';

let cachedClient: sheets_v4.Sheets | null = null;

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (cachedClient) return cachedClient;
  const auth = new google.auth.JWT(
    config.googleServiceAccountEmail(),
    undefined,
    config.googlePrivateKey(),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  await auth.authorize();
  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

export interface ExpenseEntry {
  date: Date;
  amount: number;
  category: string;
  note: string;
  addedBy: string;
  rawMessage: string;
}

function formatMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatWeek(d: Date): string {
  // ISO-ish week number, good enough for dashboard grouping purposes.
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Appends a row to the Expenses tab and returns the 1-indexed row number it landed on,
 * so callers can later target that exact row for a correction (reply-to-fix category).
 */
export async function appendExpenseRow(entry: ExpenseEntry): Promise<number> {
  const sheets = await getSheetsClient();
  const values = [[
    entry.date.toISOString(),
    formatMonth(entry.date),
    formatWeek(entry.date),
    entry.amount,
    entry.category,
    'Expense',
    'No',
    entry.note,
    entry.addedBy,
    entry.rawMessage,
  ]];

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId(),
    range: 'Expenses!A:J',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });

  // updatedRange looks like "Expenses!A17:J17" — pull the row number out of it.
  const range = res.data.updates?.updatedRange ?? '';
  const match = range.match(/(\d+):[A-Z]+(\d+)$/) || range.match(/[A-Z]+(\d+)/);
  const rowNumber = match ? parseInt(match[match.length - 1], 10) : -1;
  return rowNumber;
}

export async function deleteLastExpenseRow(): Promise<{ amount: number; category: string } | null> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId() });
  const expensesSheet = meta.data.sheets?.find((s) => s.properties?.title === 'Expenses');
  const sheetId = expensesSheet?.properties?.sheetId;
  const lastRow = expensesSheet?.properties?.gridProperties?.rowCount ?? 0;

  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'Expenses!A:J',
  });
  const rows = dataRes.data.values ?? [];
  const lastRowIndex = rows.length; // 1-indexed, includes header
  if (lastRowIndex <= 1) return null; // only header, nothing to undo

  const lastRowValues = rows[lastRowIndex - 1];
  const amount = Number(lastRowValues[3]);
  const category = String(lastRowValues[4]);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: config.spreadsheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: lastRowIndex - 1, // 0-indexed
            endIndex: lastRowIndex,
          },
        },
      }],
    },
  });

  return { amount, category };
}

export async function updateExpenseCategory(rowNumber: number, category: string): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId(),
    range: `Expenses!E${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[category]] },
  });
}

/** alias (lowercase) -> Category name */
export async function getCategoryMap(): Promise<Record<string, string>> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'Categories!A:B',
  });
  const rows = res.data.values ?? [];
  const map: Record<string, string> = {};
  for (let i = 1; i < rows.length; i++) { // skip header
    const category = rows[i][0];
    const aliasesRaw = rows[i][1];
    if (!category || !aliasesRaw) continue;
    String(aliasesRaw).split(',').forEach((a) => {
      const clean = a.trim().toLowerCase();
      if (clean) map[clean] = category;
    });
  }
  return map;
}

export interface ExpenseRow {
  date: string;
  month: string;
  week: string;
  amount: number;
  category: string;
  type: string;
  recurring: string;
  note: string;
  addedBy: string;
  rawMessage: string;
}

export async function getAllExpenses(): Promise<ExpenseRow[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'Expenses!A:J',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1).map((r) => ({
    date: r[0] || '',
    month: r[1] || '',
    week: r[2] || '',
    amount: Number(r[3] || 0),
    category: r[4] || 'Uncategorized',
    type: r[5] || 'Expense',
    recurring: r[6] || 'No',
    note: r[7] || '',
    addedBy: r[8] || '',
    rawMessage: r[9] || '',
  }));
}

export async function getCategoryList(): Promise<string[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'Categories!A:A',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1).map((r) => r[0]).filter(Boolean);
}

export type BudgetMap = Record<string, number>;

/**
 * Returns this month's budgets. If none have been saved yet, falls back to the
 * most recent earlier month's values as a *preview* (isCarriedForward: true) —
 * nothing is written until the user explicitly saves via upsertBudgetsForMonth.
 */
export async function getBudgetsForMonth(month: string): Promise<{ budgets: BudgetMap; isCarriedForward: boolean }> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'Budgets!A:C',
  });
  const rows = (res.data.values ?? []).slice(1); // skip header

  const thisMonthRows = rows.filter((r) => r[0] === month);
  if (thisMonthRows.length > 0) {
    const budgets: BudgetMap = {};
    thisMonthRows.forEach((r) => { budgets[r[1]] = Number(r[2] || 0); });
    return { budgets, isCarriedForward: false };
  }

  const priorMonths = Array.from(new Set(rows.map((r) => r[0]))).filter((m) => m < month).sort();
  const latestPriorMonth = priorMonths[priorMonths.length - 1];
  if (!latestPriorMonth) return { budgets: {}, isCarriedForward: false };

  const priorRows = rows.filter((r) => r[0] === latestPriorMonth);
  const budgets: BudgetMap = {};
  priorRows.forEach((r) => { budgets[r[1]] = Number(r[2] || 0); });
  return { budgets, isCarriedForward: true };
}

/** Replaces this month's budget rows with the given entries. Other months are untouched. */
export async function upsertBudgetsForMonth(month: string, entries: BudgetMap): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'Budgets!A:C',
  });
  const rows = res.data.values ?? [];
  const header = rows[0] ?? ['Month', 'Category', 'Budget Amount'];
  const otherMonthRows = rows.slice(1).filter((r) => r[0] !== month);
  const newMonthRows = Object.entries(entries)
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => [month, category, String(amount)]);

  const allRows = [header, ...otherMonthRows, ...newMonthRows];

  await sheets.spreadsheets.values.clear({
    spreadsheetId: config.spreadsheetId(),
    range: 'Budgets!A1:C100000',
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId(),
    range: 'Budgets!A1',
    valueInputOption: 'RAW',
    requestBody: { values: allRows },
  });
}

const DEFAULT_CATEGORIES: [string, string][] = [
  ['Fuel', 'fuel, petrol, diesel, gas station'],
  ['Groceries', 'grocery, groceries, supermarket'],
  ['Dining', 'dining, restaurant, food, eating out, takeout'],
  ['Utilities', 'electricity, water bill, gas bill, utility, utilities, wifi, internet'],
  ['Transport', 'uber, ola, cab, taxi, bus, metro, transport'],
  ['Kids', 'kids, school, tuition, daycare'],
  ['Rent', 'rent'],
  ['Health', 'health, medicine, doctor, pharmacy, hospital'],
  ['Shopping', 'shopping, clothes, amazon, flipkart'],
  ['Misc', 'misc, other'],
];

/**
 * One-time setup: creates every tab this app needs, if it doesn't already exist.
 * Safe to call more than once — existing tabs are left untouched.
 */
export async function ensureSheetsExist(): Promise<string[]> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId() });
  const existing = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));
  const created: string[] = [];

  const toCreate = ['Expenses', 'Categories', 'Budgets', 'ProcessedUpdates', 'PendingConfirmations']
    .filter((name) => !existing.has(name));

  if (toCreate.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.spreadsheetId(),
      requestBody: {
        requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    created.push(...toCreate);
  }

  if (created.includes('Expenses')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId(),
      range: 'Expenses!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['Date', 'Month', 'Week', 'Amount', 'Category', 'Type', 'Recurring', 'Note', 'Added By', 'Raw Message']] },
    });
  }

  if (created.includes('Categories')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId(),
      range: 'Categories!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['Category', 'Aliases (comma separated)'], ...DEFAULT_CATEGORIES] },
    });
  }

  if (created.includes('Budgets')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId(),
      range: 'Budgets!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['Month', 'Category', 'Budget Amount']] },
    });
  }

  if (created.includes('ProcessedUpdates')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId(),
      range: 'ProcessedUpdates!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['UpdateId', 'Timestamp']] },
    });
  }

  if (created.includes('PendingConfirmations')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId(),
      range: 'PendingConfirmations!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [['ChatId', 'MessageId', 'Row', 'Timestamp']] },
    });
  }

  return created;
}
