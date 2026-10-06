# Technical Research: Plugin Settings Tab for Label Configuration

**Feature**: `specs/004-settings-tab`  
**Date**: 2026-10-05  
**Status**: Completed

## 1. Technical Decisions & Architecture Findings

### 1.1 Obsidian Settings Tab Lifecycle (`PluginSettingTab`)

**Decision**: Implement `ObsidianLabelSettingTab` extending Obsidian's `PluginSettingTab`, registered via `this.addSettingTab(new ObsidianLabelSettingTab(this.app, this))` in `ObsidianLabelPlugin.onload()`.

**Rationale**:
- Native integration: `PluginSettingTab` is the standard Obsidian idiom for plugin settings, providing immediate consistency with Obsidian's core settings panel and themes.
- Re-rendering on state change: In `display(): void`, clearing `containerEl.empty()` and rebuilding settings is the standard pattern when dropdown selections dynamically dictate whether subordinate controls (e.g. custom width and height fields) appear.
- Debounced/asynchronous persistence: Each input control's `onChange` callback updates the plugin's in-memory `settings` object and awaits `this.plugin.saveSettings()`.

**Alternatives Considered**:
- *Manual DOM manipulation (showing/hiding specific element classes)*: More brittle and tightly coupled to DOM structure than Obsidian's standard `this.display()` refresh pattern.
- *Modal settings dialog*: Deviates from standard Obsidian UX where users expect settings to reside in the central Settings view.

---

### 1.2 Settings Persistence & Default Merge Strategy

**Decision**: Persist settings via `this.saveData(this.settings)` and load via `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())`.

**Rationale**:
- Backward and forward compatibility: When new settings fields are introduced across releases, `Object.assign` merges stored user overrides over `DEFAULT_SETTINGS`, guaranteeing no field is ever `undefined`.
- Crash resilience: If `data.json` is missing (first install) or corrupted, the plugin falls back cleanly to `DEFAULT_SETTINGS` without exceptions.

**Schema Alignment**:
```typescript
export interface ObsidianLabelSettings {
  // Label Media & Size Defaults
  defaultLabelSize: 'dymo-standard' | 'brother-62mm' | 'avery-5160' | 'phomemo-40x30' | 'generic-square-50' | 'custom';
  customWidth: number;   // mm, used if defaultLabelSize === 'custom'
  customHeight: number;  // mm, used if defaultLabelSize === 'custom'

  // QR Layout
  qrCodePlacement: 'left' | 'right' | 'top' | 'bottom';
  qrCodeSize: number;    // percentage (10 to 50)

  // Typography & Styling
  fontFamily: string;
  fontSize: number;      // points
  fontColor: string;     // hex
  backgroundColor: string; // hex
  borderWidth: number;   // pixels
  borderColor: string;   // hex

  // Output Routing & File Naming
  outputFolder: 'same-as-note' | 'dedicated-folder' | 'custom';
  customOutputPath: string;
  includeTimestamp: boolean;

  // Print Helper Preferences
  printerName: string;
  autoPrint: boolean;
}
```

---

### 1.3 Core Engine Integration & Mapping Helpers

**Decision**: Provide two pure mapping functions:
1. `settingsToLabelConfig(settings: ObsidianLabelSettings): LabelConfig`
2. `settingsToPDFExportOptions(settings: ObsidianLabelSettings): PDFExportOptions`

**Rationale**:
- Decouples UI representation from the core label generation and PDF export engines.
- If `settings.defaultLabelSize` is a preset (e.g. `'dymo-standard'`), the helper maps it to the engine's preset dimensions (89×28mm). If `'custom'`, it uses `settings.customWidth` and `settings.customHeight`.
- Translates percentage slider (e.g. 25%) to engine proportion (e.g. 0.25).
- Translates `outputFolder` ('same-as-note' → 'same-folder', 'dedicated-folder' → 'dedicated-folder', 'custom' → 'custom-folder') seamlessly.

---

### 1.4 Sample Label Preview Modal (`PreviewModal`)

**Decision**: Implement `PreviewModal` extending Obsidian's `Modal`. On open, it renders a label preview using the plugin's `LabelGenerator.generate()` and displays the resulting PNG data URL in a centered preview element with a clear "Close" button.

**Content Source Strategy**:
1. Checks `this.app.workspace.getActiveFile()`.
2. If an active markdown note is open: retrieves title and generates the note's Obsidian URI.
3. If no active note is open: falls back to a realistic sample note payload:
   - Title: `"Sample Equipment Note"`
   - URI: `"obsidian://open?vault=Vault&file=Sample%20Note.md"`
   - Custom Fields: `{ Category: "Hardware", Status: "Active" }`
4. Renders the preview with `plugin.generator.generate(config, content)` and displays it in the modal.

---

### 1.5 Testing Strategy in Node/Jest

**Decision**: Create lightweight test doubles for `App`, `PluginSettingTab`, `Setting`, and `Modal` in `tests/mocks/obsidian.ts`.

**Rationale**:
- Enables 100% offline, lightning-fast unit and integration testing without launching Electron or Obsidian.
- Verifies that:
  - Settings load, validate, and save correctly.
  - Setting tab UI controls (`addDropdown`, `addSlider`, `addText`, `addToggle`) properly trigger `saveSettings()`.
  - Conditional field display correctly toggles when switching between presets and custom sizes.
  - Preview modal successfully invokes `LabelGenerator.generate()` with active settings and handles fallback when no note is active.
