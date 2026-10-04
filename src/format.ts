const dollars = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

/** $1,234 */
export function money(value: number): string {
  return dollars.format(Math.round(value));
}

/** $1.2M, $850K, $900 — for chart axes. */
export function shortMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trim(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function trim(value: number): string {
  return value.toFixed(value >= 10 || value <= -10 ? 0 : 1).replace(/\.0$/, "");
}

export function percent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
