export interface Preset { id: string; name: string; blurb: string; source: string }

export const PRESETS: Preset[] = [
  { id: "fetch", name: "Fetch + decode (CLA)", blurb: "The shortest complete cycle: T0, T1, decode, then a one-step register instruction.",
    source: "ORG 000\nCLA\nHLT" },
  { id: "direct", name: "Direct addressing: LDA, ADD, STA", blurb: "Memory-reference instructions skip T3 and go straight to execute.",
    source: "ORG 000\nLDA 100\nADD 101\nSTA 102\nHLT\nORG 100\nDEC 7\nDEC 5\nDEC 0" },
  { id: "indirect", name: "Indirect addressing: @ADD", blurb: "With I = 1, T3 reads the effective address out of memory first.",
    source: "ORG 000\nLDA 100\n@ADD 101\nHLT\nORG 100\nDEC 7\nHEX 102\nDEC 5" },
  { id: "branch", name: "Branch: BUN", blurb: "PC ← AR skips the three CLA instructions.",
    source: "ORG 000\nBUN 005\nCLA\nCLA\nCLA\nHLT\nINC\nHLT" },
  { id: "isz", name: "ISZ: increment and skip", blurb: "DR is incremented in the register, written back, and PC skips when it wraps to zero.",
    source: "ORG 000\nISZ 010\nHLT\nHLT\nORG 010\nHEX FFFF" },
  { id: "bsa", name: "BSA: subroutine call", blurb: "Saves the return address in memory, then branches past it.",
    source: "ORG 000\nBSA 010\nHLT\nORG 010\nDEC 0\nINC\nHLT" },
];
