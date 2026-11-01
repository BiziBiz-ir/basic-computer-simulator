import { useEffect, useMemo, useState } from "react";
import { CPU } from "./simulator/CPU";
import { assemble } from "./simulator/assembler";
import type { CPURegisters } from "./simulator/types";
import { PRESETS } from "./presets";

export interface SimView { cpu: CPU; prev: CPURegisters; error: string }

/** Rebuilds the machine and replays `steps` micro-operations (deterministic, so "previous" is just replay). */
function build(source: string, steps: number): SimView {
  const cpu = new CPU();
  let prev: CPURegisters = { ...cpu.registers };
  try {
    const asm = assemble(source);
    for (const [a, w] of asm.memory) cpu.loadMemory(a, w);
    cpu.setPC(asm.startAddress);
    prev = { ...cpu.registers };
    for (let i = 0; i < steps; i++) {
      prev = { ...cpu.registers };
      if (cpu.step() === null) break;
    }
    return { cpu, prev, error: "" };
  } catch (e) {
    return { cpu, prev, error: e instanceof Error ? e.message : "Simulation error." };
  }
}

export function useSimulator() {
  const [presetId, setPresetId] = useState(PRESETS[1].id);
  const [source, setSource] = useState(PRESETS[1].source);
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  const view = useMemo(() => build(source, steps), [source, steps]);
  const canNext = !view.cpu.halted && !view.error;

  useEffect(() => {
    if (!playing) return;
    if (!canNext) { setPlaying(false); return; }
    const t = setTimeout(() => setSteps((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [playing, canNext, steps, speed]);

  return {
    view, steps, playing, speed, setSpeed, source, presetId, canNext, canPrev: steps > 0,
    next: () => canNext && setSteps((s) => s + 1),
    prev: () => setSteps((s) => Math.max(0, s - 1)),
    reset: () => { setPlaying(false); setSteps(0); },
    togglePlay: () => setPlaying((p) => !p),
    editSource: (s: string) => { setSource(s); setSteps(0); setPlaying(false); setPresetId("custom"); },
    choosePreset: (id: string) => {
      const p = PRESETS.find((x) => x.id === id);
      if (p) { setPresetId(id); setSource(p.source); setSteps(0); setPlaying(false); }
    },
  };
}
