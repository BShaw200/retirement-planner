import { cppAdjustmentFactor, oasAnnualAmount } from "../engine/canada";
import type { Plan } from "../engine/plan";
import { money } from "../format";
import { NumberField, SliderField, ToggleField } from "./Fields";

interface PlanFormProps {
  plan: Plan;
  onChange: (plan: Plan) => void;
}

export function PlanForm({ plan, onChange }: PlanFormProps) {
  const set = <K extends keyof Plan>(key: K) => (value: Plan[K]) => onChange({ ...plan, [key]: value });

  const cppChange = Math.round((cppAdjustmentFactor(plan.cppStartAge) - 1) * 100);
  const oasYearly = oasAnnualAmount(plan.oasStartAge, plan.oasYearsInCanada, plan.fullOas);

  return (
    <form className="plan-form" onSubmit={(e) => e.preventDefault()} aria-label="Your plan">
      <details open>
        <summary>About you</summary>
        <div className="field-grid">
          <NumberField id="currentAge" label="Your age today" value={plan.currentAge}
            onChange={set("currentAge")} suffix="years" min={18} max={100} />
          <NumberField id="retirementAge" label="Age you'll retire" value={plan.retirementAge}
            onChange={set("retirementAge")} suffix="years" min={18} max={100} />
          <NumberField id="planToAge" label="Plan until age" value={plan.planToAge}
            onChange={set("planToAge")} suffix="years" min={50} max={110}
            help="Planning to 95 covers most people. Going longer is safer." />
        </div>
      </details>

      <details open>
        <summary>Savings today</summary>
        <div className="field-grid">
          <NumberField id="rrsp" label="RRSP" value={plan.rrsp} onChange={set("rrsp")} prefix="$" step={1000}
            help="Include any group RRSP or LIRA." />
          <NumberField id="tfsa" label="TFSA" value={plan.tfsa} onChange={set("tfsa")} prefix="$" step={1000} />
          <NumberField id="nonRegistered" label="Other investments" value={plan.nonRegistered}
            onChange={set("nonRegistered")} prefix="$" step={1000}
            help="Non-registered investment accounts and savings." />
        </div>
      </details>

      <details open>
        <summary>Saving each year until you retire</summary>
        <div className="field-grid">
          <NumberField id="rrspContribution" label="Into your RRSP" value={plan.rrspContribution}
            onChange={set("rrspContribution")} prefix="$" step={500} help="Include any employer match." />
          <NumberField id="tfsaContribution" label="Into your TFSA" value={plan.tfsaContribution}
            onChange={set("tfsaContribution")} prefix="$" step={500} />
          <NumberField id="nonRegisteredContribution" label="Into other investments"
            value={plan.nonRegisteredContribution} onChange={set("nonRegisteredContribution")}
            prefix="$" step={500} />
        </div>
      </details>

      <details open>
        <summary>Spending in retirement</summary>
        <NumberField id="spending" label="Yearly spending, after tax" value={plan.spending}
          onChange={set("spending")} prefix="$" step={1000}
          help="What you'll spend in a year, in today's dollars. Many people aim for 60–70% of their take-home pay." />
      </details>

      <details open>
        <summary>CPP and OAS</summary>
        <NumberField id="cppAt65" label="Your CPP at 65, per year" value={plan.cppAt65}
          onChange={set("cppAt65")} prefix="$" step={100}
          help="Find your estimate in your My Service Canada Account. Multiply the monthly figure by 12." />
        <SliderField id="cppStartAge" label="Start CPP at age" value={plan.cppStartAge}
          onChange={set("cppStartAge")} min={60} max={70}
          describe={(age) =>
            age === 65
              ? `You'll get the full amount: ${money(plan.cppAt65)} a year.`
              : `${cppChange < 0 ? "Reduced" : "Increased"} by ${Math.abs(cppChange)}% to ${money(
                  plan.cppAt65 * cppAdjustmentFactor(age),
                )} a year, for life.`
          } />
        <NumberField id="oasYearsInCanada" label="Years living in Canada after age 18"
          value={plan.oasYearsInCanada} onChange={set("oasYearsInCanada")} suffix="years" min={0} max={60}
          help="40 years gets you full OAS. You need at least 10 to qualify." />
        <SliderField id="oasStartAge" label="Start OAS at age" value={plan.oasStartAge}
          onChange={set("oasStartAge")} min={65} max={70}
          describe={() =>
            oasYearly > 0
              ? `About ${money(oasYearly)} a year, rising 10% at age 75.`
              : "With fewer than 10 years in Canada, you won't get OAS."
          } />
      </details>

      <details>
        <summary>Workplace pension</summary>
        <NumberField id="pension" label="Pension per year" value={plan.pension} onChange={set("pension")}
          prefix="$" step={1000} help="A defined benefit pension from an employer. Leave at 0 if you don't have one." />
        <NumberField id="pensionStartAge" label="Pension starts at age" value={plan.pensionStartAge}
          onChange={set("pensionStartAge")} suffix="years" min={50} max={75} />
        <ToggleField id="pensionIndexed" label="Rises with inflation" checked={plan.pensionIndexed}
          onChange={set("pensionIndexed")}
          help="Most public-sector pensions do. Many private ones don't." />
      </details>

      <details>
        <summary>Assumptions</summary>
        <div className="field-grid">
          <NumberField id="expectedReturn" label="Investment growth per year" value={plan.expectedReturn}
            onChange={set("expectedReturn")} suffix="%" step={0.5} min={-5} max={15}
            help="Before inflation. A balanced mix of stocks and bonds might average 5–6%." />
          <NumberField id="inflation" label="Inflation per year" value={plan.inflation}
            onChange={set("inflation")} suffix="%" step={0.25} min={0} max={10}
            help="The Bank of Canada aims for 2%." />
          <NumberField id="taxRate" label="Average tax rate in retirement" value={plan.taxRate}
            onChange={set("taxRate")} suffix="%" step={1} min={0} max={60}
            help="Federal and provincial combined. 15–25% is typical for retirees." />
          <NumberField id="volatility" label="Market ups and downs" value={plan.volatility}
            onChange={set("volatility")} suffix="%" step={1} min={0} max={30}
            help="How much returns swing from year to year. Balanced: about 10%. All stocks: about 16%." />
          <NumberField id="fullOas" label="Full OAS per year" value={plan.fullOas} onChange={set("fullOas")}
            prefix="$" step={100} help="For ages 65–74: $762.50 a month from October to December 2026. It rises with inflation every three months, so update this now and then." />
        </div>
      </details>
    </form>
  );
}
