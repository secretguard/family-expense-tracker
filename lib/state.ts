import { google, sheets_v4 } from 'googleapis';
import { config } from './config';

/**
 * Dedupe and reply-to-correct tracking are stored in the Sheet itself (in the
 * ProcessedUpdates and PendingConfirmations tabs), NOT in memory. This is
 * deliberate: it means the app can run on stateless serverless hosting
 * (Vercel free tier) with zero always-on machine required. Volume for a
 * 2-person household is tiny, so the extra Sheets API calls are negligible.
 */

let cachedClient: sheets_v4.Sheets | null = null;
async function getClient(): Promise<sheets_v4.Sheets> {
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

const DEDUPE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CONFIRMATION_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function isDuplicateUpdate(updateId: number): Promise<boolean> {
  const sheets = await getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'ProcessedUpdates!A:B',
  });
  const rows = res.data.values ?? [];
  const now = Date.now();

  const isDup = rows.some((r) => String(r[0]) === String(updateId));

  // Prune anything older than TTL and append the current one, in one pass.
  const kept = rows.filter((r) => now - Number(r[1] || 0) < DEDUPE_TTL_MS);
  if (!isDup) kept.push([String(updateId), String(now)]);

  await sheets.spreadsheets.values.clear({
    spreadsheetId: config.spreadsheetId(),
    range: 'ProcessedUpdates!A2:B100000',
  });
  if (kept.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId(),
      range: 'ProcessedUpdates!A2',
      valueInputOption: 'RAW',
      requestBody: { values: kept },
    });
  }

  return isDup;
}

export async function rememberConfirmation(chatId: number | string, messageId: number, row: number): Promise<void> {
  const sheets = await getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId(),
    range: 'PendingConfirmations!A:D',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[String(chatId), String(messageId), String(row), String(Date.now())]] },
  });
}

export async function getRowForConfirmation(chatId: number | string, messageId: number): Promise<number | null> {
  const sheets = await getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId(),
    range: 'PendingConfirmations!A:D',
  });
  const rows = res.data.values ?? [];
  const now = Date.now();

  // Prune expired entries opportunistically.
  const kept = rows.filter((r) => now - Number(r[3] || 0) < CONFIRMATION_TTL_MS);
  if (kept.length !== rows.length) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: config.spreadsheetId(),
      range: 'PendingConfirmations!A2:D100000',
    });
    if (kept.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId(),
        range: 'PendingConfirmations!A2',
        valueInputOption: 'RAW',
        requestBody: { values: kept },
      });
    }
  }

  const match = kept.find((r) => String(r[0]) === String(chatId) && String(r[1]) === String(messageId));
  return match ? Number(match[2]) : null;
}
