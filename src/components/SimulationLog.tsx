import type { MicroOperation } from "../simulator/types";
import { displayLabel } from "../simulator/routes";

const STAGE_STYLE: Record<string, string> = {
  FETCH: "bg-sky-500/20 text-sky-300", DECODE: "bg-violet-500/20 text-violet-300",
  INDIRECT: "bg-fuchsia-500/20 text-fuchsia-300", EXECUTE: "bg-amber-500/20 text-amber-300",
  INTERRUPT: "bg-red-500/20 text-red-300", HALTED: "bg-slate-500/20 text-slate-300",
};

export function SimulationLog({ current, history }: { current: MicroOperation | null; history: MicroOperation[] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4" aria-live="polite">
      {current ? (
        <>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-sm font-bold text-amber-300">{current.time}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STAGE_STYLE[current.stage]}`}>{current.stage.toLowerCase()}</span>
          </div>
          <p className="mt-2 font-mono text-base font-semibold text-slate-100">{displayLabel(current)}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{current.description}</p>
        </>
      ) : <p className="text-sm text-slate-400">Press play or next step to run the first clock pulse (T0).</p>}
      <ol className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t border-slate-800 pt-3 font-mono text-xs">
        {history.slice().reverse().map((op, i) => (
          <li key={history.length - i} className={`flex gap-2 ${i === 0 ? "text-slate-100" : "text-slate-500"}`}>
            <span className="w-8 shrink-0 text-amber-300/80">{op.time}</span><span>{displayLabel(op)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
