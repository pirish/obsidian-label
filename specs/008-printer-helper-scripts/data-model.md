# Data Model: Printer Helper Scripts & Auto-Print

**Feature**: `008-printer-helper-scripts`
**Date**: 2026-10-07

---

## 1. Entities & Data Structures

### `PrintJob`
Represents an individual request to dispatch a generated label PDF to a target physical printer.

```typescript
export interface PrintJob {
  /** Absolute filesystem path to the printable PDF file */
  pdfPath: string;

  /** System printer identifier (matching lpstat -p or Get-Printer) */
  printerName: string;

  /** Optional custom script path override; if omitted, resolved automatically */
  scriptPath?: string;

  /** Optional timestamp when print request was created */
  timestamp?: number;
}
```

---

### `PrintResult`
Represents the outcome of executing the external print helper process.

```typescript
export interface PrintResult {
  /** Whether the process completed with exit code 0 without errors */
  success: boolean;

  /** The exact shell command line string that was executed */
  command: string;

  /** Standard output captured from the helper script */
  stdout: string;

  /** Standard error output captured from the helper script */
  stderr: string;

  /** Process exit code (0 for success, non-zero for failure) */
  exitCode: number;

  /** Error instance if execution threw, timed out, or process spawn failed */
  error?: Error;

  /** Whether the operation was terminated due to exceeding the 10s execution timeout */
  timedOut?: boolean;
}
```

---

### `PrintScriptInfo`
Metadata describing a discovered or configured print helper script.

```typescript
export type ScriptType = 'bash' | 'powershell' | 'unknown';

export interface PrintScriptInfo {
  /** Absolute filesystem path to the script file */
  scriptPath: string;

  /** Detected script dialect based on extension or system platform */
  scriptType: ScriptType;

  /** Whether the script file exists on disk */
  exists: boolean;
}
```

---

### `PrinterConfiguration` (Settings Extension)
User configuration persisted in `ObsidianLabelSettings`.

```typescript
export interface PrinterConfiguration {
  /** Whether to automatically send labels to printer immediately after generation */
  autoPrint: boolean;

  /** Exact target printer name recognized by CUPS or Windows */
  printerName: string;

  /** Optional path to custom helper script; empty string for auto-detection */
  printScriptPath: string;
}
```

**Defaults**:
- `autoPrint`: `false`
- `printerName`: `''`
- `printScriptPath`: `''`

---

## 2. Validation & Boundary Rules

| Field | Rule | Violation Handling |
| :--- | :--- | :--- |
| `pdfPath` | Must be a non-empty string pointing to an existing file ending in `.pdf` | Script/engine aborts with error notice: "PDF file not found" |
| `printerName` | Must be non-empty when `autoPrint` is enabled | Execution skipped with notice: "Printer name must be specified" |
| `printScriptPath` | If specified, must exist on disk and end with `.sh` or `.ps1` | Error notice: "Print script not found at specified path" |
| Execution Timeout | Must not exceed 10,000 ms (10 seconds) | Process terminated (`SIGTERM`), `timedOut: true`, error notice displayed |
