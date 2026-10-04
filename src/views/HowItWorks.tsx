import { useState } from "react";
import { rrifMinimumRate } from "../engine/canada";

export function HowItWorks() {
  const [showRrif, setShowRrif] = useState(false);
  return (
    <div className="view prose">
      <section className="panel">
        <h2>How the planner works</h2>
        <p>
          The planner steps through your life one year at a time. While you work, your savings grow and you add to
          them. Once you retire, it works out how much of your spending CPP, OAS and any pension cover, and takes
          the rest from your savings.
        </p>

        <h3>Today's dollars</h3>
        <p>
          Every amount is shown in today's dollars. Think of it as a price tag that's been adjusted for inflation:
          if the chart says $50,000 at age 80, that's what $50,000 buys today, even though the actual number on
          your bank statement will be bigger by then.
        </p>

        <h3>CPP</h3>
        <p>
          You can start CPP any time from 60 to 70. Starting early cuts it by 0.6% for every month before 65 (36% at
          60). Waiting raises it by 0.7% for every month after 65 (42% at 70). It rises with inflation for life.
        </p>

        <h3>OAS</h3>
        <p>
          Full OAS needs 40 years living in Canada after age 18; you get 1/40th for each year, with at least 10
          needed. You can start between 65 and 70, gaining 0.6% for each month you wait. It goes up 10% at 75.
        </p>

        <h3>RRSP and RRIF</h3>
        <p>
          Your RRSP must become a RRIF by the end of the year you turn 71. From then on the government sets a
          minimum you must withdraw each year, starting at 5.4% at age 72 and climbing to 20% at 95. If the
          minimum is more than you need, the planner moves the extra (after tax) into your other investments.
        </p>
        <button type="button" className="button quiet" onClick={() => setShowRrif(!showRrif)} aria-expanded={showRrif}>
          {showRrif ? "Hide" : "Show"} the RRIF minimum table
        </button>
        {showRrif && (
          <div className="rrif-table">
            {Array.from({ length: 24 }, (_, i) => 72 + i).map((age) => (
              <div key={age}>
                <span>{age === 95 ? "95+" : age}</span>
                <span>{(rrifMinimumRate(age) * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        )}

        <h3>Which savings get spent first</h3>
        <p>
          The planner spends other investments first, then your RRSP/RRIF, and saves your TFSA for last. TFSA
          withdrawals are tax-free and don't affect OAS, so it often makes sense to leave it growing the longest.
        </p>

        <h3>Will my money last?</h3>
        <p>
          The main chart assumes the same growth every year. Real markets don't work like that: a crash just after
          you retire hurts much more than one twenty years later. So the planner also runs your plan 1,000 times with
          random good and bad years, and counts how many times your money lasts. It's like checking the weather
          forecast: 85% means 85 out of 100 possible futures worked out.
        </p>

        <h3>What it leaves out</h3>
        <ul>
          <li>Tax is a single average rate you choose, not the full federal and provincial tax brackets.</li>
          <li>Withdrawals from other investments are treated as tax-free. In reality you'd pay some tax on the growth.</li>
          <li>OAS clawback for higher incomes, pension income splitting and the GIS aren't included.</li>
          <li>TFSA and RRSP contribution limits aren't checked.</li>
          <li>Spending stays the same every year of retirement.</li>
        </ul>
        <p className="muted">
          This is a planning tool, not financial advice. For decisions about your money, talk to a fee-only
          financial planner.
        </p>
        <p className="muted">
          Your numbers are saved in this browser only and never sent anywhere.
        </p>
      </section>
    </div>
  );
}
