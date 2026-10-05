// Canadian retirement rules used by the projection.
// Dollar amounts are approximate 2026 figures and are editable in the app.

/** Full Old Age Security for ages 65–74, per year ($762.50 a month, October–December 2026). */
export const DEFAULT_FULL_OAS = 9_150;

/** The default before the October 2026 update, kept so saved plans can be brought up to date. */
export const PREVIOUS_DEFAULT_FULL_OAS = 8_900;

/** CPP can start between these ages. */
export const CPP_MIN_AGE = 60;
export const CPP_MAX_AGE = 70;

/** OAS can start between these ages. */
export const OAS_MIN_AGE = 65;
export const OAS_MAX_AGE = 70;

/** An RRSP must become a RRIF by the end of the year you turn 71,
 *  so minimum withdrawals start the year you turn 72. */
export const RRIF_FIRST_WITHDRAWAL_AGE = 72;

/**
 * CPP is reduced 0.6% for each month taken before 65
 * and increased 0.7% for each month taken after 65.
 */
export function cppAdjustmentFactor(startAge: number): number {
  const age = clamp(startAge, CPP_MIN_AGE, CPP_MAX_AGE);
  const months = (age - 65) * 12;
  return months < 0 ? 1 + 0.006 * months : 1 + 0.007 * months;
}

/**
 * OAS increases 0.6% for each month deferred past 65.
 * Partial OAS is earned at 1/40 per year lived in Canada after age 18,
 * with at least 10 years needed to qualify.
 */
export function oasAnnualAmount(
  startAge: number,
  yearsInCanada: number,
  fullAmount: number,
): number {
  const years = Math.min(Math.max(yearsInCanada, 0), 40);
  if (years < 10) return 0;
  const age = clamp(startAge, OAS_MIN_AGE, OAS_MAX_AGE);
  const deferral = 1 + 0.006 * (age - 65) * 12;
  return fullAmount * (years / 40) * deferral;
}

/** OAS rises by 10% for people aged 75 and over. */
export function oasAgeBoost(age: number): number {
  return age >= 75 ? 1.1 : 1;
}

/** Minimum RRIF withdrawal as a fraction of the balance at the start of the year. */
export function rrifMinimumRate(age: number): number {
  if (age < 71) return 1 / (90 - age);
  if (age >= 95) return 0.2;
  return RRIF_TABLE[age];
}

const RRIF_TABLE: Record<number, number> = {
  71: 0.0528, 72: 0.054, 73: 0.0553, 74: 0.0567, 75: 0.0582,
  76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682,
  81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851,
  86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192,
  91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
