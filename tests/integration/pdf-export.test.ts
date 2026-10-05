import {
  defaultGenerator,
  exportCanvasToPDF,
  exportCanvasToPDFBlob,
  generateLabelFilename,
  getPDFDimensions,
  LabelConfig,
  LabelContent,
  MinimalVault,
  resolveLabelPDFPath,
  savePDFToVault,
} from '../../src/index';
import { createRenderingCanvas } from '../../src/core/canvas-renderer';

describe('Feature 003 Quickstart Integration Scenarios', () => {
  let mockVault: MinimalVault;
  let vaultStorage: Map<string, ArrayBuffer>;
  let createdDirectories: Set<string>;

  beforeEach(() => {
    vaultStorage = new Map();
    createdDirectories = new Set();

    mockVault = {
      adapter: {
        exists: jest.fn(async (path: string) => {
          return createdDirectories.has(path) || vaultStorage.has(path);
        }),
        mkdir: jest.fn(async (folderPath: string) => {
          createdDirectories.add(folderPath);
        }),
        writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
          vaultStorage.set(path, data);
        }),
      },
    };
  });

  describe('Scenario 1: Exact-Dimension Print-Ready PDF Generation (User Story 1 - P1 MVP)', () => {
    it('generates exact 40mm x 30mm landscape PDF', () => {
      const canvas = createRenderingCanvas(472, 354);
      const dims = getPDFDimensions(40, 30);
      expect(dims.widthMm).toBe(40);
      expect(dims.heightMm).toBe(30);
      expect(dims.orientation).toBe('landscape');

      const pdfBytes = exportCanvasToPDF(canvas, 40, 30);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.byteLength).toBeGreaterThan(100);

      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('generates exact 30mm x 50mm portrait PDF', () => {
      const canvas = createRenderingCanvas(354, 590);
      const dims = getPDFDimensions(30, 50);
      expect(dims.widthMm).toBe(30);
      expect(dims.heightMm).toBe(50);
      expect(dims.orientation).toBe('portrait');

      const pdfBytes = exportCanvasToPDF(canvas, 30, 50);
      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('creates Blob output via exportCanvasToPDFBlob', () => {
      const canvas = createRenderingCanvas(472, 354);
      const blob = exportCanvasToPDFBlob(canvas, 40, 30);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(100);
    });
  });

  describe('Scenario 2: Configurable Vault Storage Location Resolution (User Story 2 - P2)', () => {
    it('resolves same-folder for nested notes', () => {
      const resolved = resolveLabelPDFPath('Technology/Projects/MyNote.md', {
        location: 'same-folder',
      });
      expect(resolved).toBe('Technology/Projects/MyNote_label.pdf');
    });

    it('resolves same-folder for root notes without leading slash', () => {
      const resolved = resolveLabelPDFPath('MyNote.md', {
        location: 'same-folder',
      });
      expect(resolved).toBe('MyNote_label.pdf');
    });

    it('resolves dedicated-folder to _labels/ at vault root', () => {
      const resolved = resolveLabelPDFPath('Technology/Projects/MyNote.md', {
        location: 'dedicated-folder',
      });
      expect(resolved).toBe('_labels/MyNote_label.pdf');
    });

    it('resolves custom-folder path cleanly', () => {
      const resolved = resolveLabelPDFPath('Technology/Projects/MyNote.md', {
        location: 'custom-folder',
        customFolder: 'PrintQueue/Pending/',
      });
      expect(resolved).toBe('PrintQueue/Pending/MyNote_label.pdf');
    });
  });

  describe('Scenario 3: Recursive Directory Auto-Creation & Vault Persistence (User Story 2 - P2)', () => {
    it('creates missing directories recursively and persists bytes', async () => {
      const dummyData = new Uint8Array([37, 80, 68, 70, 45]); // %PDF-
      const savedPath = await savePDFToVault(
        mockVault,
        'Archive/Labels/2026/MyNote_label.pdf',
        dummyData,
      );

      expect(savedPath).toBe('Archive/Labels/2026/MyNote_label.pdf');
      expect(mockVault.adapter.mkdir).toHaveBeenCalledWith('Archive');
      expect(mockVault.adapter.mkdir).toHaveBeenCalledWith('Archive/Labels');
      expect(mockVault.adapter.mkdir).toHaveBeenCalledWith('Archive/Labels/2026');
      expect(vaultStorage.has('Archive/Labels/2026/MyNote_label.pdf')).toBe(true);
    });
  });

  describe('Scenario 4: Standardized Filename Formatting & Timestamp Toggles (User Story 3 - P3)', () => {
    it('defaults to static [NoteName]_label.pdf without timestamp', () => {
      expect(generateLabelFilename('Technology/Projects/MyNote.md')).toBe('MyNote_label.pdf');
      expect(generateLabelFilename('MyNote.md')).toBe('MyNote_label.pdf');
    });

    it('appends YYYY-MM-DD timestamp when includeTimestamp is true', () => {
      const testDate = new Date('2026-10-04T12:00:00Z');
      const filename = generateLabelFilename('Technology/Projects/MyNote.md', {
        includeTimestamp: true,
        date: testDate,
      });
      expect(filename).toBe('MyNote_label_2026-10-04.pdf');
    });

    it('handles special characters in note name correctly', () => {
      const filename = generateLabelFilename('Hardware & Tools/Multimeter + Calipers.md');
      expect(filename).toBe('Multimeter + Calipers_label.pdf');
    });
  });

  describe('Scenario 5: Clean Overwrite on Label Regeneration (User Story 3 - P3)', () => {
    it('overwrites previous label PDF cleanly without errors or corruption', async () => {
      const initialBytes = new Uint8Array([1, 1, 1, 1]);
      await savePDFToVault(mockVault, 'Tools/Multimeter_label.pdf', initialBytes);

      const regeneratedBytes = new Uint8Array([2, 2, 2, 2, 2]);
      await savePDFToVault(mockVault, 'Tools/Multimeter_label.pdf', regeneratedBytes);

      const stored = vaultStorage.get('Tools/Multimeter_label.pdf');
      expect(stored).toBeDefined();
      expect(new Uint8Array(stored!)).toEqual(regeneratedBytes);
    });
  });

  describe('Scenario 6: End-to-End Pipeline through defaultGenerator.exportLabelPDF', () => {
    const config: LabelConfig = {
      size: { width: 40, height: 30, dpi: 300 },
      layout: {
        qrCodePlacement: 'left',
        qrCodeSize: 0.65,
        margins: { top: 2, right: 2, bottom: 2, left: 2 },
      },
      style: {
        fontFamily: 'sans-serif',
        fontSize: 12,
        fontColor: '#000000',
        backgroundColor: '#FFFFFF',
      },
    };

    const content: LabelContent = {
      noteTitle: 'Workshop Multimeter',
      notePath: 'Equipment/Inventory/Multimeter.md',
      obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FInventory%2FMultimeter.md',
      customFields: { Model: 'Fluke 87V', Location: 'Shelf A' },
    };

    it('executes full pipeline from config/content to vault PDF in same-folder mode', async () => {
      const result = await defaultGenerator.exportLabelPDF(mockVault, config, content, {
        location: 'same-folder',
      });

      expect(result.filePath).toBe('Equipment/Inventory/Multimeter_label.pdf');
      expect(result.fileSize).toBeGreaterThan(1000);
      expect(result.pdfData).toBeInstanceOf(Uint8Array);
      expect(result.dimensions).toEqual({
        widthMm: 40,
        heightMm: 30,
        orientation: 'landscape',
      });

      // Verify %PDF- magic bytes
      const header = String.fromCharCode(...result.pdfData.slice(0, 5));
      expect(header).toBe('%PDF-');

      // Verify written to vault
      expect(vaultStorage.has('Equipment/Inventory/Multimeter_label.pdf')).toBe(true);
    });

    it('executes full pipeline in dedicated-folder mode with timestamp', async () => {
      const testDate = new Date('2026-10-04T12:00:00Z');
      const result = await defaultGenerator.exportLabelPDF(mockVault, config, content, {
        location: 'dedicated-folder',
        naming: { includeTimestamp: true, date: testDate },
      });

      expect(result.filePath).toBe('_labels/Multimeter_label_2026-10-04.pdf');
      expect(vaultStorage.has('_labels/Multimeter_label_2026-10-04.pdf')).toBe(true);
    });
  });
});
