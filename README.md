# Obsidian Label

[![CI/CD Pipeline](https://github.com/pirish/obsidian-label/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/pirish/obsidian-label/actions/workflows/ci-cd.yml)
[![Release Version](https://img.shields.io/badge/version-v0.1.1-blue)](https://github.com/pirish/obsidian-label/releases/latest)
[![Latest GitHub Release](https://img.shields.io/github/v/release/pirish/obsidian-label?label=release)](https://github.com/pirish/obsidian-label/releases/latest)

Generate professional, scannable QR code labels for physical items linked directly to Obsidian notes (`obsidian://`).

---

## Features

- **Direct Obsidian URI QR Codes**: Encode `obsidian://open?vault=...&file=...` URIs directly in scannable QR codes with zero external or cloud dependencies.
- **Built-in & Custom Label Presets**: Supports Dymo Standard (`89×28mm`), Brother (`62×100mm`), Avery 5160 (`66.7×25.4mm`), Phomemo (`40×30mm`), Generic Square (`50×50mm`), and custom millimeter dimensions.
- **Label Templates**: Built-in templates (`standard`, `compact`, `inventory`) plus full custom template management.
- **Per-Note YAML Frontmatter Configuration**: Persist template selection, custom key-value fields, QR code sizing, and typography per note.
- **Command Palette & Context Menu Integration**: Generate single labels, customize one-off labels, generate new batches by folder/tag/search, or batch-regenerate all existing labels across your vault.
- **Optional OS Printer Helper Scripts**: Auto-print generated PDFs directly via CUPS (`scripts/print-label.sh` on Linux/macOS) or PowerShell (`scripts/print-label.ps1` on Windows). See [docs/PRINTER_SETUP.md](docs/PRINTER_SETUP.md).

---

## Batch Label Generation

When setting up a new inventory or collection, open the Command Palette and run **Obsidian Label: Batch Label Generation**:

1. **Select Notes**:
   - **All notes in a folder**: Choose any vault folder (or Vault Root `/`) and toggle **Include subfolders** to switch between recursive and direct-child selection.
   - **All notes with a tag**: Filter notes by frontmatter or inline tag (e.g., `#inventory` or `inventory`).
   - **Search results**: Match notes by title, file path, or body content.
2. **Preview**: Inspect the total number of labels to be generated along with up to 10 sample note paths (`... and X more` for larger batches).
3. **Generate & Optional Multi-Page PDF Merge**:
   - Click **Generate Labels** to generate all selected labels with a live progress bar (`0 / N`). Individual note errors are logged and skipped without interrupting the batch.
   - Enable **Merge into single multi-page PDF** (in the modal or under **Settings → PDF Export & Storage**) to also create a consolidated `labels_batch_YYYY-MM-DD.pdf` file alongside the individual per-note PDFs.

---

## Per-Note Configuration

You can customize labels for specific notes using YAML frontmatter:

```yaml
---
label:
  template: "inventory"
  customFields:
    category: "Books"
    location: "Shelf A2"
  qrCodeSize: 40
  fontSize: 14
---
```

**Supported Frontmatter Options:**

- `template`: Template ID (built-in or custom, e.g. `"standard"`, `"compact"`, `"inventory"`)
- `customFields`: Key-value pairs to display on label (formatted as `key: value`, overriding the template's custom field lookup list)
- `qrCodeSize`: QR code size percentage (`10`–`50`)
- `fontSize`: Font size in points (`1`–`72`)
- `labelSize`: Hardware preset ID (`"dymo-standard"`, `"brother-62mm"`, `"avery-5160"`, `"phomemo-40x30"`, `"generic-square-50"`, or `"custom"`)
- `customWidth`: Custom label width in millimeters (`> 0`)
- `customHeight`: Custom label height in millimeters (`> 0`)
- `qrCodePlacement`: Spatial placement of the QR code (`"left"`, `"right"`, `"top"`, or `"bottom"`)

**Configuration Precedence & Fallback:**
1. Temporary overrides from the **Generate Custom Label** dialog
2. Nested `label.*` frontmatter options on the note
3. Legacy flat frontmatter keys (`template`, `label_size`, `qr_size`, etc.)
4. Active template defaults
5. Global plugin settings

Any invalid or out-of-range frontmatter value is safely ignored with a diagnostic console warning, falling back to your template or global settings.
