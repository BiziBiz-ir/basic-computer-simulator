import type { CPURegisters } from "../simulator/types";
import { BUS_SELECT, selectBits, type BusSource, type Route } from "../simulator/routes";
import { RegisterBox, REG_W, type Pin } from "./RegisterBox";

interface Layout {
  name: "AR" | "PC" | "DR" | "AC" | "IR" | "TR" | "OUTR" | "INPR";
  bits: number; x: number; y: number; side: "L" | "R";
  bus: "io" | "in" | "none"; pins: Pin[];
}
const ALL: Pin[] = ["LD", "INR", "CLR"];
const LAYOUT: Layout[] = [
  { name: "AR", bits: 12, x: 60, y: 160, side: "L", bus: "io", pins: ALL },
  { name: "PC", bits: 12, x: 60, y: 250, side: "L", bus: "io", pins: ALL },
  { name: "DR", bits: 16, x: 60, y: 340, side: "L", bus: "io", pins: ALL },
  { name: "AC", bits: 16, x: 60, y: 530, side: "L", bus: "io", pins: ALL },
  { name: "INPR", bits: 8, x: 60, y: 620, side: "L", bus: "none", pins: [] },
  { name: "IR", bits: 16, x: 700, y: 160, side: "R", bus: "io", pins: ["LD"] },
  { name: "TR", bits: 16, x: 700, y: 250, side: "R", bus: "io", pins: ALL },
  { name: "OUTR", bits: 8, x: 700, y: 340, side: "R", bus: "in", pins: ["LD"] },
];
const BUS_X = 500;
const MEM_Y = { out: 60, in: 95 };

const WIRES: Record<string, { d: string; color: "blue" | "amber" | "red"; label?: string }> = {
  addr: { d: "M100 160 V122", color: "blue" },
  opcode: { d: "M940 188 H970 V490 H940", color: "red" },
  dr_alu: { d: "M100 396 V430", color: "blue" },
  alu_ac: { d: "M150 490 V530", color: "blue" },
  ac_alu: { d: "M200 530 V490", color: "blue" },
  inpr_alu: { d: "M60 648 H35 V460 H60", color: "blue" },
  alu_e: { d: "M225 460 H245", color: "blue" },
  sel: { d: "M700 545 H600 V670 H570", color: "red" },
};

function Wire({ id, d, on, color }: { id: string; d: string; on: boolean; color: "blue" | "amber" | "red" }) {
  return <path id={`wire-${id}`} data-wire={id} d={d} className={`wire ${on ? `on ${color}` : ""}`}
    markerEnd={`url(#ar-${on ? color : "off"})`} />;
}
function Terminal({ cx, cy, n, on }: { cx: number; cy: number; n: number; on: boolean }) {
  return <g data-terminal={n}><circle className={`term ${on ? "on" : ""}`} cx={cx} cy={cy} r={9} />
    <text className="termt" x={cx} y={cy + 4}>{n}</text></g>;
}

interface Props { route: Route; regs: CPURegisters; memWord: number; changed: ReadonlySet<string>; running: boolean }

