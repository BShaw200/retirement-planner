import { DEFAULT_FULL_OAS, PREVIOUS_DEFAULT_FULL_OAS } from "./canada";

export interface Plan {
  // About you
  currentAge: number;
  retirementAge: number;
  planToAge: number;

  // Savings today
  rrsp: number;
  tfsa: number;
  nonRegistered: number;

  // Yearly savings until retirement (today's dollars)
  rrspContribution: number;
  tfsaContribution: number;
  nonRegisteredContribution: number;

  // Yearly after-tax spending in retirement (today's dollars)
  spending: number;

  // Government benefits
  cppAt65: number;
  cppStartAge: number;
  oasYearsInCanada: number;
  oasStartAge: number;
  fullOas: number;

  // Workplace pension
  pension: number;
  pensionStartAge: number;
  pensionIndexed: boolean;

  // Assumptions, all in percent
  expectedReturn: number;
  inflation: number;
  volatility: number;
  taxRate: number;
}

export const EXAMPLE_PLAN: Plan = {
  currentAge: 45,
  retirementAge: 63,
  planToAge: 95,

  rrsp: 180_000,
  tfsa: 65_000,
  nonRegistered: 20_000,

  rrspContribution: 12_000,
  tfsaContribution: 7_000,
  nonRegisteredContribution: 0,

  spending: 52_000,

  cppAt65: 12_000,
  cppStartAge: 65,
  oasYearsInCanada: 40,
  oasStartAge: 65,
  fullOas: DEFAULT_FULL_OAS,

  pension: 0,
  pensionStartAge: 63,
  pensionIndexed: false,

  expectedReturn: 6,
  inflation: 2.5,
  volatility: 11,
  taxRate: 20,
};

/**
 * Brings a saved plan up to date. A plan still using the old OAS default gets the
 * current one; a figure the person typed in themselves is left alone.
 */
export function upgradePlan(plan: Plan): Plan {
  return plan.fullOas === PREVIOUS_DEFAULT_FULL_OAS ? { ...plan, fullOas: DEFAULT_FULL_OAS } : plan;
}

/** Returns a list of problems that stop the plan from being projected. */
export function validatePlan(plan: Plan): string[] {
  const problems: string[] = [];
  if (plan.currentAge < 18 || plan.currentAge > 100) {
    problems.push("Your age needs to be between 18 and 100.");
  }
  if (plan.retirementAge < plan.currentAge) {
    problems.push("Your retirement age can't be earlier than your age today.");
  }
  if (plan.planToAge <= plan.retirementAge) {
    problems.push("The age to plan until needs to be later than your retirement age.");
  }
  if (plan.planToAge > 110) {
    problems.push("The age to plan until needs to be 110 or younger.");
  }
  if (plan.taxRate < 0 || plan.taxRate >= 100) {
    problems.push("The tax rate needs to be between 0% and 99%.");
  }
  return problems;
}
