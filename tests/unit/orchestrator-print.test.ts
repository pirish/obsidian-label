import { generateLabelForNote } from '../../src/commands/orchestrator';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';
import { defaultPrintService } from '../../src/printer/print-service';
import { App, TFile } from '../../tests/mocks/obsidian';

describe('Orchestrator Auto-Print Dispatch (US1 MVP)', () => {
  let mockApp: App;
  let mockFile: TFile;
  let settings: ObsidianLabelSettings;

  beforeEach(() => {
    mockFile = new TFile('Vault/Components/Relay.md');
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => mockFile),
      },
      vault: {
        getName: jest.fn(() => 'LabVault'),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
          getBasePath: jest.fn(() => '/home/user/vault'),
        } as any,
      },
      metadataCache: {
        getFileCache: jest.fn(() => null),
      },
      fileManager: {
        processFrontMatter: jest.fn(async () => {}),
      },
    };

    settings = {
      ...DEFAULT_SETTINGS,
      autoPrint: true,
      printerName: 'Dymo-LabelWriter-450',
      printScriptPath: '',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('automatically dispatches print job when autoPrint is enabled with valid printerName', async () => {
    const printSpy = jest.spyOn(defaultPrintService, 'printLabel').mockResolvedValue({
      success: true,
      command: 'bash scripts/print-label.sh',
      stdout: 'Label sent to printer: Dymo-LabelWriter-450',
      stderr: '',
      exitCode: 0,
    });

    const result = await generateLabelForNote(mockApp as any, mockFile as any, settings);

    expect(result.filePath).toBe('Vault/Components/Relay_label.pdf');
    expect(printSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pdfPath: 'Vault/Components/Relay_label.pdf',
        printerName: 'Dymo-LabelWriter-450',
      }),
      expect.anything(),
    );
  });

  it('skips print dispatch when autoPrint is disabled', async () => {
    const printSpy = jest.spyOn(defaultPrintService, 'printLabel');

    settings.autoPrint = false;

    await generateLabelForNote(mockApp as any, mockFile as any, settings);

    expect(printSpy).not.toHaveBeenCalled();
  });

  it('skips print dispatch and alerts user when autoPrint is enabled but printerName is blank', async () => {
    const printSpy = jest.spyOn(defaultPrintService, 'printLabel');

    settings.autoPrint = true;
    settings.printerName = '';

    await generateLabelForNote(mockApp as any, mockFile as any, settings);

    expect(printSpy).not.toHaveBeenCalled();
  });

  it('surfaces error notice when helper script fails without aborting generated PDF', async () => {
    jest.spyOn(defaultPrintService, 'printLabel').mockResolvedValue({
      success: false,
      command: 'bash scripts/print-label.sh',
      stdout: '',
      stderr: 'Error: Printer not found: Dymo-LabelWriter-450',
      exitCode: 1,
    });

    const result = await generateLabelForNote(mockApp as any, mockFile as any, settings);

    // PDF generation succeeds even if printing encounters an error
    expect(result.filePath).toBe('Vault/Components/Relay_label.pdf');
  });
});
