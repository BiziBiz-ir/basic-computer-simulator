import type { CPURegisters, MicroOperation, ExecutionStage, InstructionName } from "./types";
import { INITIAL_REGISTERS, MEMORY_SIZE, MASK_1, MASK_8, MASK_12, MASK_16 } from "./constants";
import { decodeInstruction } from "./instructions";

export class CPU {
  registers: CPURegisters = { ...INITIAL_REGISTERS };
  memory = new Uint16Array(MEMORY_SIZE);
  stage: ExecutionStage = "FETCH";
  currentOperation: MicroOperation | null = null;
  history: MicroOperation[] = [];
  halted = false;
  outputLog: number[] = [];
  private time = 0;
  private activeTime = 0;
  private instruction: InstructionName | null = null;
  private kind: "memory" | "register" | "io" = "memory";
  private interruptPending = false;

  step(): MicroOperation | null {
    if (this.halted) return null;
    let op: MicroOperation;
    this.activeTime = this.time;

    if (this.time === 0 && this.interruptPending && this.registers.IEN && (this.registers.FGI || this.registers.FGO)) {
      op = this.interruptCycle();
    } else if (this.time === 0) op = this.fetch0();
    else if (this.time === 1) op = this.fetch1();
    else if (this.time === 2) op = this.decode();
    else if (this.time === 3 && this.registers.I && this.kind === "memory") op = this.indirect();
    else op = this.execute();

    this.registers.SC = this.time & 0xF;
    this.currentOperation = op;
    this.history.push(op);
    return op;
  }

  private make(label: string, description: string, stage: ExecutionStage, changed: string[] = []): MicroOperation {
    return { label, description, stage, time: `T${this.activeTime}`, changed };
  }

  private fetch0(): MicroOperation {
    this.registers.AR = this.registers.PC & MASK_12;
    this.stage = "FETCH"; this.time = 1;
    return this.make("AR ← PC", "Copy the program counter into the address register.", "FETCH", ["AR"]);
  }

  private fetch1(): MicroOperation {
    this.registers.IR = this.memory[this.registers.AR];
    this.registers.PC = (this.registers.PC + 1) & MASK_12;
    this.stage = "FETCH"; this.time = 2;
    return this.make("IR ← M[AR], PC ← PC + 1", "Fetch the instruction word and advance the program counter.", "FETCH", ["IR", "PC"]);
  }

  private decode(): MicroOperation {
    const d = decodeInstruction(this.registers.IR);
    this.instruction = d.instruction; this.kind = d.kind;
    this.registers.I = d.indirect ? 1 : 0;
    if (d.kind === "memory") this.registers.AR = d.address;
    this.stage = "DECODE";
    // Indirect memory references perform T3; direct references skip it and begin at T4.
    this.time = d.kind === "memory" ? (d.indirect ? 3 : 4) : 3;
    return this.make(`Decode ${d.instruction}`, `Opcode decoded as ${d.instruction}. ${d.kind === "memory" ? `Address ${d.address}; ${d.indirect ? "indirect" : "direct"} addressing.` : `${d.kind}-reference instruction.`}`, "DECODE", ["AR", "I"]);
  }

  private indirect(): MicroOperation {
    this.registers.AR = this.memory[this.registers.AR] & MASK_12;
    this.stage = "INDIRECT"; this.time = 4;
    return this.make("AR ← M[AR](0–11)", "Read the effective address from the memory word addressed by AR.", "INDIRECT", ["AR"]);
  }

  private finish(label: string, description: string, changed: string[] = []): MicroOperation {
    const op = this.make(label, description, "EXECUTE", changed);
    this.time = 0; this.registers.SC = 0; this.instruction = null;
    return op;
  }

