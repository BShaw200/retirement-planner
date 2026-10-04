import { useMemo, useState } from "react";
import type { Plan } from "../engine/plan";
import { affordableSpending, project } from "../engine/projection";
import { simulate } from "../engine/simulation";
import { CompareChart } from "../components/charts";
import { StatusPill } from "../components/StatusPill";
import { money, percent } from "../format";
import { successTone } from "./RiskView";

export interface Scenario {
  id: string;
  name: string;
  plan: Plan;
}

/** Up to three scenarios can be compared at once, so the chart stays readable. */
export const MAX_COMPARED = 3;

interface CompareViewProps {
  plan: Plan;
  scenarios: Scenario[];
  selected: string[];
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onLoad: (scenario: Scenario) => void;
  onToggle: (id: string) => void;
}

export function CompareView({ plan, scenarios, selected, onSave, onDelete, onLoad, onToggle }: CompareViewProps) {
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const compared = useMemo(
    () =>
      scenarios
        .filter((s) => selected.includes(s.id))
        .map((s) => ({
          ...s,
          projection: project(s.plan),
          affordable: affordableSpending(s.plan),
          success: simulate(s.plan).successRate,
        })),
    [scenarios, selected],
  );

  const suggestedName = `Retire at ${plan.retirementAge}, spend ${money(plan.spending)}`;

  return (
    <div className="view">
      <section className="panel">
        <header className="panel-head">
          <h2>Save your current plan</h2>
          <p>
            Save the plan as it is now, change something in “Your details” (like your retirement age), and save again.
            Then tick up to {MAX_COMPARED} scenarios to compare them.
          </p>
        </header>
        <form
          className="save-row"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(name.trim() || suggestedName);
            setName("");
          }}
        >
          <label htmlFor="scenarioName" className="visually-hidden">Scenario name</label>
          <input
            id="scenarioName"
            type="text"
            value={name}
            placeholder={suggestedName}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
          <button type="submit" className="button primary">Save scenario</button>
        </form>

        {scenarios.length === 0 ? (
          <p className="empty">No saved scenarios yet. Your first one will appear here.</p>
        ) : (
          <ul className="scenario-list">
            {scenarios.map((s) => {
              const checked = selected.includes(s.id);
              const full = !checked && selected.length >= MAX_COMPARED;
              return (
                <li key={s.id}>
                  <input
                    id={`pick-${s.id}`}
                    type="checkbox"
                    checked={checked}
                    disabled={full}
                    onChange={() => onToggle(s.id)}
                  />
                  <label htmlFor={`pick-${s.id}`} title={full ? `You can compare up to ${MAX_COMPARED} at once` : undefined}>
                    <span className="scenario-name">{s.name}</span>
                    <span className="scenario-meta">
                      Retire at {s.plan.retirementAge} · spend {money(s.plan.spending)} · CPP at {s.plan.cppStartAge}
                    </span>
                  </label>
                  <div className="scenario-actions">
                    {pendingDelete === s.id ? (
                      <>
                        <button type="button" className="button danger" onClick={() => { onDelete(s.id); setPendingDelete(null); }}>
                          Delete
                        </button>
                        <button type="button" className="button" onClick={() => setPendingDelete(null)}>Keep</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="button" onClick={() => onLoad(s)}>Open</button>
                        <button type="button" className="button quiet" onClick={() => setPendingDelete(s.id)}
                          aria-label={`Delete ${s.name}`}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {compared.length > 0 && (
        <>
          <section className="panel">
            <header className="panel-head">
              <h2>Side by side</h2>
            </header>
            <div className="table-scroll">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col"><span className="visually-hidden">Measure</span></th>
                    {compared.map((s, i) => (
                      <th scope="col" key={s.id}>
                        <span className="swatch" style={{ background: `var(--series-${i + 1})` }} />
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Retire at" values={compared.map((s) => String(s.plan.retirementAge))} />
                  <Row label="Spending goal" values={compared.map((s) => money(s.plan.spending))} />
                  <Row label="CPP / OAS start" values={compared.map((s) => `${s.plan.cppStartAge} / ${s.plan.oasStartAge}`)} />
                  <Row label="Savings at retirement" values={compared.map((s) => money(s.projection.balanceAtRetirement))} />
                  <Row
                    label="Savings last"
                    values={compared.map((s) =>
                      s.projection.runsOutAtAge === null ? `Past ${s.plan.planToAge}` : `Until ${s.projection.runsOutAtAge}`,
                    )}
                  />
                  <Row
                    label="Could spend up to"
                    values={compared.map(({ affordable: a }) =>
                      a.fromAge === null
                        ? `${money(a.early)}/yr`
                        : `${money(a.early)}/yr until ${a.fromAge}, then ${money(a.later)}/yr`,
                    )}
                  />
                  <tr>
                    <th scope="row">Chance money lasts</th>
                    {compared.map((s) => {
                      const { tone, label } = successTone(s.success);
                      return (
                        <td key={s.id}>
                          <span className="strong">{percent(s.success)}</span> <StatusPill tone={tone} label={label} />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <header className="panel-head">
              <h2>Total savings by age</h2>
              <p>Steady growth, in today's dollars.</p>
            </header>
            <CompareChart series={compared.map((s) => ({ name: s.name, rows: s.projection.rows }))} />
          </section>
        </>
      )}
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {values.map((v, i) => (
        <td key={i}>{v}</td>
      ))}
    </tr>
  );
}
