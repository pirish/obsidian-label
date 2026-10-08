import { ScriptType } from './types';

/**
 * Escapes embedded double-quotes in argument strings.
 */
export function escapeQuotes(arg: string): string {
  if (!arg) return '';
  return arg.replace(/"/g, '\\"');
}

/**
 * Identifies the script dialect from the file extension.
 */
export function detectScriptType(scriptPath: string): ScriptType {
  if (!scriptPath) return 'unknown';
  const lower = scriptPath.toLowerCase();
  if (lower.endsWith('.sh')) return 'bash';
  if (lower.endsWith('.ps1')) return 'powershell';
  return 'unknown';
}

/**
 * Builds a safely quoted executable shell command string.
 *
 * For Bash:
 *   bash "<scriptPath>" "<pdfPath>" "<printerName>"
 *
 * For PowerShell:
 *   powershell -ExecutionPolicy Bypass -File "<scriptPath>" -PdfPath "<pdfPath>" -PrinterName "<printerName>"
 */
export function buildPrintCommand(
  scriptPath: string,
  pdfPath: string,
  printerName: string,
): string {
  if (!scriptPath || scriptPath.trim().length === 0) {
    throw new Error('Script path is required to build print command.');
  }
  if (!pdfPath || pdfPath.trim().length === 0) {
    throw new Error('PDF path is required to build print command.');
  }
  if (!printerName || printerName.trim().length === 0) {
    throw new Error('Printer name is required to build print command.');
  }

  const scriptType = detectScriptType(scriptPath);
  const cleanScript = escapeQuotes(scriptPath);
  const cleanPdf = escapeQuotes(pdfPath);
  const cleanPrinter = escapeQuotes(printerName);

  if (scriptType === 'bash') {
    return `bash "${cleanScript}" "${cleanPdf}" "${cleanPrinter}"`;
  }

  if (scriptType === 'powershell') {
    return `powershell -ExecutionPolicy Bypass -File "${cleanScript}" -PdfPath "${cleanPdf}" -PrinterName "${cleanPrinter}"`;
  }

  throw new Error(`Unsupported script type for file: "${scriptPath}". Expected .sh or .ps1`);
}
