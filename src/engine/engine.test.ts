import { describe, expect, it } from "vitest";
import { cppAdjustmentFactor, oasAnnualAmount, rrifMinimumRate } from "./canada";
import { EXAMPLE_PLAN, type Plan, validatePlan } from "./plan";
import { project, realReturn, sustainableSpending } from "./projection";
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

describe("validation", () => {
  it("flags a retirement age before today", () => {
    expect(validatePlan(plan({ currentAge: 50, retirementAge: 40 }))).toHaveLength(1);
    expect(validatePlan(EXAMPLE_PLAN)).toHaveLength(0);
  });
});
