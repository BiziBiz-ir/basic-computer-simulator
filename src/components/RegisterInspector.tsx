import { useState } from "react";
import type { CPURegisters } from "../simulator/types";
import { selectBits, type Route } from "../simulator/routes";

const ROWS: [keyof CPURegisters, number][] = [["AR", 12], ["PC", 12], ["DR", 16], ["AC", 16], ["IR", 16], ["TR", 16], ["INPR", 8], ["OUTR", 8], ["E", 1]];

function fmt(v: number, bits: number, bin: boolean) {
  if (!bin) return v.toString(16).toUpperCase().padStart(Math.ceil(bits / 4), "0");
  return v.toString(2).padStart(bits, "0").replace(/(?=(\d{4})+$)/g, " ").trim();
}

export function RegisterInspector({ regs, route, changed, nonZero }: {
  regs: CPURegisters; route: Route; changed: ReadonlySet<string>; nonZero: [number, number][];
}) {
  const [bin, setBin] = useState(false);
  const sig = (label: string, v: string, on: boolean) => (
    <div className={`flex justify-between rounded px-2 py-1 ${on ? "bg-amber-400/10 text-amber-300" : "text-slate-500"}`}>
      <span>{label}</span><span className="font-mono">{v}</span>
    </div>);
  const list = (a: string[]) => (a.length ? a.join(", ") : "none");
  const s = selectBits(route);
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Registers</h2>
        <div className="flex overflow-hidden rounded-md border border-slate-700 text-xs">
          {["Hex", "Binary"].map((m) => (
            <button key={m} onClick={() => setBin(m === "Binary")} aria-pressed={bin === (m === "Binary")}
              className={`px-2 py-1 ${bin === (m === "Binary") ? "bg-sky-500/25 text-sky-200" : "text-slate-400"}`}>{m}</button>
          ))}
        </div>
      </div>
      <dl className="mt-2 grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-1 font-mono text-sm">
        {ROWS.map(([n, b]) => (
          <div key={n} className="contents">
            <dt className="text-slate-500">{n}</dt>
            <dd className={changed.has(n) ? "text-amber-300" : "text-slate-200"}>{fmt(regs[n], b, bin)}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-4 text-sm font-semibold text-slate-200">Control signals</h2>
      <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs">
        {sig("S2", s[0], s[0] === "1")}{sig("S1", s[1], s[1] === "1")}{sig("S0", s[2], s[2] === "1")}
        {sig("Read", route.read ? "1" : "0", route.read)}{sig("Write", route.write ? "1" : "0", route.write)}
        {sig("Bus source", route.src ?? "none", !!route.src)}
      </div>
      <div className="mt-1 text-xs">{sig("LD", list(route.ld), route.ld.length > 0)}{sig("INR", list(route.inr), route.inr.length > 0)}{sig("CLR", list(route.clr), route.clr.length > 0)}</div>

      <h2 className="mt-4 text-sm font-semibold text-slate-200">Memory (non-zero words)</h2>
      <ul className="mt-1 grid grid-cols-2 gap-x-3 font-mono text-xs text-slate-400">
        {nonZero.slice(0, 10).map(([a, w]) => (
          <li key={a} className={a === regs.AR ? "text-sky-300" : ""}>{a.toString(16).toUpperCase().padStart(3, "0")}: {w.toString(16).toUpperCase().padStart(4, "0")}</li>
        ))}
      </ul>
    </section>
  );
}
