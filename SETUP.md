# Patch — Fix Month Column Auto-Converting to a Date Serial

## What broke

Writing expense rows used `valueInputOption: 'USER_ENTERED'`, which tells Google Sheets
to parse each value like a human typed it in. Text like `"2026-07"` reads exactly like a
date to Sheets' auto-detection, so it silently converted it into a date serial number
(`46204`) instead of keeping it as plain text. `"2026-W27"` (the Week column) wasn't
recognized as a date, so it stayed correct — that's why only Month broke.

## What changed

`lib/sheets.ts` — both `appendExpenseRow` and `updateExpenseCategory` now use
`valueInputOption: 'RAW'` instead of `'USER_ENTERED'`. RAW stores exactly the string
given, no auto-parsing. (Budgets and the state-tracking tabs already used RAW, so
they were never affected.)

## Step 1 — Update your repo

Copy the updated `lib/sheets.ts` from this delivery into your existing repo folder,
overwriting the old one. Only this one file changed.

```
git add lib/sheets.ts
git commit -m "Fix: use RAW value input to stop Month column auto-converting to a date serial"
git push
```

Vercel redeploys automatically — no env var changes needed for this fix.

## Step 2 — Fix your existing bad rows manually

The two rows already logged (`Fuel 1000`, `Rent 20000`) have `46204` sitting in the
Month column instead of `2026-07`. New entries going forward will be correct
automatically, but these two need a manual fix since the bad data is already written:

1. Open the `Expenses` sheet.
2. Click cell **B2** (Month, row 2) → type `2026-07` → Enter.
3. Click cell **B3** → type `2026-07` → Enter.
4. If either cell auto-reformats itself back into a number/date after typing, first
   select both cells → **Format → Number → Plain text** → then retype the value.

## Step 3 — Verify

1. Refresh the dashboard — "Spend by category" should now show your ₹1000 Fuel and
   ₹20000 Rent entries instead of "No expenses logged yet this month."
2. Send one more test message via Telegram (e.g. `Groceries 50`) → check the new row's
   Month column shows `2026-07` as plain text, not a number.
