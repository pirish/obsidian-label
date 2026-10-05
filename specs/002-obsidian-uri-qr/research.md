# Research: Obsidian URI Generation & QR Encoding

**Feature**: `specs/002-obsidian-uri-qr`  
**Date**: 2026-10-03  
**Status**: Completed

## 1. Obsidian URI Specification & Encoding Nuances

### Context & Requirements
- **FR-001 & FR-002**: Construct standard `obsidian://open?vault=<vault-name>&file=<path>` URIs.
- In-app execution should leverage Obsidian's native API: `app.getObsidianUrl(file: TFile)`.
- Headless testing and standalone execution need an RFC 3986-compliant fallback generator (`generateObsidianURI(vault: string, filePath: string)`).
- Handle spaces, nested directories, non-ASCII Unicode characters, and special punctuation (`&`, `+`, `=`, `#`, `^`).

### Research Findings
1. **Obsidian Core URI Protocol**:
   - Format: `obsidian://open?vault=<encoded-vault>&file=<encoded-path>`
   - `vault`: Name of the vault (not the absolute filesystem path).
   - `file`: Path relative to the vault root (e.g. `Technology/Projects/MyNote.md` or `MyNote.md`).
   - Leading slashes: Must NOT have leading slashes (e.g., `file=Notes%2FItem.md`, not `file=%2FNotes%2FItem.md`). Obsidian mobile and desktop fail to open paths with leading slashes properly on certain platforms.
   - Extension: `.md` is supported and preserved by Obsidian's URI handler.
   - Anchor / Subpath: Headings (`#Heading`) or block references (`^blockid`) can be appended to the path or as a separate parameter in Obsidian. Appending to `file` (e.g., `file=Notes%2FItem.md%23Section`) or passing as subpath works with standard Obsidian URI handlers.
2. **Native Obsidian API**:
   - `app.getObsidianUrl(file: TFile)`: Returns the canonical `obsidian://open?vault=...&file=...` URL directly from the active vault context.
   - For standalone environments (Jest unit tests, CLI runs where `app` is unavailable), an offline fallback utility must replicate this exact encoding.
