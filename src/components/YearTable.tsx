import type { YearRow } from "../engine/projection";
import { money } from "../format";

export function YearTable({ rows }: { rows: YearRow[] }) {
  return (
    <div className="table-scroll">
      <table className="year-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">RRSP / RRIF</th>
            <th scope="col">TFSA</th>
            <th scope="col">Other</th>
            <th scope="col">Total saved</th>
            <th scope="col">CPP</th>
            <th scope="col">OAS</th>
            <th scope="col">Pension</th>
            <th scope="col">Taken from savings</th>
            <th scope="col">Tax</th>
            <th scope="col">Not covered</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.age} className={r.shortfall > 0 ? "row-short" : r.retired ? "" : "row-working"}>
              <th scope="row">{r.age}</th>
              <td>{money(r.rrsp)}</td>
              <td>{money(r.tfsa)}</td>
              <td>{money(r.nonRegistered)}</td>
              <td className="strong">{money(r.total)}</td>
              <td>{dash(r.cpp)}</td>
              <td>{dash(r.oas)}</td>
              <td>{dash(r.pension)}</td>
              <td>{dash(r.rrspWithdrawal + r.nonRegisteredWithdrawal + r.tfsaWithdrawal)}</td>
              <td>{dash(r.tax)}</td>
              <td>{dash(r.shortfall)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function dash(value: number): string {
  return value >= 1 ? money(value) : "–";
}
