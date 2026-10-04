# True North Retirement

A retirement planner for Canadians that runs entirely in your web browser. Your numbers are
saved in your own browser and never sent anywhere.

## What it does

- **My plan**: projects your RRSP, TFSA and other savings year by year, shows how much
  you'll have when you retire, how long it lasts, and the most you could spend each year.
  A second chart shows where each year's spending money comes from (CPP, OAS, pension, savings).
- **Will my money last?**: runs your plan 1,000 times with random good and bad market years
  and reports the chance your savings last, plus the range of possible outcomes.
- **Compare scenarios**: save versions of your plan (retire at 60 vs 65, CPP at 65 vs 70)
  and compare up to three side by side.
- **How it works**: plain-language explanation of the rules and what the planner leaves out.

### Canadian rules built in

- CPP from 60 to 70: −0.6% per month before 65, +0.7% per month after.
- OAS from 65 to 70: +0.6% per month deferred, 1/40th per year lived in Canada after 18
  (10-year minimum), +10% from age 75.
- RRSP converts to a RRIF; government minimum withdrawals from age 72.
- Withdrawal order: other investments, then RRSP/RRIF, then TFSA.

All amounts are in today's dollars (adjusted for inflation). Tax is a single average rate.

## Running it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # opens a local version at http://localhost:5173
```

Other commands:

```bash
npm test             # check the calculations
npm run build        # build the website into dist/
npm run build:single # build the whole app as one HTML file in dist-single/
```

## How the code is organised

- `src/engine/` – the calculations, with no screen code. `canada.ts` holds the CPP, OAS and
  RRIF rules; `projection.ts` steps through each year; `simulation.ts` runs the random-market test.
- `src/components/` – the form, charts, and other building blocks.
- `src/views/` – the four tabs.

Built with React, TypeScript, Vite and Recharts.

This is a planning tool, not financial advice.
