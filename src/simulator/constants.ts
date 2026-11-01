export const MEMORY_SIZE = 4096;
export const MASK_1 = 0x1;
export const MASK_8 = 0xFF;
export const MASK_12 = 0xFFF;
export const MASK_16 = 0xFFFF;

export const INITIAL_REGISTERS = {
  AR: 0, PC: 0, DR: 0, AC: 0, IR: 0, TR: 0,
  INPR: 0, OUTR: 0, E: 0, I: 0, S: 1, IEN: 0,
  FGI: 0, FGO: 1, SC: 0,
} as const;
