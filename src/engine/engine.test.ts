import { describe, expect, it } from "vitest";
import { cppAdjustmentFactor, oasAnnualAmount, rrifMinimumRate } from "./canada";
import { EXAMPLE_PLAN, type Plan, upgradePlan, validatePlan } from "./plan";
import { affordableSpending, benefitsStartAge, project, realReturn, sustainableSpending } from "./projection";
import { simulate } from "./simulation";

const plan = (overrides: Partial<Plan> = {}): Plan => ({ ...EXAMPLE_PLAN, ...overrides });

describe("Canadian rules", () => {
  it("adjusts CPP for early and late starts", () => {
    expect(cppAdjustmentFactor(65)).toBe(1);
    expect(cppAdjustmentFactor(60)).toBeCloseTo(0.64);
    expect(cppAdjustmentFactor(70)).toBeCloseTo(1.42);
  });

  it("scales OAS by years in Canada and deferral", () => {
    expect(oasAnnualAmount(65, 40, 9000)).toBe(9000);
    expect(oasAnnualAmount(65, 20, 9000)).toBe(4500);
    expect(oasAnnualAmount(65, 9, 9000)).toBe(0);
    expect(oasAnnualAmount(70, 40, 9000)).toBeCloseTo(9000 * 1.36);
  });

  it("uses the RRIF minimum table", () => {
    expect(rrifMinimumRate(65)).toBeCloseTo(0.04);
    expect(rrifMinimumRate(72)).toBe(0.054);
    expect(rrifMinimumRate(99)).toBe(0.2);
  });
});

describe("projection", () => {
  it("converts nominal returns to real returns", () => {
    expect(realReturn(5, 0)).toBeCloseTo(0.05);
    expect(realReturn(2, 2)).toBeCloseTo(0);
  });

  it("grows savings with contributions before retirement", () => {
    const result = project(
      plan({ expectedReturn: 0, inflation: 0, rrsp: 0, tfsa: 0, nonRegistered: 0,
        rrspContribution: 1000, tfsaContribution: 0, nonRegisteredContribution: 0,
        currentAge: 60, retirementAge: 63 }),
    );
    expect(result.balanceAtRetirement).toBe(3000);
  });

  it("reports when savings run out", () => {
    const result = project(
      plan({ expectedReturn: 0, inflation: 0, taxRate: 0, currentAge: 65, retirementAge: 65,
        planToAge: 90, rrsp: 0, tfsa: 0, nonRegistered: 100_000, spending: 50_000,
        cppAt65: 0, oasYearsInCanada: 0 }),
    );
    expect(result.runsOutAtAge).toBe(67);
  });

  it("covers spending exactly with guaranteed income and no savings", () => {
    const result = project(
      plan({ currentAge: 65, retirementAge: 65, rrsp: 0, tfsa: 0, nonRegistered: 0,
        cppAt65: 10_000, oasYearsInCanada: 40, fullOas: 10_000, taxRate: 0,
        spending: 20_000 }),
    );
    expect(result.runsOutAtAge).toBeNull();
  });

  it("forces RRIF withdrawals from age 72 even when not needed", () => {
    const result = project(
      plan({ currentAge: 72, retirementAge: 65, rrsp: 100_000, spending: 0 }),
    );
    expect(result.rows[0].rrspWithdrawal).toBeCloseTo(5_400);
  });

  it("finds the spending level that lasts exactly to the end", () => {
    const p = plan();
    const best = sustainableSpending(p);
    expect(project(p, undefined, best).runsOutAtAge).toBeNull();
    expect(project(p, undefined, best + 100).runsOutAtAge).not.toBeNull();
  });
});

describe("affordable spending with a gap before benefits start", () => {
  // Retire at 65 with modest savings, but CPP and OAS don't start until 70.
  const gapPlan = plan({
    currentAge: 65, retirementAge: 65, planToAge: 95,
    rrsp: 37_000, tfsa: 0, nonRegistered: 0,
    cppAt65: 12_000, cppStartAge: 70, oasStartAge: 70, oasYearsInCanada: 40, pension: 0,
  });

  it("finds the age when the last benefit starts", () => {
    expect(benefitsStartAge(gapPlan)).toBe(70);
    expect(benefitsStartAge(plan({ currentAge: 60, retirementAge: 66, cppStartAge: 65, oasStartAge: 65 }))).toBeNull();
  });

  it("lets spending step up once benefits start", () => {
    const result = affordableSpending(gapPlan);
    expect(result.fromAge).toBe(70);
    expect(result.early).toBeCloseTo(sustainableSpending(gapPlan), 0);
    expect(result.later).toBeGreaterThan(result.early * 2);
    const stepped = project(gapPlan, undefined, (age) => (age < 70 ? result.early : result.later));
    expect(stepped.runsOutAtAge).toBeNull();
    const tooMuch = project(gapPlan, undefined, (age) => (age < 70 ? result.early : result.later + 200));
    expect(tooMuch.runsOutAtAge).not.toBeNull();
  });

  it("keeps one amount when savings easily bridge the gap", () => {
    const result = affordableSpending({ ...gapPlan, rrsp: 1_500_000 });
    expect(result.fromAge).toBeNull();
    expect(result.later).toBe(result.early);
  });

  it("keeps one amount when benefits start by retirement", () => {
    const result = affordableSpending({ ...gapPlan, cppStartAge: 65, oasStartAge: 65 });
    expect(result.fromAge).toBeNull();
  });
});

describe("simulation", () => {
  it("gives the same answer for the same seed", () => {
    expect(simulate(plan(), 200).successRate).toBe(simulate(plan(), 200).successRate);
  });

  it("succeeds every time when there is no market risk", () => {
    const p = plan({ volatility: 0, spending: 30_000 });
    expect(simulate(p, 50).successRate).toBe(1);
  });

  it("orders the bands from poor to strong markets", () => {
    const { bands } = simulate(plan(), 300);
    for (const band of bands) {
      expect(band.low).toBeLessThanOrEqual(band.median);
      expect(band.median).toBeLessThanOrEqual(band.high);
    }
  });
});

describe("saved plans", () => {
  it("moves a plan on the old OAS default to the current one", () => {
    expect(upgradePlan(plan({ fullOas: 8_900 })).fullOas).toBe(9_150);
  });

  it("keeps an OAS figure the person typed in", () => {
    expect(upgradePlan(plan({ fullOas: 9_000 })).fullOas).toBe(9_000);
  });
});

describe("validation", () => {
  it("flags a retirement age before today", () => {
    expect(validatePlan(plan({ currentAge: 50, retirementAge: 40 }))).toHaveLength(1);
    expect(validatePlan(EXAMPLE_PLAN)).toHaveLength(0);
  });
});
