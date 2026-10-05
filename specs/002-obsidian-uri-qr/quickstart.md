# Quickstart & Verification Guide: Obsidian URI Generation & QR Encoding

**Feature**: `specs/002-obsidian-uri-qr`  
**Date**: 2026-10-03  
**Status**: Ready for Verification

This guide outlines runnable verification scenarios to validate that Obsidian URI generation, RFC 3986 encoding, and optical QR generation function correctly end-to-end.

---

## 1. Prerequisites & Environment Setup

Verify Node.js (v18+) and install development dependencies:

```bash
node -v
npm test
```

All existing unit and integration tests must pass prior to feature verification.

---

## 2. Verification Scenarios

### Scenario 1: Standard Obsidian URI Generation (User Story 1 - P1 MVP)

**Objective**: Verify generation of standard `obsidian://open?vault=...&file=...` URIs without leading slashes.

**Execution**:
Run unit tests for standard URI generation:
```bash
npx jest tests/unit/uri.test.ts -t "Standard URI"
```

**Expected Outcome**:
- Vault `"Personal"` and path `"Workshop/Tools/Multimeter.md"` produce:
  `obsidian://open?vault=Personal&file=Workshop%2FTools%2FMultimeter.md`
- Root note path `"MyNote.md"` produces:
  `obsidian://open?vault=Personal&file=MyNote.md` (no leading `%2F`)

---

### Scenario 2: Special Characters, Spaces & Unicode Encoding (User Story 2 - P2)

**Objective**: Verify robust RFC 3986 percent-encoding across special characters, ampersands, slashes, and UTF-8 glyphs.

**Execution**:
Run unit tests for special characters and Unicode:
```bash
npx jest tests/unit/uri.test.ts -t "Special Characters"
```

**Expected Outcome**:
- Vault `"Work & Life"` and path `"Projects/C++ & Rust/Notes 2026.md"` produce:
  `obsidian://open?vault=Work%20%26%20Life&file=Projects%2FC%2B%2B%20%26%20Rust%2FNotes%202026.md`
- German/Emoji note `"München/Reiseführer 🇩🇪.md"` produces valid UTF-8 percent-sequences without character corruption or decoding faults.

---

### Scenario 3: QR Matrix Generation & Error Correction Levels (User Story 3 - P3)

**Objective**: Verify selectable error correction levels (L, M, Q, H) and matrix density changes.

**Execution**:
Run unit tests for QR options and matrix properties:
```bash
npx jest tests/unit/qr.test.ts -t "Error Correction"
```

**Expected Outcome**:
- Level L produces smaller module dimensions with ~7% recovery capacity.
- Level M (default) produces ~15% recovery capacity.
- Level H produces higher module density with up to 30% recovery capacity.
- `margin: 1` creates a 1-module quiet zone around the matrix.

---

### Scenario 4: Async QR Data URL Generation

**Objective**: Verify asynchronous raster Base64 PNG generation for previews and external rendering.

**Execution**:
Run data URL generator tests:
```bash
npx jest tests/unit/qr.test.ts -t "Data URL"
```

**Expected Outcome**:
- Output string starts with `data:image/png;base64,`.
- Generated image decodes back to the identical Obsidian URI payload.

---

### Scenario 5: Input Validation & Error Diagnostics

**Objective**: Verify strict input parameter validation rejects invalid configurations without exceptions.

**Execution**:
Run validation tests:
```bash
npx jest tests/unit/uri.test.ts -t "Validation"
```

**Expected Outcome**:
- Empty vault name returns `EMPTY_VAULT`.
- Empty file path returns `EMPTY_FILE_PATH`.
- Invalid error correction level returns `INVALID_EC_LEVEL`.

---

## 3. End-to-End Test Suite Execution

Run the complete test suite covering URI generation, QR matrix rendering, and full label generation:

```bash
npm test
npm run lint
npx tsc --noEmit
```

**Success Gate**: 100% test pass rate, 0 lint warnings/errors, and clean TypeScript compilation.