  private execute(): MicroOperation {
    const name = this.instruction;
    if (!name) throw new Error("No decoded instruction is ready to execute.");
    this.stage = "EXECUTE";
    const address = this.registers.AR;

    switch (name) {
      case "AND":
        if (this.time === 4) {
          this.registers.DR = this.memory[address]; this.time++;
          return this.make("DR ← M[AR]", "Read the operand from memory into DR.", "EXECUTE", ["DR"]);
        }
        this.registers.AC &= this.registers.DR;
        return this.finish("AC ← AC ∧ DR", "AND the accumulator with the operand.", ["AC", "SC"]);
      case "ADD":
        if (this.time === 4) {
          this.registers.DR = this.memory[address]; this.time++;
          return this.make("DR ← M[AR]", "Read the operand from memory into DR.", "EXECUTE", ["DR"]);
        } else {
          const sum = this.registers.AC + this.registers.DR;
          this.registers.AC = sum & MASK_16;
          this.registers.E = (sum >>> 16) & MASK_1;
          return this.finish("AC ← AC + DR, E ← Cout", "Add DR to AC; E receives the carry-out.", ["AC", "E", "SC"]);
        }
      case "LDA":
        if (this.time === 4) {
          this.registers.DR = this.memory[address]; this.time++;
          return this.make("DR ← M[AR]", "Read the operand from memory into DR.", "EXECUTE", ["DR"]);
        }
        this.registers.AC = this.registers.DR;
        return this.finish("AC ← DR", "Copy the memory operand into AC.", ["AC", "SC"]);
      case "STA":
        this.memory[address] = this.registers.AC;
        return this.finish("M[AR] ← AC", "Store the accumulator in memory.", ["Memory", "SC"]);
      case "BUN":
        this.registers.PC = address;
        return this.finish("PC ← AR", "Branch unconditionally to the effective address.", ["PC", "SC"]);
      case "BSA":
        if (this.time === 4) {
          this.memory[address] = this.registers.PC;
          this.registers.AR = (address + 1) & MASK_12;
          this.time++;
          return this.make("M[AR] ← PC, AR ← AR + 1", "Save the return address, then point to the first subroutine instruction.", "EXECUTE", ["Memory", "AR"]);
        }
        this.registers.PC = this.registers.AR;
        return this.finish("PC ← AR", "Branch to the subroutine.", ["PC", "SC"]);
      case "ISZ":
        if (this.time === 4) {
          this.registers.DR = this.memory[address]; this.time++;
          return this.make("DR ← M[AR]", "Read the memory word to increment.", "EXECUTE", ["DR"]);
        }
        if (this.time === 5) {
          this.registers.DR = (this.registers.DR + 1) & MASK_16; this.time++;
          return this.make("DR ← DR + 1", "Increment the value in DR.", "EXECUTE", ["DR"]);
        }
        this.memory[address] = this.registers.DR;
        if (this.registers.DR === 0) this.registers.PC = (this.registers.PC + 1) & MASK_12;
        return this.finish("M[AR] ← DR; if zero, PC ← PC + 1", "Store the incremented value and skip the next instruction if it wrapped to zero.", ["Memory", "PC", "SC"]);
      default:
        return this.executeNonMemory(name);
    }
  }

