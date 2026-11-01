import type { MicroOperation } from "./types";

/** Common-bus multiplexer inputs (Mano Fig. 5-4): S2 S1 S0 selects the source. */
export type BusSource = "AR" | "PC" | "DR" | "AC" | "IR" | "TR" | "MEM";
export const BUS_SELECT: Record<BusSource, number> = { AR: 1, PC: 2, DR: 3, AC: 4, IR: 5, TR: 6, MEM: 7 };

/** Everything the schematic needs to light up for one micro-operation. */
export interface Route {
  src?: BusSource;
  ld: string[];
  inr: string[];
  clr: string[];
  read: boolean;
  write: boolean;
  /** ids of direct (non-bus) wires: addr, opcode, dr_alu, ac_alu, alu_ac, inpr_alu, alu_e */
  wires: string[];
}

const ALU = ["dr_alu", "ac_alu", "alu_ac"];
const MEMREF = /AND|ADD|LDA|STA|BUN|BSA|ISZ/;

export function selectBits(r: Route): string {
  return (r.src ? BUS_SELECT[r.src] : 0).toString(2).padStart(3, "0");
}

export function displayLabel(op: MicroOperation): string {
  if (!op.label.startsWith("Decode")) return op.label;
  return MEMREF.test(op.label)
    ? "D0…D7 ← Decode IR(12–14), AR ← IR(0–11)"
    : "D0…D7 ← Decode IR(12–14)";
}

/** Maps a micro-operation (by label) to the paths and control signals it uses. */
export function routeFor(op: MicroOperation | null, pcMoved: boolean): Route {
  const r: Route = { ld: [], inr: [], clr: [], read: false, write: false, wires: [] };
  if (!op) return r;
  const l = op.label;
  const bus = (src: BusSource, ...ld: string[]) => { r.src = src; r.ld.push(...ld); };
  const memRead = (ld: string) => { bus("MEM", ld); r.read = true; r.wires.push("addr"); };
  const memWrite = (src: BusSource) => { r.src = src; r.write = true; r.wires.push("addr"); };

  if (l.startsWith("Decode")) {
    r.wires.push("opcode");
    if (MEMREF.test(l)) bus("IR", "AR");
  } else if (l.startsWith("Interrupt")) {
    memWrite("PC"); r.clr.push("AR", "PC"); r.inr.push("PC");
  } else if (l.startsWith("If ")) {
    if (pcMoved) r.inr.push("PC");
  } else if (l.startsWith("Circulate")) {
    r.ld.push("AC", "E"); r.wires.push("ac_alu", "alu_ac", "alu_e");
  } else if (l.startsWith("AC(0–7)")) {
    r.ld.push("AC"); r.wires.push("inpr_alu", "alu_ac");
  } else if (l.startsWith("OUTR")) {
    bus("AC", "OUTR");
  } else {
    switch (l) {
      case "AR ← PC": bus("PC", "AR"); break;
      case "IR ← M[AR], PC ← PC + 1": memRead("IR"); r.inr.push("PC"); break;
      case "AR ← M[AR](0–11)": memRead("AR"); break;
      case "DR ← M[AR]": memRead("DR"); break;
      case "AC ← AC ∧ DR": r.ld.push("AC"); r.wires.push(...ALU); break;
      case "AC ← AC + DR, E ← Cout": r.ld.push("AC", "E"); r.wires.push(...ALU, "alu_e"); break;
      case "AC ← DR": r.ld.push("AC"); r.wires.push("dr_alu", "alu_ac"); break;
      case "AC ← AC′": r.ld.push("AC"); r.wires.push("ac_alu", "alu_ac"); break;
      case "M[AR] ← AC": memWrite("AC"); break;
      case "PC ← AR": bus("AR", "PC"); break;
      case "M[AR] ← PC, AR ← AR + 1": memWrite("PC"); r.inr.push("AR"); break;
      case "DR ← DR + 1": r.inr.push("DR"); break;
      case "M[AR] ← DR; if zero, PC ← PC + 1": memWrite("DR"); if (pcMoved) r.inr.push("PC"); break;
      case "AC ← 0": r.clr.push("AC"); break;
      case "E ← 0": r.clr.push("E"); break;
      case "E ← E′": r.ld.push("E"); break;
      case "AC ← AC + 1": r.inr.push("AC"); break;
    }
  }
  return r;
}
