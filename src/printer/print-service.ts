import { exec } from 'child_process';
import { PrintExecutionOptions, PrintJob, PrintResult, PrintScriptInfo } from './types';
import { buildPrintCommand } from './command-builder';
import { detectPrintScript } from './script-detector';

/**
 * Standard execution timeout for external print processes (10 seconds).
 */
export const DEFAULT_PRINT_TIMEOUT_MS = 10000;

export class PrintService {
  /**
   * Dispatches a print job to the physical printer via the appropriate helper script.
   */
  async printLabel(job: PrintJob, options?: PrintExecutionOptions): Promise<PrintResult> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;

    // 1. Resolve print helper script
    const scriptInfo = job.scriptPath
      ? detectPrintScript({ customPath: job.scriptPath })
      : detectPrintScript();

    if (!scriptInfo || !scriptInfo.exists) {
      const missingPath = job.scriptPath || 'auto-detected location';
      const errorMsg = `Print helper script not found at ${missingPath}.`;
      return {
        success: false,
        command: '',
        stdout: '',
        stderr: errorMsg,
        exitCode: 1,
        error: new Error(errorMsg),
      };
    }

    // 2. Compile executable command string
    let command: string;
    try {
      command = buildPrintCommand(scriptInfo.scriptPath, job.pdfPath, job.printerName);
    } catch (err: any) {
      return {
        success: false,
        command: '',
        stdout: '',
        stderr: err.message || String(err),
        exitCode: 1,
        error: err,
      };
    }

    // 3. Execute command asynchronously
    if (options?.runner) {
      try {
        const { stdout, stderr, exitCode } = await options.runner(command, timeoutMs);
        return {
          success: exitCode === 0,
          command,
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode,
        };
      } catch (err: any) {
        const isTimeout =
          err?.killed || err?.signal === 'SIGTERM' || String(err).includes('timed out');
        return {
          success: false,
          command,
          stdout: err.stdout || '',
          stderr: err.stderr || err.message || String(err),
          exitCode: err.code || 1,
          error: err,
          timedOut: isTimeout,
        };
      }
    }

    return new Promise<PrintResult>((resolve) => {
      exec(command, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          const isTimeout = error.killed || error.signal === 'SIGTERM';
          resolve({
            success: false,
            command,
            stdout: stdout || '',
            stderr: stderr || error.message,
            exitCode: error.code || 1,
            error,
            timedOut: isTimeout,
          });
        } else {
          resolve({
            success: true,
            command,
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: 0,
          });
        }
      });
    });
  }

  /**
   * Resolves print script path and metadata.
   */
  detectScript(customPath?: string, basePath?: string): PrintScriptInfo | null {
    return detectPrintScript({ customPath, vaultBasePath: basePath });
  }

  /**
   * Constructs shell invocation command string.
   */
  buildPrintCommand(scriptPath: string, pdfPath: string, printerName: string): string {
    return buildPrintCommand(scriptPath, pdfPath, printerName);
  }

  /**
   * Validates user printer settings.
   */
  validatePrinterConfig(config: {
    autoPrint: boolean;
    printerName: string;
    printScriptPath?: string;
  }): string[] {
    const errors: string[] = [];
    if (config.autoPrint) {
      if (!config.printerName || config.printerName.trim().length === 0) {
        errors.push('Printer name is required when auto-print is enabled.');
      }
      if (config.printScriptPath && config.printScriptPath.trim().length > 0) {
        const lower = config.printScriptPath.toLowerCase();
        if (!lower.endsWith('.sh') && !lower.endsWith('.ps1')) {
          errors.push('Custom print script must have a .sh or .ps1 file extension.');
        }
      }
    }
    return errors;
  }
}

export const defaultPrintService = new PrintService();
