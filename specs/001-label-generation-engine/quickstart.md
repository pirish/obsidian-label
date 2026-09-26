# Quickstart & Validation Guide: Core Label Generation Engine

**Feature**: Core Label Generation Engine  
**Directory**: `specs/001-label-generation-engine`  
**Date**: 2026-09-25  

This guide provides step-by-step instructions to validate that the Core Label Generation Engine functions correctly, meets the acceptance criteria in [spec.md](./spec.md), and complies with the data model in [data-model.md](./data-model.md) and interface contracts in [contracts/label-engine-api.ts](./contracts/label-engine-api.ts).

---

## 1. Prerequisites & Setup

Ensure Node.js ($\ge 18$) and npm are installed.

```bash
# Verify environment
node -v
npm -v
```

Dependencies required by the core engine:
- `typescript`
- `jest` + `ts-jest` (for automated unit & coordinate testing)
- `canvas` or browser-compatible mock (for offscreen headless test execution)
- `qrcode` (pure TypeScript/JS QR matrix generator)
- `jspdf` (client-side PDF document generator)

---

## 2. Automated Test Execution

Run the complete test suite verifying dimension scaling, layout calculation, QR encoding, and PDF generation:

```bash
# Run all unit tests
npm test

# Run specifically the label generator engine test suite
npx jest tests/unit/generator.test.ts --verbose
```

### Expected Test Suite Outcomes

1. **DPI Resolution Math**:
   - `40mm x 30mm` at 300 DPI yields exactly $472 \times 354$ pixels.
   - `89mm x 28mm` at 300 DPI yields exactly $1051 \times 331$ pixels.
2. **Validation Rules**:
   - Rejects non-positive dimensions ($w \le 0$ or $h \le 0$) with code `INVALID_DIMENSIONS`.
   - Rejects non-Obsidian URIs (e.g. `http://...`) with code `INVALID_URI_SCHEME`.
   - Rejects margins exceeding total width/height with code `MARGINS_EXCEED_BOUNDS`.
3. **Dual Output Generation**:
   - `previewDataUrl` starts with `data:image/png;base64,`.
   - `pdfData` begins with PDF magic bytes `%PDF-1.`.
4. **Text Wrapping & Typography**:
   - 120-character note title wraps across multiple lines and scales down font size without clipping or overlapping the QR code region.
5. **QR Code Verification**:
   - Decodes generated QR code using a QR decoder; verified payload matches input `obsidianUri` verbatim.

---

## 3. End-to-End Validation Scenarios

### Scenario A: Generate Standard Phomemo Storage Bin Label (P1 MVP Flow)

**Input Configuration**:
```typescript
import { LabelGenerator } from '../src/generator/label-generator';

const generator = new LabelGenerator();
const preset = generator.getPreset('phomemo-40x30')!;

const result = await generator.generate(
  { size: preset.size, layout: preset.defaultLayout },
  {
    noteTitle: 'Workshop Multimeter',
    obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter',
    notePath: 'Equipment/Multimeter.md'
  }
);
```

**Verification**:
- `result.previewDataUrl` renders an image $472 \times 354$ pixels.
- QR code is placed on the left side, occupying ~65% of the label height.
- Scanning the QR code with a mobile camera opens `obsidian://open?vault=Personal&file=Equipment%2FMultimeter`.
- `result.pdfData` contains a valid single-page PDF document measuring $40\text{mm} \times 30\text{mm}$.

---

### Scenario B: Custom Dimensions with Metadata Key-Value Pairs (P2 Flow)

**Input Configuration**:
```typescript
const result = await generator.generate(
  {
    size: { width: 60, height: 40, dpi: 300 },
    layout: {
      qrCodePlacement: 'right',
      textAlignment: 'left',
      metadataOrientation: 'vertical',
      metadataSeparator: ': '
    },
    style: {
      fontFamily: 'sans-serif',
      fontSize: 14,
      borderWidth: 2,
      borderColor: '#333333'
    }
  },
  {
    noteTitle: 'Project Falcon PCB',
    obsidianUri: 'obsidian://open?vault=Work&file=Hardware%2FFalcon',
    customFields: {
      'Location': 'Bin 4A',
      'Batch': '2026-Q3'
    }
  }
);
```

**Verification**:
- QR code appears on the right; title and metadata appear on the left.
- "Location: Bin 4A" and "Batch: 2026-Q3" render neatly stacked below the title in secondary typography.
- A 2px dark border surrounds the perimeter.

---

### Scenario C: Validation Rejection Handling

**Input Configuration**:
```typescript
const validation = generator.validate(
  {
    size: { width: -10, height: 30, dpi: 300 }
  },
  {
    noteTitle: '',
    obsidianUri: 'https://example.com/unsupported'
  }
);
```

**Verification**:
- `validation.isValid` is `false`.
- `validation.errors` contains three distinct diagnostic items:
  1. `field: 'size.width'`, `code: 'INVALID_DIMENSIONS'`
  2. `field: 'noteTitle'`, `code: 'EMPTY_TITLE'`
  3. `field: 'obsidianUri'`, `code: 'INVALID_URI_SCHEME'`
- No unhandled exceptions are thrown.