  private executeNonMemory(name: InstructionName): MicroOperation {
    const r = this.registers;
    const done = (label: string, desc: string, changed: string[] = []) => this.finish(label, desc, changed);
    switch (name) {
      case "CLA": r.AC = 0; return done("AC ← 0", "Clear the accumulator.", ["AC", "SC"]);
      case "CLE": r.E = 0; return done("E ← 0", "Clear the E flip-flop.", ["E", "SC"]);
      case "CMA": r.AC = (~r.AC) & MASK_16; return done("AC ← AC′", "Complement every bit of AC.", ["AC", "SC"]);
      case "CME": r.E ^= 1; return done("E ← E′", "Complement E.", ["E", "SC"]);
      case "CIR": { const bit = r.AC & 1; r.AC = (r.AC >>> 1) | (r.E << 15); r.E = bit; return done("Circulate right", "Rotate AC and E one bit to the right.", ["AC", "E", "SC"]); }
      case "CIL": { const bit = (r.AC >>> 15) & 1; r.AC = ((r.AC << 1) & MASK_16) | r.E; r.E = bit; return done("Circulate left", "Rotate AC and E one bit to the left.", ["AC", "E", "SC"]); }
      case "INC": r.AC = (r.AC + 1) & MASK_16; return done("AC ← AC + 1", "Increment AC.", ["AC", "SC"]);
      case "SPA": if ((r.AC & 0x8000) === 0) r.PC = (r.PC + 1) & MASK_12; return done("If AC ≥ 0, skip", "Skip the next instruction when AC is non-negative.", ["PC", "SC"]);
      case "SNA": if (r.AC & 0x8000) r.PC = (r.PC + 1) & MASK_12; return done("If AC < 0, skip", "Skip the next instruction when AC is negative.", ["PC", "SC"]);
      case "SZA": if (r.AC === 0) r.PC = (r.PC + 1) & MASK_12; return done("If AC = 0, skip", "Skip the next instruction when AC is zero.", ["PC", "SC"]);
      case "SZE": if (r.E === 0) r.PC = (r.PC + 1) & MASK_12; return done("If E = 0, skip", "Skip the next instruction when E is zero.", ["PC", "SC"]);
      case "HLT": r.S = 0; this.halted = true; this.stage = "HALTED"; this.time = 0; r.SC = 0; return this.make("S ← 0 (HLT)", "Halt the computer. Use Reset to run again.", "HALTED", ["S", "SC"]);
      case "INP": r.AC = (r.AC & 0xFF00) | r.INPR; r.FGI = 0; return done("AC(0–7) ← INPR; FGI ← 0", "Transfer the input register to the low byte of AC.", ["AC", "FGI", "SC"]);
      case "OUT": r.OUTR = r.AC & MASK_8; r.FGO = 0; this.outputLog.push(r.OUTR); return done("OUTR ← AC(0–7); FGO ← 0", "Send the low byte of AC to the output register.", ["OUTR", "FGO", "SC"]);
      case "SKI": if (r.FGI) r.PC = (r.PC + 1) & MASK_12; return done("If FGI = 1, skip", "Skip when input data is ready.", ["PC", "SC"]);
      case "SKO": if (r.FGO) r.PC = (r.PC + 1) & MASK_12; return done("If FGO = 1, skip", "Skip when the output device is ready.", ["PC", "SC"]);
      case "ION": r.IEN = 1; return done("IEN ← 1", "Enable interrupts.", ["IEN", "SC"]);
      case "IOF": r.IEN = 0; return done("IEN ← 0", "Disable interrupts.", ["IEN", "SC"]);
      default: throw new Error(`Execution not implemented for ${name}`);
    }
  }

  private interruptCycle(): MicroOperation {
    this.stage = "INTERRUPT";
    this.registers.AR = 0;
    this.memory[0] = this.registers.PC;
    this.registers.PC = 1;
    this.registers.IEN = 0;
    this.interruptPending = false;
    this.time = 0;
    return { label: "Interrupt: M[0] ← PC; PC ← 1", description: "Save the return address in memory location 0 and branch to the interrupt service routine at address 1.", stage: "INTERRUPT", time: "INT", changed: ["AR", "Memory", "PC", "IEN"] };
  }

  loadMemory(address: number, value: number): void {
    this.checkAddress(address); this.memory[address] = value & MASK_16;
  }
  getMemory(address: number): number { this.checkAddress(address); return this.memory[address]; }
  setInput(value: number): void { this.registers.INPR = value & MASK_8; this.registers.FGI = 1; }
  requestInterrupt(): void { this.interruptPending = true; }
  setPC(value: number): void { this.registers.PC = value & MASK_12; }
  private checkAddress(address: number): void {
    if (!Number.isInteger(address) || address < 0 || address >= MEMORY_SIZE) throw new Error("Invalid memory address.");
  }
  reset(clearMemory = true): void {
    this.registers = { ...INITIAL_REGISTERS };
    if (clearMemory) this.memory.fill(0);
    this.stage = "FETCH"; this.currentOperation = null; this.history = [];
    this.halted = false; this.outputLog = []; this.time = 0; this.activeTime = 0;
    this.instruction = null; this.kind = "memory"; this.interruptPending = false;
  }
}
