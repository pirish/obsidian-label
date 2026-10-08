import { PrintService } from '../../src/printer/print-service';
import * as scriptDetectorModule from '../../src/printer/script-detector';

describe('Print Service (Foundational)', () => {
  let service: PrintService;

  beforeEach(() => {
    service = new PrintService();
  });

  describe('printLabel', () => {
    it('returns structured failure when print script cannot be found', async () => {
      jest.spyOn(scriptDetectorModule, 'detectPrintScript').mockReturnValue(null);

      const result = await service.printLabel({
        pdfPath: '/path/to/label.pdf',
        printerName: 'Dymo',
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Print helper script not found');
    });

    it('returns structured success when helper script succeeds', async () => {
      jest.spyOn(scriptDetectorModule, 'detectPrintScript').mockReturnValue({
        scriptPath: '/scripts/print-label.sh',
        scriptType: 'bash',
        exists: true,
      });

      const mockRunner = jest.fn(async (_cmd: string, _timeout: number) => ({
        stdout: 'Label sent to printer: Dymo',
        stderr: '',
        exitCode: 0,
      }));

      const result = await service.printLabel(
        {
          pdfPath: '/path/to/label.pdf',
          printerName: 'Dymo',
        },
        { runner: mockRunner },
      );

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Label sent to printer: Dymo');
      expect(mockRunner).toHaveBeenCalledWith(
        'bash "/scripts/print-label.sh" "/path/to/label.pdf" "Dymo"',
        10000,
      );
    });

    it('handles helper script failure and captures stderr output', async () => {
      jest.spyOn(scriptDetectorModule, 'detectPrintScript').mockReturnValue({
        scriptPath: '/scripts/print-label.sh',
        scriptType: 'bash',
        exists: true,
      });

      const mockRunner = jest.fn(async () => {
        const err: any = new Error('Printer not found');
        err.code = 1;
        err.stderr = 'Error: Printer not found: MissingPrinter';
        throw err;
      });

      const result = await service.printLabel(
        {
          pdfPath: '/path/to/label.pdf',
          printerName: 'MissingPrinter',
        },
        { runner: mockRunner },
      );

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error: Printer not found');
    });

    it('handles process timeout and marks timedOut: true', async () => {
      jest.spyOn(scriptDetectorModule, 'detectPrintScript').mockReturnValue({
        scriptPath: '/scripts/print-label.sh',
        scriptType: 'bash',
        exists: true,
      });

      const mockRunner = jest.fn(async () => {
        const err: any = new Error('Process timed out');
        err.killed = true;
        err.signal = 'SIGTERM';
        throw err;
      });

      const result = await service.printLabel(
        {
          pdfPath: '/path/to/label.pdf',
          printerName: 'Dymo',
        },
        { runner: mockRunner, timeoutMs: 5000 },
      );

      expect(result.success).toBe(false);
      expect(result.timedOut).toBe(true);
      expect(mockRunner).toHaveBeenCalledWith(expect.any(String), 5000);
    });
  });

  describe('validatePrinterConfig', () => {
    it('returns no errors when auto-print is disabled', () => {
      expect(
        service.validatePrinterConfig({
          autoPrint: false,
          printerName: '',
        }),
      ).toEqual([]);
    });

    it('requires printer name when auto-print is enabled', () => {
      const errors = service.validatePrinterConfig({
        autoPrint: true,
        printerName: '',
      });
      expect(errors).toContain('Printer name is required when auto-print is enabled.');
    });

    it('validates script extension when custom script is specified', () => {
      const errors = service.validatePrinterConfig({
        autoPrint: true,
        printerName: 'Dymo',
        printScriptPath: 'invalid-script.txt',
      });
      expect(errors).toContain('Custom print script must have a .sh or .ps1 file extension.');
    });

    it('accepts valid configuration with .sh or .ps1 script', () => {
      expect(
        service.validatePrinterConfig({
          autoPrint: true,
          printerName: 'Dymo',
          printScriptPath: '/path/to/print.sh',
        }),
      ).toEqual([]);

      expect(
        service.validatePrinterConfig({
          autoPrint: true,
          printerName: 'Brother QL-800',
          printScriptPath: 'C:\\print.ps1',
        }),
      ).toEqual([]);
    });
  });
});
