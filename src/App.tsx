import { useMemo } from "react";
import { BusSchematic } from "./components/BusSchematic";
import { ControlPanel } from "./components/ControlPanel";
import { RegisterInspector } from "./components/RegisterInspector";
import { SimulationLog } from "./components/SimulationLog";
import { routeFor } from "./simulator/routes";
import { useSimulator } from "./useSimulator";

export default function App() {
  const sim = useSimulator();
  const { cpu, prev, error } = sim.view;
  const op = cpu.currentOperation;
  const regs = cpu.registers;
  const route = useMemo(() => routeFor(op, prev.PC !== regs.PC), [op, prev, regs.PC]);
  const changed = useMemo(() => new Set(op?.changed ?? []), [op]);
  const nonZero = useMemo(() => {
    const out: [number, number][] = [];
    for (let a = 0; a < 4096; a++) if (cpu.memory[a]) out.push([a, cpu.memory[a]]);
    return out;
  }, [cpu, sim.steps]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <header className="border-b border-slate-800 px-5 py-3">
        <h1 className="text-lg font-semibold text-slate-100">Mano’s basic computer</h1>
        <p className="text-sm text-slate-400">Step through the instruction cycle and watch data cross the common bus.</p>
      </header>
      <main className="mx-auto grid max-w-[1500px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-2">
          <BusSchematic route={route} regs={regs} memWord={cpu.memory[regs.AR]} changed={changed} running={sim.playing || (!!op && sim.canNext)} />
        </section>
        <aside className="flex flex-col gap-4">
          <ControlPanel presetId={sim.presetId} onPreset={sim.choosePreset} playing={sim.playing} onPlay={sim.togglePlay}
            onNext={sim.next} onPrev={sim.prev} onReset={sim.reset} canNext={sim.canNext} canPrev={sim.canPrev}
            speed={sim.speed} onSpeed={sim.setSpeed} source={sim.source} onSource={sim.editSource} error={error} steps={sim.steps} />
          <SimulationLog current={op} history={cpu.history} />
          <RegisterInspector regs={regs} route={route} changed={changed} nonZero={nonZero} />
        </aside>
      </main>
    </div>
  );
}
