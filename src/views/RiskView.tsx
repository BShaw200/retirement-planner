import { useMemo } from "react";
import type { Plan } from "../engine/plan";
import { simulate } from "../engine/simulation";
import { RiskChart } from "../components/charts";
import { StatusPill, type Tone } from "../components/StatusPill";
import { money, percent } from "../format";

export function successTone(rate: number): { tone: Tone; label: string } {
  if (rate >= 0.85) return { tone: "good", label: "On track" };
  if (rate >= 0.7) return { tone: "warning", label: "Borderline" };
  return { tone: "critical", label: "At risk" };
}

export function RiskView({ plan }: { plan: Plan }) {
  const result = useMemo(() => simulate(plan), [plan]);
  const { tone, label } = successTone(result.successRate);
  const atRetirement = result.bands.find((b) => b.age === plan.retirementAge);

  return (
    <div className="view">
      <section className="panel risk-hero">
        <div className="risk-number">
          <span className="tile-label">Chance your money lasts to age {plan.planToAge}</span>
          <span className="hero-value">{percent(result.successRate)}</span>
          <StatusPill tone={tone} label={label} />
        </div>
        <div className="risk-explain">
          <p>
            We ran your plan {result.runs.toLocaleString("en-CA")} times. Each run had a different, random mix of
            good and bad years in the markets, averaging {plan.expectedReturn}% growth with swings of about{" "}
            {plan.volatility}% either way.
          </p>
          <p>
            In <strong>{Math.round(result.successRate * result.runs).toLocaleString("en-CA")}</strong> of those runs,
            your savings lasted until age {plan.planToAge}.
            {result.poorMarketRunsOutAt !== null
              ? ` In a poor market (the worst 1 in 10 runs), they ran out at age ${result.poorMarketRunsOutAt}.`
              : " Even in a poor market (the worst 1 in 10 runs), they lasted."}
          </p>
          <p className="muted">
            Many planners aim for 85% or higher. Below that, try retiring a little later, spending a little less, or
            delaying CPP.
          </p>
        </div>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>The range of outcomes</h2>
          <p>
            The line is a typical result. The shaded band runs from a poor market to a strong one: 8 in 10 runs fell
            inside it.
            {atRetirement &&
              ` When you retire, you might have anywhere from ${money(atRetirement.low)} to ${money(atRetirement.high)}.`}
          </p>
        </header>
        <RiskChart bands={result.bands} retirementAge={plan.retirementAge} />
      </section>
    </div>
  );
}
