import { useEffect, useState } from "react";
import { PlanForm } from "./components/PlanForm";
import { EXAMPLE_PLAN, type Plan, upgradePlan, validatePlan } from "./engine/plan";
import { load, loadList, save } from "./storage";
import { CompareView, MAX_COMPARED, type Scenario } from "./views/CompareView";
import { HowItWorks } from "./views/HowItWorks";
import { PlanView } from "./views/PlanView";
import { RiskView } from "./views/RiskView";

const TABS = [
  { id: "plan", label: "My plan" },
  { id: "risk", label: "Will my money last?" },
  { id: "compare", label: "Compare scenarios" },
  { id: "how", label: "How it works" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const KEYS = {
  plan: "tnr.plan",
  isExample: "tnr.isExample",
  scenarios: "tnr.scenarios",
  selected: "tnr.selected",
};

function tabFromHash(): TabId {
  const hash = window.location.hash.slice(1);
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : "plan";
}

export default function App() {
  const [plan, setPlan] = useState<Plan>(() => upgradePlan(load(KEYS.plan, EXAMPLE_PLAN)));
  const [isExample, setIsExample] = useState<boolean>(() => load(KEYS.isExample, { value: true }).value);
  const [scenarios, setScenarios] = useState<Scenario[]>(() =>
    loadList<Scenario>(KEYS.scenarios).map((s) => ({ ...s, plan: upgradePlan({ ...EXAMPLE_PLAN, ...s.plan }) })),
  );
  const [selected, setSelected] = useState<string[]>(() => loadList(KEYS.selected));
  const [tab, setTab] = useState<TabId>(tabFromHash);

  useEffect(() => save(KEYS.plan, plan), [plan]);
  useEffect(() => save(KEYS.isExample, { value: isExample }), [isExample]);
  useEffect(() => save(KEYS.scenarios, scenarios), [scenarios]);
  useEffect(() => save(KEYS.selected, selected), [selected]);

  // Tab links work through the address bar's #section, and also directly on click
  // in case the page is shown somewhere that doesn't update the address.
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      if (id && TABS.some((t) => t.id === id)) {
        setTab(id as TabId);
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const problems = validatePlan(plan);

  const updatePlan = (next: Plan) => {
    setPlan(next);
    setIsExample(false);
  };

  const saveScenario = (name: string) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setScenarios([...scenarios, { id, name, plan }]);
    if (selected.length < MAX_COMPARED) setSelected([...selected, id]);
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 3l3.2 9.6H29l-8 5.9 3 9.5-8-5.8-8 5.8 3-9.5-8-5.9h9.8z" />
          </svg>
          <div>
            <h1>True North Retirement</h1>
            <p className="tagline">A retirement planner built on Canadian rules: CPP, OAS, RRSP, RRIF and TFSA.</p>
          </div>
        </div>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={t.id === tab ? "tab active" : "tab"}
              aria-current={t.id === tab ? "page" : undefined}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      {isExample && tab !== "how" && (
        <div className="example-banner" role="note">
          <strong>These are example numbers.</strong> Replace them with your own under “Your details” to see your plan.
        </div>
      )}

      <div className={tab === "how" ? "layout single" : "layout"}>
        {tab !== "how" && (
          <aside className="sidebar">
            <div className="sidebar-head">
              <h2>Your details</h2>
              <button
                type="button"
                className="button quiet"
                onClick={() => {
                  setPlan(EXAMPLE_PLAN);
                  setIsExample(true);
                }}
              >
                Reset to example
              </button>
            </div>
            <PlanForm plan={plan} onChange={updatePlan} />
          </aside>
        )}

        <main className="results">
          {problems.length > 0 && tab !== "how" ? (
            <div className="panel problems" role="alert">
              <h2>Check your details</h2>
              <ul>
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              {tab === "plan" && <PlanView plan={plan} />}
              {tab === "risk" && <RiskView plan={plan} />}
              {tab === "compare" && (
                <CompareView
                  plan={plan}
                  scenarios={scenarios}
                  selected={selected}
                  onSave={saveScenario}
                  onDelete={(id) => {
                    setScenarios(scenarios.filter((s) => s.id !== id));
                    setSelected(selected.filter((s) => s !== id));
                  }}
                  onLoad={(s) => {
                    updatePlan(s.plan);
                    setTab("plan");
                    window.scrollTo({ top: 0 });
                  }}
                  onToggle={(id) =>
                    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
                  }
                />
              )}
              {tab === "how" && <HowItWorks />}
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        A planning tool, not financial advice. Your numbers stay in this browser.
      </footer>
    </div>
  );
}
