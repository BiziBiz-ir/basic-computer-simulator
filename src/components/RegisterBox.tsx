export type Pin = "LD" | "INR" | "CLR";
export const REG_W = 240;
export const REG_H = 56;
const PIN_X: Record<Pin, number> = { LD: 92, INR: 122, CLR: 160 };

interface Props {
  name: string; bits: number; x: number; y: number; value: number;
  pins: Pin[]; isSrc: boolean; ld: boolean; inr: boolean; clr: boolean; changed: boolean;
}

export function RegisterBox({ name, bits, x, y, value, pins, isSrc, ld, inr, clr, changed }: Props) {
  const on: Record<Pin, boolean> = { LD: ld, INR: inr, CLR: clr };
  const state = ld || inr || clr ? "dst" : isSrc ? "src" : "";
  const hex = value.toString(16).toUpperCase().padStart(Math.ceil(bits / 4), "0");
  return (
    <g id={`reg-${name}`} data-reg={name} data-active={state || undefined} transform={`translate(${x},${y})`}>
      <rect className={`reg ${state}`} width={REG_W} height={REG_H} rx={6} />
      <text className="rname" x={12} y={24}>{name}</text>
      <text className="rbits" x={12} y={40}>{bits} bits</text>
      <text className={`rval ${changed ? "chg" : ""}`} x={REG_W - 12} y={32} textAnchor="end">{hex}</text>
      {pins.map((p) => (
        <text key={p} data-pin={`${name}.${p}`} className={`pin ${on[p] ? "on" : ""}`} x={PIN_X[p]} y={50}>{p}</text>
      ))}
      <text data-pin={`${name}.CLK`} className={`pin ${ld || inr || clr ? "on" : ""}`} x={REG_W - 38} y={50}>▷ clk</text>
    </g>
  );
}
