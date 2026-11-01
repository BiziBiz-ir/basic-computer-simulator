export type RegisterName =
  | "AR" | "PC" | "DR" | "AC" | "IR" | "TR"
  | "INPR" | "OUTR" | "E" | "I" | "S" | "IEN"
  | "FGI" | "FGO" | "SC";

export interface CPURegisters {
  AR: number; PC: number; DR: number; AC: number;
  IR: number; TR: number; INPR: number; OUTR: number;
  E: number; I: number; S: number; IEN: number;
  FGI: number; FGO: number; SC: number;
}

export type InstructionName =
  | "AND" | "ADD" | "LDA" | "STA" | "BUN" | "BSA" | "ISZ"
  | "CLA" | "CLE" | "CMA" | "CME" | "CIR" | "CIL" | "INC"
  | "SPA" | "SNA" | "SZA" | "SZE" | "HLT"
  | "INP" | "OUT" | "SKI" | "SKO" | "ION" | "IOF";

export type ExecutionStage =
  | "FETCH" | "DECODE" | "INDIRECT" | "EXECUTE"
  | "INTERRUPT" | "HALTED";

export interface MicroOperation {
  label: string;
  description: string;
  stage: ExecutionStage;
  time: string;
  changed?: string[];
}

export interface DecodedInstruction {
  opcode: number;
  instruction: InstructionName;
  indirect: boolean;
  address: number;
  kind: "memory" | "register" | "io";
}
