# Setup Guide — Deploy to Vercel (free, always-on, no machine required)

This replaces the earlier "self-host on your own machine" plan entirely. Vercel's free
tier runs this app in the cloud permanently — nothing needs to stay powered on at your
end, and you don't need a custom domain to get started (you'll get a free
`something.vercel.app` URL that works immediately; a custom domain like
`expenses.sarathg.me` can be added later, purely optional).

**Current state of this project:** only the Telegram ingestion backend exists so far
(the part that replaces GAS). There is no dashboard UI yet — that's the next build step,
after we confirm logging is rock solid. The `/` page you'll see after deploying is
intentionally just a placeholder saying so.

---

## Step 1 — Create free accounts (if you don't have them)

- **GitHub** (github.com) — free, used to store the code so Vercel can deploy it.
- **Vercel** (vercel.com) — free, sign up using "Continue with GitHub" so they're linked automatically.

## Step 2 — Get the code into GitHub

1. Go to github.com → **New repository** → name it e.g. `family-expense-tracker` →
   keep it **Private** → **Create repository**.
2. On your computer, open a terminal in the `expense-webapp` folder (the one with
   `package.json` in it) and run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/family-expense-tracker.git
   git push -u origin main
   ```
   (GitHub will show you this exact command block with your actual repo URL filled in
   when you create the repo — you can copy it from there instead of retyping.)

   Don't have `git` installed or a terminal you're comfortable with? Alternative: on
   the new repo's GitHub page, click **uploading an existing file** and drag the whole
   `expense-webapp` folder contents in through the browser instead. Slower for future
   updates, but works for a one-time upload.

## Step 3 — Import into Vercel

1. On vercel.com, click **Add New → Project**.
2. Select the `family-expense-tracker` repo from the list → **Import**.
3. Framework preset should auto-detect as **Next.js** — leave defaults.
4. **Before clicking Deploy**, expand **Environment Variables** and add every one of
   these (values from your Google service account + Telegram setup):

   | Name | Value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | your rotated bot token |
   | `ALLOWED_CHAT_ID` | `-1003472022685` |
   | `ALLOWED_USER_IDS` | `8823308480,1029220387` |
   | `USER_NAMES` | `{"8823308480":"Sarath","1029220387":"Nichu"}` |
   | `SPREADSHEET_ID` | `1WT1zPftf1BebF0wstDcUYpfiP3nFi622my4yNQshYRg` |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | from your service account JSON (`client_email`) |
   | `GOOGLE_PRIVATE_KEY` | from your service account JSON (`private_key`), keep the `\n` as literal text |
   | `SETUP_SECRET` | make up any random string, e.g. `sg-setup-9f3k2` |

5. Click **Deploy**. Takes about a minute.
6. You'll land on a project page showing a URL like
   `https://family-expense-tracker-xyz123.vercel.app` — **this is your app's live
   address**. Click it to confirm you see the placeholder page (title "Family Expense
   Tracker" and a note that the dashboard doesn't exist yet).

That URL is now permanent (until you change domain settings) and always live — no
machine of yours needs to be running.

## Step 4 — Create the Google service account (if not done yet)

1. [Google Cloud Console](https://console.cloud.google.com/) → new/existing project →
   **APIs & Services → Library** → enable **Google Sheets API**.
2. **APIs & Services → Credentials → Create Credentials → Service Account** → name it
   anything → skip role grants → done.
3. Open it → **Keys → Add Key → Create new key → JSON** → downloads a file. Open it,
   copy `client_email` and `private_key` — these are the two Vercel env vars above.

## Step 5 — Share the Sheet with the service account

Open your **Family Expense Tracker App** sheet → **Share** → paste the `client_email`
address → set to **Editor** → Send/Share. Without this, every write silently fails
with a permissions error.

## Step 6 — Create the sheet tabs (one-time)

Visit this in your browser, filling in your actual Vercel URL and the `SETUP_SECRET`
you chose:

```
https://family-expense-tracker-xyz123.vercel.app/api/setup?secret=sg-setup-9f3k2
```

You should get back JSON like:
```json
{"ok":true,"created":["Expenses","Categories","Budgets","ProcessedUpdates","PendingConfirmations"]}
```

Open the actual Google Sheet and confirm those 5 tabs now exist. Edit the `Categories`
tab's aliases to match how you two actually phrase expenses, if you want.

## Step 7 — Point Telegram at the new webhook

Detach from GAS and attach to Vercel in one call:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://family-expense-tracker-xyz123.vercel.app/api/telegram-webhook&drop_pending_updates=true
```

Verify:
```
https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```
Expect: your Vercel URL listed, `pending_update_count: 0`, no `last_error_message`.

## Step 8 — Test

Send a real burst — this is the exact scenario that broke GAS, so it's the right proof:

1. `Fuel 100`
2. `Groceries 200`
3. `500 xyz123` (should say Uncategorized) → reply to it with `Groceries` → should update
4. `/undo`
5. Five or six more messages spaced a minute or two apart

Check the `Expenses` tab after each — rows should land immediately, no duplicates, no
silence.

## Updating the code later

Any time we change the code, the update path is: push to GitHub (`git add .`,
`git commit`, `git push`) → Vercel auto-deploys the new version within about a minute,
same URL, zero manual redeploy steps.

## What's next

Once you've confirmed logging holds up over real use (a day or two, both of you
sending real expenses), we build the actual dashboard — charts, budget tracking, and
the "AI Analyse" button — as pages inside this same project, deployed the same way.