export function BusSchematic({ route, regs, memWord, changed, running }: Props) {
  const opcode = (regs.IR >>> 12) & 7;
  const sel = selectBits(route);
  const yOf = (n: BusSource, dst: boolean) =>
    n === "MEM" ? (dst ? MEM_Y.in : MEM_Y.out) : LAYOUT.find((l) => l.name === n)!.y + (dst ? 40 : 20);

  // Highlighted stretch(es) of the bus between the selected source and each destination.
  const dsts = [...route.ld.filter((n) => LAYOUT.some((l) => l.name === n && l.bus !== "none")), ...(route.write ? ["MEM"] : [])];
  const busSegs = route.src ? dsts.map((d) => `M${BUS_X} ${yOf(route.src!, false)} V${yOf(d as BusSource, true)}`) : [];
  const hex = (v: number, n: number) => v.toString(16).toUpperCase().padStart(n, "0");
  const active = (id: string) => route.wires.includes(id);

  return (
    <svg className="schematic h-auto w-full" viewBox="0 0 1000 720" role="img"
      aria-label="Mano basic computer: registers, memory and 16-bit common bus">
      <defs>
        {(["off", "blue", "amber", "red"] as const).map((c) => (
          <marker key={c} id={`ar-${c}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill={{ off: "#2b3a55", blue: "#38bdf8", amber: "#fbbf24", red: "#ff6b6b" }[c]} />
          </marker>
        ))}
      </defs>

      {/* Memory unit */}
      <g id="memory" data-component="memory">
        <rect className={`box ${route.read || route.write ? "on" : ""}`} x={60} y={30} width={REG_W} height={90} rx={6} />
        <text className="rname" x={72} y={54}>Memory</text>
        <text className="rbits" x={72} y={70}>4096 × 16</text>
        <text className="rval" x={72} y={104} style={{ fontSize: 14 }}>M[{hex(regs.AR, 3)}] = {hex(memWord, 4)}</text>
        <text className={`label ${route.read ? "on" : ""}`} data-signal="read" x={238} y={55}>Read</text>
        <text className={`label ${route.write ? "on" : ""}`} data-signal="write" x={236} y={90}>Write</text>
      </g>
      <path className={`wire ${route.read ? "on blue" : ""}`} data-wire="mem-out" d={`M300 ${MEM_Y.out} H${BUS_X - 6}`} />
      <path className={`wire ${route.write ? "on blue" : ""}`} data-wire="mem-in" d={`M${BUS_X - 6} ${MEM_Y.in} H300`} markerEnd={`url(#ar-${route.write ? "blue" : "off"})`} />
      <Terminal cx={BUS_X - 28} cy={MEM_Y.out} n={BUS_SELECT.MEM} on={route.src === "MEM"} />
      <text className="label" x={110} y={146}>address</text>

      {/* Common bus */}
      <rect id="bus" className="busbar" x={BUS_X - 6} y={60} width={12} height={580} rx={6} />
      {busSegs.map((d, i) => <path key={i} className="wire on blue" data-wire="bus-active" d={d} />)}
      <text className="label" transform={`translate(${BUS_X - 20},470) rotate(-90)`} textAnchor="middle">16-bit common bus</text>

      {/* Registers + their bus taps */}
      {LAYOUT.map((l) => {
        const name = l.name;
        const left = l.side === "L";
        const edge = left ? l.x + REG_W : l.x;
        const bx = left ? BUS_X - 6 : BUS_X + 6;
        return (
          <g key={name}>
            {l.bus === "io" && <>
              <path className={`wire ${route.src === name ? "on blue" : ""}`} data-wire={`to-bus-${name}`} d={`M${edge} ${l.y + 20} H${bx}`} />
              <Terminal cx={left ? BUS_X - 28 : BUS_X + 28} cy={l.y + 20} n={BUS_SELECT[name as BusSource]} on={route.src === name} />
            </>}
            {l.bus !== "none" && (
              <path className={`wire ${route.ld.includes(name) ? "on blue" : ""}`} data-wire={`from-bus-${name}`}
                d={`M${bx} ${l.y + 40} H${edge}`} markerEnd={`url(#ar-${route.ld.includes(name) ? "blue" : "off"})`} />
            )}
            <RegisterBox name={name} bits={l.bits} x={l.x} y={l.y} value={regs[name]} pins={l.pins}
              isSrc={route.src === name} ld={route.ld.includes(name)} inr={route.inr.includes(name)}
              clr={route.clr.includes(name)} changed={changed.has(name)} />
          </g>
        );
      })}

      {/* Adder & logic + E */}
      <rect className={`box ${active("alu_ac") || active("alu_e") ? "on" : ""}`} data-component="alu" x={60} y={430} width={165} height={60} rx={6} />
      <text className="rname" x={72} y={456} style={{ fontSize: 15 }}>Adder and logic</text>
      <text className="rbits" x={72} y={474}>AC ± DR, AND, shift</text>
      <rect className={`reg ${route.ld.includes("E") || route.clr.includes("E") ? "dst" : ""}`} data-component="E" x={245} y={435} width={55} height={50} rx={6} />
      <text className="rbits" x={253} y={452}>E</text>
      <text className={`rval ${changed.has("E") ? "chg" : ""}`} x={272} y={474} textAnchor="middle">{regs.E}</text>

      {/* Direct wires */}
      {Object.entries(WIRES).map(([id, w]) => {
        const on = id === "sel" ? !!route.src : active(id);
        return <Wire key={id} id={id} d={w.d} on={on} color={w.color} />;
      })}

      {/* Control unit */}
      <g id="control-unit" data-component="control">
        <rect className="box" x={700} y={430} width={240} height={150} rx={6} />
        <text className="rname" x={712} y={456} style={{ fontSize: 15 }}>Control unit</text>
        <text className="label" x={712} y={482}>SC = {regs.SC}   timing T{regs.SC}</text>
        <text className="label" x={712} y={502}>I = {regs.I}   decoded D{opcode}</text>
        <text className="label" x={712} y={522}>opcode from IR(12–14)</text>
        <text className="label" x={712} y={546}>IEN {regs.IEN}  FGI {regs.FGI}  FGO {regs.FGO}  S {regs.S}</text>
      </g>

      {/* Bus multiplexer select */}
      <g id="mux" data-component="mux">
        <path className="wire" d={`M${BUS_X} 640 V650`} />
        <rect className={`box ${route.src ? "on" : ""}`} x={430} y={640} width={140} height={60} rx={6} />
        <text className="label" x={442} y={660}>S2 S1 S0</text>
        <text className="big" data-signal="select" x={442} y={686}>{sel}</text>
        <text className="label" x={530} y={686}>= {parseInt(sel, 2)}</text>
      </g>

      {/* Clock */}
      <text className="label" x={780} y={52}>clock</text>
      <path className={`wire ${running ? "on amber" : ""}`} d="M830 60 h15 v-20 h15 v20 h15 v-20 h15 v20 h15 v-20 h15 v20" markerEnd="none" />
    </svg>
  );
}
