import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearRow } from "../engine/projection";
import type { SimulationBand } from "../engine/simulation";
import { money, shortMoney } from "../format";

// Chart colours come from CSS variables so they follow light and dark mode.
// Each account keeps the same colour on every chart.
export const SERIES = {
  rrsp: "var(--series-1)",
  tfsa: "var(--series-2)",
  nonRegistered: "var(--series-3)",
  cpp: "var(--series-4)",
  oas: "var(--series-5)",
  pension: "var(--series-6)",
  shortfall: "var(--critical)",
};

const SCENARIO_COLOURS = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

const axisTick = { fill: "var(--muted)", fontSize: 12 };
const CHART_MARGIN = { top: 16, right: 12, bottom: 0, left: 0 };

function Frame({ height = 300, children }: { height?: number; children: ReactNode }) {
  return (
    <div className="chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

/** Grid and axes shared by every chart. Bar charts need a category axis so bars don't overlap the labels. */
function axes(bars = false) {
  return [
    <CartesianGrid key="grid" vertical={false} stroke="var(--grid)" />,
    <XAxis
      key="x"
      dataKey="age"
      {...(bars ? { type: "category" as const, minTickGap: 16 } : { type: "number" as const, domain: ["dataMin", "dataMax"] })}
      allowDecimals={false}
      tick={axisTick}
      tickLine={false}
      axisLine={{ stroke: "var(--axis)" }}
      label={{ value: "Age", position: "insideBottomRight", offset: -2, fill: "var(--muted)", fontSize: 12 }}
      height={36}
    />,
    <YAxis
      key="y"
      tickFormatter={shortMoney}
      tick={axisTick}
      tickLine={false}
      axisLine={false}
      width={56}
    />,
  ];
}

interface TipEntry {
  name?: string;
  value?: number | number[];
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
  footer,
  reverse = true,
}: {
  reverse?: boolean;
  active?: boolean;
  payload?: TipEntry[];
  label?: number;
  footer?: (age: number) => ReactNode;
}) {
  if (!active || !payload?.length || label === undefined) return null;
  const entries = payload.filter((p) => {
    const v = Array.isArray(p.value) ? p.value[1] : p.value;
    return v !== undefined && Math.abs(v) >= 1;
  });
  return (
    <div className="tooltip">
      <div className="tooltip-title">Age {label}</div>
      {(reverse ? [...entries].reverse() : entries).map((p) => (
        <div className="tooltip-row" key={String(p.dataKey)}>
          <span className="swatch" style={{ background: p.color }} />
          <span className="tooltip-name">{p.name}</span>
          <span className="tooltip-value">
            {Array.isArray(p.value) ? `${money(p.value[0])} – ${money(p.value[1])}` : money(p.value ?? 0)}
          </span>
        </div>
      ))}
      {footer?.(label)}
    </div>
  );
}

const legendProps = {
  iconType: "square" as const,
  iconSize: 10,
  wrapperStyle: { fontSize: 13, color: "var(--ink-2)", paddingTop: 4 },
  formatter: (value: string) => <span className="legend-text">{value}</span>,
};

function retireLine(age: number) {
  return (
    <ReferenceLine
      x={age}
      stroke="var(--ink-2)"
      strokeDasharray="0"
      label={{ value: "Retire", position: "insideTopLeft", fill: "var(--ink-2)", fontSize: 12 }}
    />
  );
}

export function BalanceChart({ rows, retirementAge }: { rows: YearRow[]; retirementAge: number }) {
  const areas: [keyof typeof SERIES, string][] = [
    ["rrsp", "RRSP / RRIF"],
    ["tfsa", "TFSA"],
    ["nonRegistered", "Other investments"],
  ];
  return (
    <Frame>
      <AreaChart data={rows} margin={CHART_MARGIN}>
        {axes()}
        <Tooltip content={<ChartTooltip footer={(age) => {
          const row = rows.find((r) => r.age === age);
          return row ? <div className="tooltip-total">Total {money(row.total)}</div> : null;
        }} />} cursor={{ stroke: "var(--axis)" }} />
        <Legend {...legendProps} />
        {areas.map(([key, name]) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stackId="savings"
            stroke={SERIES[key]}
            strokeWidth={2}
            fill={SERIES[key]}
            fillOpacity={0.28}
            isAnimationActive={false}
          />
        ))}
        {retireLine(retirementAge)}
      </AreaChart>
    </Frame>
  );
}

