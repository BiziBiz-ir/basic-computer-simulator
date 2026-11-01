# Mano — Basic Computer Simulator

A static, browser-based learning simulator for Mano's Basic Computer. It uses React, TypeScript and Vite; no backend is required.

## Requirements

- Node.js 18.18+ (Node 20 LTS recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

The generated static site is in `dist/`. You can share the `dist/` folder or deploy it to any static host.

## Assembly editor syntax

- `ORG 000` — set the next memory address (hexadecimal).
- `LDA 100`, `ADD 101`, `STA 102` — memory-reference instruction.
- `@LDA 100` — indirect memory-reference instruction.
- `CLA`, `CMA`, `HLT`, `ION`, `INP`, etc. — register-reference or I/O instruction.
- `DEC 25` — store decimal data.
- `HEX 00FF` — store hexadecimal data.
- `;` begins a comment.

Addresses in the editor are hexadecimal. `DEC` values are decimal; `HEX` values are hexadecimal.

## Included instruction groups

Memory reference: AND, ADD, LDA, STA, BUN, BSA, ISZ.

Register reference: CLA, CLE, CMA, CME, CIR, CIL, INC, SPA, SNA, SZA, SZE, HLT.

Input/output: INP, OUT, SKI, SKO, ION, IOF.

## Notes about the model

This is an educational micro-operation simulator, not a cycle-accurate hardware emulator. It models the textbook register transfers for the listed instructions and the basic interrupt entry sequence. The I/O devices are represented by simple input/output registers and flags. The simulator deliberately keeps the interface focused on the instruction cycle.
