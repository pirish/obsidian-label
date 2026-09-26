# Phase 1: Data Model - Core Label Generation Engine

**Feature**: Core Label Generation Engine  
**Directory**: `specs/001-label-generation-engine`  
**Date**: 2026-09-25  

## Entities & Type Definitions

### 1. LabelSize

Defines the physical target dimensions and rendering resolution of the label.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `width` | `number` | Yes | — | $> 0$, typically $20 \le \text{width} \le 300$ | Physical label width in millimeters |
| `height` | `number` | Yes | — | $> 0$, typically $10 \le \text{height} \le 300$ | Physical label height in millimeters |
| `dpi` | `number` | No | `300` | $\ge 72$, recommended `300` | Target print resolution in dots-per-inch |

---

### 2. LabelMargins

Defines the non-printable or safety boundary around the perimeter of the label in millimeters.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `top` | `number` | No | `2.0` | $\ge 0$, $\text{top} + \text{bottom} < \text{height}$ | Top margin in millimeters |
| `right` | `number` | No | `2.0` | $\ge 0$, $\text{left} + \text{right} < \text{width}$ | Right margin in millimeters |
| `bottom` | `number` | No | `2.0` | $\ge 0$, $\text{top} + \text{bottom} < \text{height}$ | Bottom margin in millimeters |
| `left` | `number` | No | `2.0` | $\ge 0$, $\text{left} + \text{right} < \text{width}$ | Left margin in millimeters |

---

### 3. LabelLayout

Controls spatial arrangement, alignment, and relationship of label components.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `qrCodePlacement` | `'left' \| 'right' \| 'top' \| 'bottom' \| 'center'` | No | `'left'` | Must be one of enum values | Position of QR code relative to text area |
| `qrCodeSize` | `number` | No | `0.65` | $0.15 \le \text{size} \le 0.95$ | Relative size of QR code (proportion of primary dimension) |
| `margins` | `LabelMargins` | No | `{ 2, 2, 2, 2 }` | Valid margins | Safety margins around label edges |
| `textAlignment` | `'left' \| 'center' \| 'right'` | No | `'left'` | Must be one of enum values | Horizontal alignment of typography |
| `metadataOrientation` | `'vertical' \| 'horizontal'` | No | `'vertical'` | Must be one of enum values | Stacking direction for custom metadata fields |
| `metadataSeparator` | `string` | No | `': '` | Non-empty string | Separator between metadata key and value |

---

### 4. LabelStyle

Governs visual presentation, colors, fonts, and borders.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `fontFamily` | `string` | No | `'sans-serif'` | Valid CSS font-family string | Font family for text rendering |
| `fontSize` | `number` | No | `12` | $4 \le \text{fontSize} \le 72$ | Nominal font size in points for note title |
| `minFontSize` | `number` | No | `6` | $4 \le \text{min} \le \text{fontSize}$ | Lower bound for dynamic font reduction |
| `fontColor` | `string` | No | `'#000000'` | Valid 3/6/8-digit hex or CSS color | Color of typography and metadata |
| `backgroundColor` | `string` | No | `'#FFFFFF'` | Valid 3/6/8-digit hex or CSS color | Label background fill color |
| `borderWidth` | `number` | No | `0` | $\ge 0$ | Perimeter border stroke width in pixels |
| `borderColor` | `string` | No | `'#000000'` | Valid 3/6/8-digit hex or CSS color | Color of perimeter border |

---

### 5. QROptions

Configuration specific to the QR matrix encoding.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | No | `'M'` | Must be one of enum values | QR Reed-Solomon recovery capacity |
| `margin` | `number` | No | `1` | $\ge 0$ (in QR modules) | Quiet zone border width around QR matrix |

---

### 6. LabelContent

The runtime payload containing note identity and metadata to display.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `noteTitle` | `string` | Yes | — | Non-empty string | Primary title to render |
| `obsidianUri` | `string` | Yes | — | Must start with `obsidian://` | Target Obsidian URI encoded in QR code |
| `notePath` | `string` | No | `''` | Valid vault file path | Vault relative path for reference |
| `customFields` | `Record<string, string>` | No | `{}` | Key-value pairs | Optional frontmatter properties to display |

---

### 7. LabelPreset

Predefined standard label formats supported out-of-the-box.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g. `'phomemo-40x30'`, `'dymo-89x28'`) |
| `name` | `string` | Human-readable name (e.g. `'Phomemo 40mm x 30mm'`) |
| `description` | `string` | Use-case description (e.g. `'Compact storage bin label'`) |
| `size` | `LabelSize` | Physical dimensions (`width`, `height`, `dpi`) |
| `defaultLayout` | `Partial<LabelLayout>` | Recommended default layout settings |

**Standard Built-in Presets**:
1. `phomemo-40x30`: $40\text{mm} \times 30\text{mm}$ (300 DPI, left QR placement)
2. `dymo-89x28`: $89\text{mm} \times 28\text{mm}$ (300 DPI, left QR placement)
3. `brother-62x100`: $62\text{mm} \times 100\text{mm}$ (300 DPI, top QR placement)
4. `avery-5160`: $66.7\text{mm} \times 25.4\text{mm}$ (300 DPI, left QR placement)

---

### 8. ValidationResult & ValidationError

Structured response returned during configuration checking.

```typescript
interface ValidationError {
  field: string;
  code: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
```

---

### 9. RenderedLabel

The composite dual-output artifact produced by the engine upon successful rendering.

| Field | Type | Description |
| :--- | :--- | :--- |
| `previewDataUrl` | `string` | Base64 PNG data URL (`data:image/png;base64,...`) for instant modal rendering |
| `pdfData` | `Uint8Array` | Binary array containing complete, valid PDF 1.4/1.7 document bytes |
| `pixelDimensions` | `{ width: number; height: number }` | Pixel dimensions of the rendered raster surface |
| `physicalDimensions` | `{ widthMm: number; heightMm: number; dpi: number }` | Physical dimensions and resolution used for generation |
