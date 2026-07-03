# Update — Redesigned Dashboard + AI Analyse

## What changed

**Design.** Full visual redesign — an "ink ledger" identity built for this specifically
(not a generic template): deep charcoal-navy background, a warm brass/gold accent, a
literary serif (Newsreader) for headings, clean sans (Manrope) for body text, and a
monospace face (IBM Plex Mono) for every number — amounts line up like a real ledger
instead of jittering as digits change. Category colors, chart tooltips, progress bars,
and the login screen all follow the same system now.

**Months now show as names.** "2026-07" style labels are gone from the UI — the trend
chart, section headings, and budget editor all show "Jul 2026" or "Jul" instead. (The
underlying data in the Sheet is unchanged — this is purely a display fix in `lib/aggregate.ts`.)

**New: AI Analyse.** A real button on the dashboard, sitting between "Budget vs actual"
and "Edit budgets." Click it → the app gathers this month's category spend, your budgets,
and the last 6 months' totals → sends that to OpenRouter → renders a written analysis
(most expensive category, notable trends, specific money-saving tips) right on the page.
This only runs when you click it — never automatically, never per logged expense.

## Files touched

New: `tailwind.config.js`, `postcss.config.js`, `app/globals.css`, `lib/openrouter.ts`,
`app/api/analyse/route.ts`, `components/AIAnalyseCard.tsx`.

Rewritten: `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`,
`components/CategoryPieChart.tsx`, `components/MonthlyTrendChart.tsx`,
`components/BudgetVsActual.tsx`, `components/BudgetEditor.tsx`, `components/LogoutButton.tsx`.

Extended: `lib/aggregate.ts` (added `formatMonthLabel`), `lib/config.ts` (added OpenRouter
config), `package.json` (added `tailwindcss`, `postcss`, `autoprefixer`).

Nothing about the Telegram ingestion path (`app/api/telegram-webhook`, `lib/parser.ts`,
`lib/state.ts`) changed — that stays exactly as it was.

## Step 1 — Get an OpenRouter API key

1. Go to [openrouter.ai](https://openrouter.ai) → sign up → **Keys** → **Create Key**.
2. Add a small amount of credit (a few dollars covers a very long time at this usage
   pattern — a handful of analyses a week, not per message).
3. Copy the key.

## Step 2 — Update your repo

Copy every file from this delivery into your existing repo folder, overwriting where
names match. Then:

```
git add .
git commit -m "Redesign dashboard, alphabetic month labels, add AI Analyse"
git push
```

Vercel picks this up automatically.

## Step 3 — Add the new environment variable in Vercel

Your existing env vars stay as they are. Add one new one:

Vercel → your project → **Settings → Environment Variables**:

| Name | Value |
|---|---|
| `OPENROUTER_API_KEY` | the key from Step 1 |
| `OPENROUTER_MODEL` | optional — leave unset to use the default (`anthropic/claude-3.5-haiku`), or set any [OpenRouter model slug](https://openrouter.ai/models) you prefer |

After adding it, trigger a redeploy (Vercel → Deployments → latest → **Redeploy**) since
env var changes don't apply retroactively to an already-running build.

## Step 4 — Verify

1. Visit your dashboard URL, log in.
2. Confirm the new look loads — dark background, serif headings, monospace numbers,
   brass accent color, smooth donut/bar charts.
3. Confirm the trend chart and section headers show month names ("Jul 2026") instead
   of "2026-07".
4. Scroll to **AI analysis** → click **AI Analyse** → after a few seconds you should see
   a written breakdown with bullet-pointed tips appear below the button.
5. Confirm Telegram logging and budget editing still work exactly as before — this
   update didn't touch that logic.

## A note on cost

Each click of "AI Analyse" is one OpenRouter API call — at typical household-tracker
usage (a few times a week, not per expense), cost stays in the range of cents per month
regardless of which model you pick. If you want it even cheaper, smaller/faster models
on OpenRouter's list work fine for this use case since the prompt is short, structured
numeric data rather than long documents.