3. **Percent-Encoding (RFC 3986)**:
   - JavaScript's standard `encodeURIComponent` does NOT encode `!`, `'`, `(`, `)`, or `*`.
   - To adhere strictly to standard URI encoding and avoid query parameter breakage:
     ```typescript
     function encodeURIParam(str: string): string {
       return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
     }
     ```
   - Path separators: Within query parameter values, `/` MUST be encoded as `%2F` so URI parsers do not interpret slashes as path segment delimiters of the outer scheme.

### Decision
- **In-App**: Use `app.getObsidianUrl(file)` when an `App` or `TFile` is provided.
- **Fallback**: Implement `generateObsidianURI(vault: string, filePath: string, options?: ObsidianURIOptions): string` using RFC 3986 compliant encoding.
- **Path Sanitization**: Strip leading/trailing slashes from relative file paths. Throw clear validation errors if `vault` or `filePath` is empty or non-string.

---

## 2. QR Code Generation & Library Capabilities

### Context & Requirements
- **FR-004 & FR-005**: Pure local generation with `qrcode` npm library, zero network requests.
- Error Correction Levels: L (~7%), M (~15%), Q (~25%), H (~30%). Default to M.
- **FR-006 & FR-007**: Configurable quiet zone margin (minimum 1 module) and scaling.
- **FR-008 & FR-010**: Dual delivery (canvas drawing commands and base64 data URLs) with dark/light contrast customization.

### Research Findings
1. **`qrcode` Library Features**:
   - Package `qrcode` (v1.5.4) is a pure JavaScript/TypeScript library with zero native C/C++ dependencies.
   - `QRCode.create(text, options)`: Returns a structured QR object containing the module matrix, version, and error correction level.
   - `QRCode.toDataURL(text, options)`: Returns a `data:image/png;base64,...` URL.
   - `QRCode.toString(text, { type: 'svg' })`: Generates vector SVG markup.
2. **Existing Implementation Review (`src/core/qr.ts`)**:
   - `generateQRMatrix(text, options)` already generates an in-memory `QRMatrix` abstraction with `size`, `isDark(row, col)`, and `errorCorrectionLevel`.
   - `drawQRMatrix(ctx, matrix, x, y, size, darkColor, lightColor)` draws the matrix directly to HTML5 Canvas.
   - Gaps to satisfy Feature 002:
     - No direct async `generateQRDataURL(text, options)` helper for standalone base64 exports.
     - `QROptions` validation in `validator.ts` is minimal (does not currently validate margin or error correction level enum).
     - Need helper `generateObsidianURI` that wires directly to `generateQRMatrix` and `generateQRDataURL`.

### Decision
- Extend `src/core/qr.ts` to export:
  - `generateQRMatrix(text: string, options?: QROptions): QRMatrix` (preserve existing synchronous API)
  - `generateQRDataURL(text: string, options?: QRDataURLOptions): Promise<string>` (for async raster data URL export)
  - `drawQRMatrix(...)` (preserve optimized subpixel-aligned canvas drawing)
- Update `src/core/validator.ts` to strictly validate `QRErrorCorrectionLevel` (`'L' | 'M' | 'Q' | 'H'`) and non-negative `margin`.

---

## 3. Optical Scannability, Margins & Contrast

### Context & Requirements
- **FR-006 & FR-007**: Scale QR code dimensions while ensuring minimum module dimensions for smartphone autofocus.
- **FR-008**: High contrast ratios (dark on light).
- **SC-002**: 100% scan rate on iOS Camera and Android Google Lens.
- **SC-005**: Level H error correction survives up to 25% physical symbol occlusion.

### Research Findings
1. **Minimum Physical Module Size**:
   - For smartphone cameras focusing at 10–15 cm, each QR module should be at least 0.35 mm (approx. 4.1 pixels at 300 DPI) for reliable optical scanning.
   - Standard Obsidian URI string length is typically 60–120 characters:
     - Version 4–6 QR code (33x33 to 41x41 modules).
     - At Level M (15% error correction), a 90-char URI requires a Version 5 code (37x37 modules).
     - On a 25mm x 25mm label area, each module is ~0.67 mm, well above the 0.35 mm minimum optical threshold.
2. **Quiet Zone (Margin)**:
   - ISO/IEC 18004 specifies a 4-module quiet zone for open scanning.
   - However, for high-contrast thermal labels with known white background boundaries, a 1-module or 2-module margin is widely supported by modern mobile camera decoders (ZXing, Apple Vision, Google ML Kit).
   - Defaulting `margin: 1` or `2` maximizes the physical size of individual modules within compact physical labels.
3. **Contrast Requirements**:
   - Dark modules (`#000000` or deep dark hex) on light background (`#FFFFFF` or white/transparent).
   - Barcode scanners convert RGB to grayscale luminance: $Y = 0.299R + 0.587G + 0.114B$. A minimum contrast ratio of 4:1 (ideally > 10:1) is required.

### Decision
- Default `errorCorrectionLevel` to `'M'`. Provide user option to select `'H'` for harsh/industrial environments.
- Provide configurable `margin` defaulting to `1`.
- Provide dark color defaulting to `'#000000'` and light color defaulting to `'#FFFFFF'`.

---

## 4. Vault Reorganization Strategy

### Context & Requirements
- Users may move notes to different folders or rename notes.
- Physical labels, once printed on thermal or paper stock, have permanent ink.

### Research Findings & Clarification Outcome
- As confirmed in `/speckit-clarify` session:
  - Standard Obsidian URIs encode the exact relative path (`file=Path/To/Note.md`).
  - Physical QR codes encode this static URI.
  - When notes are renamed or relocated across folders, reference integrity is maintained by regenerating and reprinting the physical label (aligning with Constitution Principle V).
  - Dynamic in-situ redirection across renames without reprinting is explicitly out of scope for the static QR generator.

### Decision
- Document this boundary clearly in `data-model.md`, `contracts/`, and `quickstart.md`.
