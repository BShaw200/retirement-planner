import type { Plan } from "./plan";
import { project, realReturn } from "./projection";

export interface SimulationBand {
  age: number;
  /** Total savings in a poor market (only 1 in 10 runs did worse). */
  low: number;
  /** Total savings in a typical market. */
  median: number;
  /** Total savings in a strong market (only 1 in 10 runs did better). */
  high: number;
}

export interface SimulationResult {
  runs: number;
  /** Share of runs (0 to 1) where savings lasted to the end of the plan. */
  successRate: number;
  bands: SimulationBand[];
  /** Age savings ran out in a poor market (the 10th percentile), or null if they lasted. */
  poorMarketRunsOutAt: number | null;
}

/**
 * Runs the plan many times, each with a different random sequence of yearly
 * market returns, and reports how often the money lasts.
 * The same seed always gives the same result, so the answer doesn't jump around.
 */
export function simulate(plan: Plan, runs = 1000, seed = 2026): SimulationResult {
  const random = mulberry32(seed);
  const years = plan.planToAge - plan.currentAge + 1;
  const mean = realReturn(plan.expectedReturn, plan.inflation);
  const spread = plan.volatility / 100;

  const totalsByYear: number[][] = Array.from({ length: years }, () => []);
  const runOutAges: number[] = [];
  let successes = 0;

  for (let run = 0; run < runs; run++) {
    const returns = Array.from({ length: years }, () =>
      // A year can't lose more than everything.
      Math.max(-0.95, mean + spread * normal(random)),
    );
    const result = project(plan, returns);
    if (result.runsOutAtAge === null) successes++;
    runOutAges.push(result.runsOutAtAge ?? Infinity);
    result.rows.forEach((row, i) => totalsByYear[i].push(row.total));
  }

  const bands = totalsByYear.map((totals, i) => {
    totals.sort((a, b) => a - b);
    return {
      age: plan.currentAge + i,
      low: percentile(totals, 0.1),
      median: percentile(totals, 0.5),
      high: percentile(totals, 0.9),
    };
  });

  runOutAges.sort((a, b) => a - b);
  const poor = percentile(runOutAges, 0.1);

  return {
    runs,
    successRate: successes / runs,
    bands,
    poorMarketRunsOutAt: Number.isFinite(poor) ? poor : null,
  };
}

/** Reads a value from an already-sorted list. */
function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[index];
}

/** A small, fast random number generator that can be seeded. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A bell-curve random number with mean 0 and spread 1. */
function normal(random: () => number): number {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
