import type { DecodedInstruction, InstructionName } from "./types";

const MEMORY_OPS: Record<number, InstructionName> = {
  0: "AND", 1: "ADD", 2: "LDA", 3: "STA",
  4: "BUN", 5: "BSA", 6: "ISZ",
};

const REGISTER_OPS: Record<number, InstructionName> = {
  0x7800: "CLA", 0x7400: "CLE", 0x7200: "CMA",
  0x7100: "CME", 0x7080: "CIR", 0x7040: "CIL",
  0x7020: "INC", 0x7010: "SPA", 0x7008: "SNA",
  0x7004: "SZA", 0x7002: "SZE", 0x7001: "HLT",
};

const IO_OPS: Record<number, InstructionName> = {
  0xF800: "INP", 0xF400: "OUT", 0xF200: "SKI",
  0xF100: "SKO", 0xF080: "ION", 0xF040: "IOF",
};

export function decodeInstruction(ir: number): DecodedInstruction {
  const opcode = (ir >>> 12) & 0x7;
  const indirect = (ir & 0x8000) !== 0;
  const address = ir & 0x0FFF;

  if (opcode !== 7) {
    const instruction = MEMORY_OPS[opcode];
    if (!instruction) throw new Error(`Unsupported memory opcode ${opcode}`);
    return { opcode, instruction, indirect, address, kind: "memory" };
  }

  if (indirect) {
    const ioWord = ir & 0xFFFF;
    const ioInstruction = IO_OPS[ioWord];
    if (ioInstruction) {
      return { opcode, instruction: ioInstruction, indirect: false, address: 0, kind: "io" };
    }
  } else {
    const registerWord = ir & 0x7FFF;
    const registerInstruction = REGISTER_OPS[registerWord];
    if (registerInstruction) {
      return { opcode, instruction: registerInstruction, indirect: false, address: 0, kind: "register" };
    }
  }

  throw new Error(`Unsupported instruction word: 0x${ir.toString(16).padStart(4, "0")}`);
}

export function encodeInstruction(name: InstructionName, address = 0, indirect = false): number {
  const memoryOpcode: Partial<Record<InstructionName, number>> = {
    AND: 0, ADD: 1, LDA: 2, STA: 3, BUN: 4, BSA: 5, ISZ: 6,
  };
  if (name in memoryOpcode) {
    if (!Number.isInteger(address) || address < 0 || address > 0xFFF) {
      throw new Error("Address must be an integer between 0 and 4095.");
    }
    return ((indirect ? 1 : 0) << 15) | (memoryOpcode[name]! << 12) | address;
  }

  const reverseRegister = Object.entries(REGISTER_OPS).find(([, value]) => value === name);
  if (reverseRegister) return Number(reverseRegister[0]);

  const reverseIo = Object.entries(IO_OPS).find(([, value]) => value === name);
  if (reverseIo) return Number(reverseIo[0]);

  throw new Error(`Cannot encode ${name}`);
}

export function formatWord(value: number): string {
  return `0x${(value & 0xFFFF).toString(16).toUpperCase().padStart(4, "0")}`;
}