export function IncomeChart({ rows, spending, taxRate }: { rows: YearRow[]; spending: number; taxRate: number }) {
  const keep = 1 - taxRate / 100;
  const data = rows
    .filter((r) => r.retired)
    .map((r) => ({
      age: r.age,
      cpp: r.cpp * keep,
      oas: r.oas * keep,
      pension: r.pension * keep,
      rrsp: r.rrspWithdrawal * keep,
      nonRegistered: r.nonRegisteredWithdrawal,
      tfsa: r.tfsaWithdrawal,
      shortfall: r.shortfall,
    }));
  const bars: [keyof typeof SERIES, string][] = [
    ["cpp", "CPP"],
    ["oas", "OAS"],
    ["pension", "Pension"],
    ["rrsp", "RRSP / RRIF"],
    ["nonRegistered", "Other investments"],
    ["tfsa", "TFSA"],
    ["shortfall", "Not covered"],
  ];
  const hasShortfall = data.some((d) => d.shortfall > 0);
  const hasPension = data.some((d) => d.pension > 0);
  return (
    <Frame>
      <BarChart data={data} margin={{ ...CHART_MARGIN, top: 28 }} barCategoryGap={1}>
        {axes(true)}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--hover)" }} />
        <Legend {...legendProps} />
        {bars
          .filter(([key]) => (key !== "shortfall" || hasShortfall) && (key !== "pension" || hasPension))
          .map(([key, name]) => (
            <Bar
              key={key}
              dataKey={key}
              name={name}
              stackId="income"
              fill={SERIES[key]}
              stroke="var(--surface)"
              strokeWidth={1}
              maxBarSize={24}
              isAnimationActive={false}
            />
          ))}
        <ReferenceLine
          y={spending}
          stroke="var(--ink)"
          strokeWidth={1.5}
          label={{ value: `Spending goal ${shortMoney(spending)}`, position: "insideBottomRight", fill: "var(--ink)", fontSize: 12 }}
        />
      </BarChart>
    </Frame>
  );
}

export function RiskChart({ bands, retirementAge }: { bands: SimulationBand[]; retirementAge: number }) {
  const data = bands.map((b) => ({ age: b.age, range: [b.low, b.high], median: b.median }));
  return (
    <Frame height={320}>
      <ComposedChart data={data} margin={CHART_MARGIN}>
        {axes()}
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--axis)" }} />
        <Legend
          {...legendProps}
          content={() => (
            <div className="legend">
              <span><span className="swatch band" /> Poor to strong markets</span>
              <span><span className="swatch line" /> Typical market</span>
            </div>
          )}
        />
        <Area
          dataKey="range"
          name="Poor to strong markets"
          stroke="none"
          fill="var(--series-1)"
          fillOpacity={0.18}
          isAnimationActive={false}
        />
        <Line
          dataKey="median"
          name="Typical market"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
        {retireLine(retirementAge)}
      </ComposedChart>
    </Frame>
  );
}

export function CompareChart({ series }: { series: { name: string; rows: YearRow[] }[] }) {
  const byAge = new Map<number, Record<string, number>>();
  series.forEach((s, i) =>
    s.rows.forEach((r) => {
      const point = byAge.get(r.age) ?? { age: r.age };
      point[`s${i}`] = r.total;
      byAge.set(r.age, point);
    }),
  );
  const data = [...byAge.values()].sort((a, b) => a.age - b.age);
  return (
    <Frame>
      <LineChart data={data} margin={CHART_MARGIN}>
        {axes()}
        <Tooltip content={<ChartTooltip reverse={false} />} cursor={{ stroke: "var(--axis)" }} />
        <Legend {...legendProps} />
        {series.map((s, i) => (
          <Line
            key={i}
            dataKey={`s${i}`}
            name={s.name}
            stroke={SCENARIO_COLOURS[i]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </Frame>
  );
}
