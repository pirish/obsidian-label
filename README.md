# Obsidian Label

Generate professional, scannable QR code labels for physical items linked directly to Obsidian notes (`obsidian://`).

---

## Features

- **Direct Obsidian URI QR Codes**: Encode `obsidian://open?vault=...&file=...` URIs directly in scannable QR codes with zero external or cloud dependencies.
- **Built-in & Custom Label Presets**: Supports Dymo Standard (`89×28mm`), Brother (`62×100mm`), Avery 5160 (`66.7×25.4mm`), Phomemo (`40×30mm`), Generic Square (`50×50mm`), and custom millimeter dimensions.
- **Label Templates**: Built-in templates (`standard`, `compact`, `inventory`) plus full custom template management.
- **Per-Note YAML Frontmatter Configuration**: Persist template selection, custom key-value fields, QR code sizing, and typography per note.
- **Command Palette & Context Menu Integration**: Generate single labels, customize one-off labels, or batch-regenerate all existing labels across your vault.
- **Optional OS Printer Helper Scripts**: Auto-print generated PDFs directly via CUPS (`scripts/print-label.sh` on Linux/macOS) or PowerShell (`scripts/print-label.ps1` on Windows). See [docs/PRINTER_SETUP.md](docs/PRINTER_SETUP.md).

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
