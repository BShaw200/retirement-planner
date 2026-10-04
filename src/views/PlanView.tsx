import { useMemo } from "react";
import { cppAdjustmentFactor, oasAnnualAmount } from "../engine/canada";
import type { Plan } from "../engine/plan";
import { affordableSpending, lateBenefits, project } from "../engine/projection";
import { BalanceChart, IncomeChart } from "../components/charts";
import { StatusPill } from "../components/StatusPill";
import { YearTable } from "../components/YearTable";
import { listNames, money } from "../format";

export function PlanView({ plan }: { plan: Plan }) {
  const projection = useMemo(() => project(plan), [plan]);
  const affordable = useMemo(() => affordableSpending(plan), [plan]);

  const lasts = projection.runsOutAtAge === null;
  const guaranteed =
    plan.cppAt65 * cppAdjustmentFactor(plan.cppStartAge) +
    oasAnnualAmount(plan.oasStartAge, plan.oasYearsInCanada, plan.fullOas) +
    plan.pension;
  const lastStart = Math.max(plan.cppStartAge, plan.oasStartAge, plan.pension > 0 ? plan.pensionStartAge : 0);

  return (
    <div className="view">
      <section className="tiles" aria-label="Summary">
        <div className="tile">
          <span className="tile-label">Savings when you retire at {plan.retirementAge}</span>
          <span className="tile-value">{money(projection.balanceAtRetirement)}</span>
          <span className="tile-note">RRSP, TFSA and other investments together</span>
        </div>
        <div className="tile">
          <span className="tile-label">Your savings last</span>
          <span className="tile-value">
            {lasts ? `Past ${plan.planToAge}` : `Until ${projection.runsOutAtAge}`}
          </span>
          <StatusPill
            tone={lasts ? "good" : "critical"}
            label={lasts ? "Covers your plan" : `Runs out ${plan.planToAge - projection.runsOutAtAge! + 1} years early`}
          />
        </div>
        <div className="tile">
          <span className="tile-label">You could spend up to</span>
          {affordable.fromAge === null ? (
            <>
              <span className="tile-value">
                {money(affordable.early)}
                <small>/yr</small>
              </span>
              <span className="tile-note">
                {affordable.early >= plan.spending
                  ? `${money(affordable.early - plan.spending)} more than your goal of ${money(plan.spending)}`
                  : `${money(plan.spending - affordable.early)} less than your goal of ${money(plan.spending)}`}
              </span>
            </>
          ) : (
            <>
              <span className="tile-value">
                {money(affordable.early)}
                <small>/yr until {affordable.fromAge}</small>
              </span>
              <span className="tile-value tile-value-step">
                <small>then </small>
                {money(affordable.later)}
                <small>/yr</small>
              </span>
              <span className="tile-note">
                Ages {plan.retirementAge}–{affordable.fromAge - 1} are the tight years.{" "}
                {listNames(lateBenefits(plan).map((b) => b.name))} won't have started yet, so your savings have to
                cover those years on their own.
              </span>
            </>
          )}
        </div>
        <div className="tile">
          <span className="tile-label">CPP, OAS and pension from {lastStart}</span>
          <span className="tile-value">
            {money(guaranteed * (1 - plan.taxRate / 100))}
            <small>/yr</small>
          </span>
          <span className="tile-note">After tax. Paid for life.</span>
        </div>
      </section>

      <p className="assumption-note">
        All amounts are in today's dollars, so $1 on these charts buys what $1 buys now. This assumes
        steady growth of {plan.expectedReturn}% a year. Real markets go up and down; see{" "}
        <a href="#risk">Will my money last?</a>
      </p>

      <section className="panel">
        <header className="panel-head">
          <h2>Your savings over time</h2>
          <p>Savings grow while you work, then you draw them down in retirement.</p>
        </header>
        <BalanceChart rows={projection.rows} retirementAge={plan.retirementAge} />
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Where your spending money comes from</h2>
          <p>
            Each bar is one year of retirement, after tax. When the bars reach the line, your spending goal is
            covered. Savings are spent from other investments first, then your RRSP, and your TFSA last.
          </p>
        </header>
        <IncomeChart rows={projection.rows} spending={plan.spending} taxRate={plan.taxRate} />
      </section>

      <details className="panel table-panel">
        <summary>
          <h2>Year-by-year numbers</h2>
        </summary>
        <YearTable rows={projection.rows} />
      </details>
    </div>
  );
}
