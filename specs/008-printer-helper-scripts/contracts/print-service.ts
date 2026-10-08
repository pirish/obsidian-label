import { PrintJob, PrintResult, PrintScriptInfo, PrinterConfiguration } from '../data-model';

export interface PrintExecutionOptions {
  /** Execution timeout in milliseconds (default: 10,000 ms) */
  timeoutMs?: number;

  /** Custom process runner function for testing/mocking */
  runner?: (command: string, timeoutMs: number) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

export interface IPrintService {
  /**
   * Executes a print job asynchronously via the appropriate OS helper script.
   */
  printLabel(job: PrintJob, options?: PrintExecutionOptions): Promise<PrintResult>;

  /**
   * Resolves the print helper script, either from manual path or automatic discovery.
   */
  detectScript(customPath?: string, basePath?: string): PrintScriptInfo | null;

  /**
   * Constructs a safely quoted shell command string based on script type and inputs.
   */
  buildPrintCommand(scriptPath: string, pdfPath: string, printerName: string): string;

  /**
   * Validates user printer settings, returning human-readable error messages.
   */
  validatePrinterConfig(config: PrinterConfiguration): string[];
}
