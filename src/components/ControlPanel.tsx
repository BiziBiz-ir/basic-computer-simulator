import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { PRESETS } from "../presets";

interface Props {
  presetId: string; onPreset: (id: string) => void;
  playing: boolean; onPlay: () => void; onNext: () => void; onPrev: () => void; onReset: () => void;
  canNext: boolean; canPrev: boolean; speed: number; onSpeed: (ms: number) => void;
  source: string; onSource: (s: string) => void; error: string; steps: number;
}

const btn = "inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40";

export function ControlPanel(p: Props) {
  const preset = PRESETS.find((x) => x.id === p.presetId);
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <label className="block text-sm font-medium text-slate-300" htmlFor="cycle">Instruction cycle</label>
      <select id="cycle" value={p.presetId} onChange={(e) => p.onPreset(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
        {PRESETS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        {p.presetId === "custom" && <option value="custom">Custom program</option>}
      </select>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{preset?.blurb ?? "Your own program: step through it like any other."}</p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <button className={btn} onClick={p.onPrev} disabled={!p.canPrev} aria-label="Previous step"><SkipBack size={16} /></button>
        <button className={`${btn} border-sky-500 bg-sky-500/15`} onClick={p.onPlay} disabled={!p.canNext && !p.playing}
          aria-label={p.playing ? "Pause" : "Play"}>{p.playing ? <Pause size={16} /> : <Play size={16} />}</button>
        <button className={btn} onClick={p.onNext} disabled={!p.canNext} aria-label="Next step"><SkipForward size={16} /></button>
        <button className={btn} onClick={p.onReset} aria-label="Reset"><RotateCcw size={16} /></button>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
        <label htmlFor="speed">Speed</label>
        <input id="speed" type="range" min={150} max={1800} step={50} value={1950 - p.speed}
          onChange={(e) => p.onSpeed(1950 - Number(e.target.value))} className="flex-1 accent-sky-400" />
        <span className="tabular-nums">step {p.steps}</span>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-slate-300">Edit assembly</summary>
        <textarea value={p.source} onChange={(e) => p.onSource(e.target.value)} spellCheck={false} rows={9}
          className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 p-2 font-mono text-xs text-slate-200" />
        <p className="mt-1 text-xs text-slate-500">Hex addresses. ORG, DEC, HEX, @ for indirect, ; for comments.</p>
      </details>
      {p.error && <p role="alert" className="mt-3 rounded-md border border-red-500/50 bg-red-500/10 p-2 text-sm text-red-300">{p.error}</p>}
    </section>
  );
}
