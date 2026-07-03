# Update — Daily & Weekly Telegram Recap

## What this adds

Two scheduled messages posted automatically to your Telegram group — no button, no
dashboard visit needed:

- **Daily recap**, every evening — today's total vs yesterday's, percent change, and
  the biggest category of the day.
- **Weekly recap**, every Sunday evening — this week's total (rolling last 7 days) vs
  the week before, percent change, and top 3 categories.

Both fire once daily/weekly via **Vercel Cron** (built into your existing Vercel
project, no new service to sign up for). Scheduled for the **9–10 PM IST window**.

## A timing note, so the behavior isn't a surprise

Vercel's free (Hobby) plan only guarantees a cron fires **somewhere within its
scheduled hour**, not at an exact minute — so "9:30 PM" might actually land anywhere
between 9:00 and 9:59 PM. That's expected, not a bug. If you're on Vercel Pro later,
timing becomes exact-to-the-minute, but Hobby is fine for a recap message where a
30-minute window doesn't matter.

## Step 1 — Update your repo

Copy every file from this delivery into your repo folder, overwriting where names
match. New files: `vercel.json`, `lib/timezone.ts`, `lib/recap.ts`,
`app/api/cron/daily-recap/route.ts`, `app/api/cron/weekly-recap/route.ts`. Changed:
`lib/aggregate.ts`, `lib/telegram.ts`, `lib/config.ts`, `middleware.ts`.

```
git add .
git commit -m "Add daily and weekly Telegram recap via Vercel Cron"
git push
```

## Step 2 — Add the one new environment variable

Vercel → your project → **Settings → Environment Variables**:

| Name | Value |
|---|---|
| `CRON_SECRET` | any long random string (a password generator works fine) |

You never call the cron routes yourself — Vercel reads `CRON_SECRET` automatically and
sends it as an `Authorization: Bearer ...` header when it invokes them, and the routes
check that header matches before doing anything. This stops randoms on the internet
from spamming your Telegram group by hitting the URL directly.

After adding it, redeploy (Vercel → Deployments → latest → **Redeploy**) since env var
changes don't apply retroactively.

## Step 3 — Confirm the crons registered

Vercel → your project → **Cron Jobs** tab (in the left sidebar or under Settings). You
should see both:
- `/api/cron/daily-recap` — `30 15 * * *`
- `/api/cron/weekly-recap` — `30 15 * * 0`

If this tab is empty after deploying, the most common cause is `vercel.json` not
landing at the actual **project root** (same level as `package.json`) — double check
its location in your repo.

## Step 4 — Test without waiting for the actual schedule

Cron jobs are just regular HTTP endpoints Vercel happens to call on a timer — you can
trigger them manually right now to confirm they work, using the `CRON_SECRET` you set:

```
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/daily-recap
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/weekly-recap
```

No `curl` handy? Any HTTP client that lets you set a custom header works (Postman,
Insomnia, or even a quick browser extension) — a plain browser visit won't work since
it can't send the Authorization header.

Each should return `{"ok":true}` and a message should appear in your Telegram group
within a few seconds.

## Step 5 — Let it run for real

Once manually verified, just leave it — it'll fire on its own every evening and every
Sunday evening going forward, no further action needed.
