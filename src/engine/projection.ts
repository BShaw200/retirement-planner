import {
  RRIF_FIRST_WITHDRAWAL_AGE,
  cppAdjustmentFactor,
  oasAgeBoost,
  oasAnnualAmount,
  rrifMinimumRate,
} from "./canada";
import type { Plan } from "./plan";

/**
 * One year of the projection. Every amount is in today's dollars,
 * so a number here buys the same as that number would today.
 */
export interface YearRow {
  age: number;
  retired: boolean;
  // Balances at the end of the year
  rrsp: number;
  tfsa: number;
  nonRegistered: number;
  total: number;
  // Money coming in during the year (before tax)
  cpp: number;
  oas: number;
  pension: number;
  rrspWithdrawal: number;
  nonRegisteredWithdrawal: number;
  tfsaWithdrawal: number;
  tax: number;
  /** Spending you wanted but couldn't cover because savings ran out. */
  shortfall: number;
}

export interface Projection {
  rows: YearRow[];
  /** Total savings on the day you retire. */
  balanceAtRetirement: number;
  /** First age where savings couldn't cover spending, or null if they last. */
  runsOutAtAge: number | null;
  finalBalance: number;
}

/** Converts a nominal return and inflation (in percent) into a real return (as a fraction). */
export function realReturn(nominalPercent: number, inflationPercent: number): number {
  return (1 + nominalPercent / 100) / (1 + inflationPercent / 100) - 1;
}

const CENT = 0.005;

/**
 * Projects the plan one year at a time.
 *
 * `returns` lets the caller supply a different real return for each year
 * (used by the "will my money last?" simulation). When left out, every year
 * earns the plan's expected return.
 */
export function project(plan: Plan, returns?: number[], spendingOverride?: number): Projection {
  const tax = plan.taxRate / 100;
  const inflation = plan.inflation / 100;
  const steadyReturn = realReturn(plan.expectedReturn, plan.inflation);
  const spending = spendingOverride ?? plan.spending;

  const cppYearly = plan.cppAt65 * cppAdjustmentFactor(plan.cppStartAge);
  const oasYearly = oasAnnualAmount(plan.oasStartAge, plan.oasYearsInCanada, plan.fullOas);

  let rrsp = plan.rrsp;
  let tfsa = plan.tfsa;
  let nonRegistered = plan.nonRegistered;
  let balanceAtRetirement = rrsp + tfsa + nonRegistered;
  let runsOutAtAge: number | null = null;

  const rows: YearRow[] = [];

  for (let age = plan.currentAge, i = 0; age <= plan.planToAge; age++, i++) {
    const growth = returns ? returns[i] : steadyReturn;
    const retired = age >= plan.retirementAge;
    if (age === plan.retirementAge) {
      balanceAtRetirement = rrsp + tfsa + nonRegistered;
    }

    // Guaranteed income. CPP and OAS rise with inflation, so they stay flat
    // in today's dollars. A pension without indexing slowly loses value.
    const cpp = age >= plan.cppStartAge ? cppYearly : 0;
    const oas = age >= plan.oasStartAge ? oasYearly * oasAgeBoost(age) : 0;
    const pension =
      age >= plan.pensionStartAge
        ? plan.pensionIndexed
          ? plan.pension
          : plan.pension / Math.pow(1 + inflation, age - plan.pensionStartAge)
        : 0;
    const guaranteed = cpp + oas + pension;

    // The government requires a minimum RRIF withdrawal each year from 72.
    const rrifMinimum =
      age >= RRIF_FIRST_WITHDRAWAL_AGE ? rrsp * rrifMinimumRate(age) : 0;
    let rrspWithdrawal = rrifMinimum;
    rrsp -= rrifMinimum;

    let nonRegisteredWithdrawal = 0;
    let tfsaWithdrawal = 0;
    let shortfall = 0;

    const afterTaxIncome = (guaranteed + rrifMinimum) * (1 - tax);

    if (retired) {
      let gap = spending - afterTaxIncome;

      // Spend from savings in a common tax-smart order:
      // non-registered first, then RRSP/RRIF, and the TFSA last.
      if (gap > 0) {
        nonRegisteredWithdrawal = Math.min(nonRegistered, gap);
        nonRegistered -= nonRegisteredWithdrawal;
        gap -= nonRegisteredWithdrawal;
      }
      if (gap > 0 && rrsp > 0) {
        // RRSP withdrawals are taxed, so take out enough to cover the tax too.
        const needed = gap / (1 - tax);
        const taken = Math.min(rrsp, needed);
        rrsp -= taken;
        rrspWithdrawal += taken;
        gap -= taken * (1 - tax);
      }
      if (gap > 0) {
        tfsaWithdrawal = Math.min(tfsa, gap);
        tfsa -= tfsaWithdrawal;
        gap -= tfsaWithdrawal;
      }
      if (gap > CENT) {
        shortfall = gap;
        if (runsOutAtAge === null) runsOutAtAge = age;
      } else if (gap < 0) {
        // Income beyond spending (for example a large RRIF minimum) is saved.
        nonRegistered += -gap;
      }
    } else {
      // Still working: any benefits that have started are saved after tax.
      nonRegistered += afterTaxIncome;
    }

    rrsp *= 1 + growth;
    tfsa *= 1 + growth;
    nonRegistered *= 1 + growth;

    if (!retired) {
      rrsp += plan.rrspContribution;
      tfsa += plan.tfsaContribution;
      nonRegistered += plan.nonRegisteredContribution;
    }

    rows.push({
      age,
      retired,
      rrsp,
      tfsa,
      nonRegistered,
      total: rrsp + tfsa + nonRegistered,
      cpp,
      oas,
      pension,
      rrspWithdrawal,
      nonRegisteredWithdrawal,
      tfsaWithdrawal,
      tax: (guaranteed + rrspWithdrawal) * tax,
      shortfall,
    });
  }

  return {
    rows,
    balanceAtRetirement,
    runsOutAtAge,
    finalBalance: rows.length ? rows[rows.length - 1].total : 0,
  };
}

/**
 * The most you could spend each year in retirement (after tax, today's dollars)
 * and still have savings last until the end of the plan, assuming steady returns.
 */
export function sustainableSpending(plan: Plan): number {
  let low = 0;
  let high = 1_000;
  while (project(plan, undefined, high).runsOutAtAge === null && high < 1e8) {
    high *= 2;
  }
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (project(plan, undefined, mid).runsOutAtAge === null) low = mid;
    else high = mid;
  }
  return low;
}
