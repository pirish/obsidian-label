/**
 * Supported shell script types for printer dispatch.
 */
export type ScriptType = 'bash' | 'powershell' | 'unknown';

/**
 * Metadata describing a discovered or configured print helper script.
 */
export interface PrintScriptInfo {
  /** Absolute filesystem path to the script file */
  scriptPath: string;

  /** Detected script dialect based on file extension or host OS */
  scriptType: ScriptType;

  /** Whether the script file exists on the filesystem */
  exists: boolean;
}

/**
 * Represents an individual physical label print request.
 */
export interface PrintJob {
  /** Absolute path to the generated printable PDF document */
  pdfPath: string;

  /** Exact target printer identifier matching CUPS or Windows spooler */
  printerName: string;

  /** Optional custom script path override */
  scriptPath?: string;

  /** Optional request timestamp */
  timestamp?: number;
}

/**
 * Structured result returned from executing an external print helper script.
 */
export interface PrintResult {
  /** Whether the process completed cleanly with exit code 0 without errors */
  success: boolean;

  /** The exact compiled shell command string that was dispatched */
  command: string;

  /** Standard output captured from the helper script */
  stdout: string;

  /** Standard error output captured from the helper script */
  stderr: string;

  /** Process exit code (0 indicates success) */
  exitCode: number;

  /** Error instance if execution threw, was killed, or process spawn failed */
  error?: Error;

  /** Whether execution was terminated due to exceeding the 10-second timeout */
  timedOut?: boolean;
}

/**
 * Execution parameters and timeouts for process runners.
 */
export interface PrintExecutionOptions {
  /** Maximum execution duration in milliseconds before SIGTERM (default: 10,000 ms) */
  timeoutMs?: number;

  /** Custom process runner for testing, injection, and mock execution */
  runner?: (
    command: string,
    timeoutMs: number,
  ) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
}
