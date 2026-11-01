import type { InstructionName } from "./types";
import { encodeInstruction } from "./instructions";

export interface AssemblyResult {
  memory: Map<number, number>;
  startAddress: number;
  listing: { address: number; word: number; source: string }[];
}

const NAMES = new Set<InstructionName>([
  "AND","ADD","LDA","STA","BUN","BSA","ISZ",
  "CLA","CLE","CMA","CME","CIR","CIL","INC","SPA","SNA","SZA","SZE","HLT",
  "INP","OUT","SKI","SKO","ION","IOF"
]);

export function assemble(source: string): AssemblyResult {
  const memory = new Map<number, number>();
  const listing: AssemblyResult["listing"] = [];
  let address = 0;
  let startAddress = 0;
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.replace(/;.*/, "").trim();
    if (!line) continue;
    const org = line.match(/^ORG\s+([0-9A-F]+)$/i);
    if (org) { address = parseInt(org[1], 16); if (listing.length === 0) startAddress = address; continue; }
    if (address < 0 || address > 4095) throw new Error(`Line ${index + 1}: address out of range.`);
    const data = line.match(/^(DEC|HEX)\s+(-?[0-9A-F]+)$/i);
    let word: number;
    if (data) {
      word = data[1].toUpperCase() === "DEC" ? Number(data[2]) : parseInt(data[2], 16);
      if (!Number.isFinite(word)) throw new Error(`Line ${index + 1}: invalid data.`);
    } else {
      const match = line.match(/^(@?)([A-Z]+)(?:\s+([0-9A-F]+))?$/i);
      if (!match) throw new Error(`Line ${index + 1}: cannot parse "${raw}".`);
      const indirect = match[1] === "@";
      const name = match[2].toUpperCase() as InstructionName;
      if (!NAMES.has(name)) throw new Error(`Line ${index + 1}: unknown instruction ${name}.`);
      const operand = match[3] ? parseInt(match[3], 16) : 0;
      if (["AND","ADD","LDA","STA","BUN","BSA","ISZ"].includes(name)) {
        word = encodeInstruction(name, operand, indirect);
      } else {
        if (indirect || match[3]) throw new Error(`Line ${index + 1}: ${name} does not take an address.`);
        word = encodeInstruction(name);
      }
    }
    memory.set(address, word & 0xFFFF);
    listing.push({ address, word: word & 0xFFFF, source: raw.trim() });
    address++;
  }
  if (!listing.length) throw new Error("The program is empty.");
  return { memory, startAddress, listing };
}
