# Phase 0: Research & Technical Decisions - Core Label Generation Engine

**Feature**: Core Label Generation Engine  
**Directory**: `specs/001-label-generation-engine`  
**Date**: 2026-09-25  

## Research Topics & Decisions

### 1. Rendering Architecture & Engine

- **Decision**: Use standard HTML5 2D Canvas API (`CanvasRenderingContext2D`) created dynamically in-memory (`document.createElement('canvas')`).
- **Rationale**:
  - Obsidian runs within Electron/Chromium, providing full, hardware-accelerated access to the standard HTML5 Canvas API without any external native binaries.
  - Canvas provides precise mathematical sub-pixel drawing, direct physical-to-pixel DPI coordinate mapping, and native typography metric measurement (`ctx.measureText()`).
  - Output can be directly exported to high-resolution PNG data URLs (`canvas.toDataURL('image/png')`) for zero-latency UI preview rendering.
  - Matches Constitution Principle I (Privacy First) and Principle III (Minimal External Dependencies) by relying exclusively on client runtime capabilities.
- **Alternatives Considered**:
  - *SVG*: Vector-based, but computing dynamic multi-line word wrapping and font bounding boxes requires rendering into the DOM, making headless and offscreen unit testing slower and more brittle across Obsidian themes.
  - *DOM-to-Image / html2canvas*: Heavyweight, introduces CSS inheritance quirks from Obsidian's active theme, and produces unpredictable print artifacts.
  - *Server-side / Headless Chrome*: Violates offline and local-first requirements.

### 2. QR Code Generation Strategy

- **Decision**: Adopt a lightweight, pure TypeScript/JavaScript QR code generator (`qrcode` library or self-contained TS port) operating purely in-memory.
- **Rationale**:
  - Pure JS/TS implementation runs completely offline with 0 external network requests, adhering to Constitution Principle I (Privacy First).
  - Encodes direct `obsidian://` URIs with configurable Error Correction Levels (L, M, Q, H), defaulting to Level M (~15% damage recovery) as determined in spec clarification Q3.
  - Directly outputs a boolean matrix or draws module rectangles straight onto the 2D canvas context.
  - Self-contained bundle size is minimal (<30KB) with zero native Node.js addons, ensuring cross-platform compatibility across Windows, macOS, and Linux.
- **Alternatives Considered**:
  - *External QR Web APIs (e.g. Google Charts, QRServer)*: Strictly rejected due to privacy violations, offline failure, and network dependency.
  - *Native C++ bindings (node-qrcode with libpng)*: Rejected because native compilation breaks cross-platform distribution and violates Obsidian Community Plugin guidelines.

### 3. Client-Side PDF Generation

- **Decision**: Use `jspdf` (pure JavaScript client-side PDF document generation) in millimeters mode.
- **Rationale**:
  - Generates valid, universal PDF 1.4/1.7 documents directly in-memory as `ArrayBuffer` / `Uint8Array`.
  - Supports custom page dimensions specified in millimeters (`new jsPDF({ unit: 'mm', format: [widthMm, heightMm], orientation: widthMm >= heightMm ? 'landscape' : 'portrait' })`).
  - High-DPI canvas raster output can be embedded directly via `doc.addImage(canvasDataUrl, 'PNG', 0, 0, widthMm, heightMm)`.
  - Pure JavaScript execution guarantees zero native dependencies and 100% offline cross-platform operation.
- **Alternatives Considered**:
  - *pdfmake*: Significantly larger bundle size and requires custom VFS font bundling for basic text.
  - *Electron `webContents.printToPDF`*: Requires active BrowserWindow context, cannot be executed cleanly in headless unit test suites, and introduces async IPC overhead.
  - *Browser `window.print()`*: Prompts the user with an interactive OS print modal rather than delivering raw PDF document data required by downstream export/helper features (violating FR-012).

### 4. Physical Dimension to Pixel Scaling & DPI Math

- **Decision**: Enforce standard print graphics formula:
  $$\text{pixels} = \text{round}\left(\frac{\text{millimeters}}{25.4} \times \text{DPI}\right)$$
  Defaulting to 300 DPI (print resolution standard for thermal and inkjet label printers).
- **Rationale**:
  - $1\text{ inch} = 25.4\text{ millimeters}$.
  - At 300 DPI:
    - Phomemo (40mm × 30mm) $\to 472\text{px} \times 354\text{px}$
    - Dymo (89mm × 28mm) $\to 1051\text{px} \times 331\text{px}$
    - Brother (62mm × 100mm) $\to 732\text{px} \times 1181\text{px}$
    - Avery 5160 (66.7mm × 25.4mm) $\to 788\text{px} \times 300\text{px}$
  - Ensures accurate physical print dimensions within 0.5mm tolerance (SC-003).

### 5. Multi-line Typography, Dynamic Scaling, and Truncation

- **Decision**: Implement a deterministic two-pass layout calculation:
  1. **Region Allocation**: Subtract configured physical margins and QR code bounding box from the total canvas rectangle based on `qrCodePlacement` ('left' | 'right' | 'top' | 'bottom' | 'center').
  2. **Word Wrap & Measurement**: Break title and metadata text into lines using `ctx.measureText()`.
  3. **Font Size Scaling**: If text height exceeds the allocated region, decrease font size incrementally (step: 0.5pt) until text fits or reaches `minFontSize` (6pt).
  4. **Boundary Truncation**: If text still overflows at `minFontSize`, truncate the final visible line with an ellipsis (`...`) and omit any overflow lines.
- **Rationale**: Guarantees that titles up to 120 characters fit without overlapping borders or QR codes (SC-005).

### 6. Validation & Error Handling Contract

- **Decision**: Pre-execution validation pass returning a typed `ValidationResult` object:
  ```typescript
  interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
  }
  ```
- **Rationale**:
  - Prevents unexpected rendering crashes.
  - Supplies calling UI modals with actionable, field-level error messages (e.g. invalid color format, zero dimension, margins exceeding size).
  - Directly matches specification clarification Q2.
