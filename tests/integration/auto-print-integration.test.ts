import ObsidianLabelPlugin from '../../src/main';
import { defaultPrintService } from '../../src/printer/print-service';
import { App, TFile } from '../../tests/mocks/obsidian';

describe('Auto-Print End-to-End Integration (US1 MVP)', () => {
  let mockApp: App;
  let plugin: ObsidianLabelPlugin;
  let testNote: TFile;
  let writtenFiles: Map<string, Uint8Array>;

  beforeEach(() => {
    writtenFiles = new Map();
    testNote = new TFile('Devices/Oscilloscope.md');

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => testNote),
      },
      vault: {
        getName: jest.fn(() => 'HardwareVault'),
        getMarkdownFiles: jest.fn(() => [testNote]),
        adapter: {
          exists: jest.fn(async (path: string) => writtenFiles.has(path)),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, new Uint8Array(data));
          }),
          mkdir: jest.fn(async () => {}),
          getBasePath: jest.fn(() => '/vault'),
        } as any,
      },
      metadataCache: {
        getFileCache: jest.fn(() => null),
      },
      fileManager: {
        processFrontMatter: jest.fn(async () => {}),
      },
    };

    plugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates PDF label and automatically dispatches print job to target printer', async () => {
    await plugin.onload();
    plugin.settings.autoPrint = true;
    plugin.settings.printerName = 'Brother-QL-800';

    const printSpy = jest.spyOn(defaultPrintService, 'printLabel').mockResolvedValue({
      success: true,
      command: 'bash scripts/print-label.sh',
      stdout: 'Label sent to printer: Brother-QL-800',
      stderr: '',
      exitCode: 0,
    });

    await plugin.generateLabelForCurrentNote(testNote);

    const expectedPdfPath = 'Devices/Oscilloscope_label.pdf';
    expect(writtenFiles.has(expectedPdfPath)).toBe(true);

    expect(printSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pdfPath: expectedPdfPath,
        printerName: 'Brother-QL-800',
      }),
      expect.anything(),
    );
  });

  it('respects custom printScriptPath override in settings', async () => {
    await plugin.onload();
    plugin.settings.autoPrint = true;
    plugin.settings.printerName = 'Dymo-450';
    plugin.settings.printScriptPath = '/custom/tools/my-printer.sh';

    const printSpy = jest.spyOn(defaultPrintService, 'printLabel').mockResolvedValue({
      success: true,
      command: 'bash /custom/tools/my-printer.sh',
      stdout: 'Success',
      stderr: '',
      exitCode: 0,
    });

    await plugin.generateLabelForCurrentNote(testNote);

    expect(printSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        scriptPath: '/custom/tools/my-printer.sh',
        printerName: 'Dymo-450',
      }),
      expect.anything(),
    );
  });

  it('does not dispatch print job when autoPrint is false', async () => {
    await plugin.onload();
    plugin.settings.autoPrint = false;
    plugin.settings.printerName = 'Brother-QL-800';

    const printSpy = jest.spyOn(defaultPrintService, 'printLabel');

    await plugin.generateLabelForCurrentNote(testNote);

    const expectedPdfPath = 'Devices/Oscilloscope_label.pdf';
    expect(writtenFiles.has(expectedPdfPath)).toBe(true);
    expect(printSpy).not.toHaveBeenCalled();
  });
});
