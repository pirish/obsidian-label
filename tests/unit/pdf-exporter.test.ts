import { createRenderingCanvas } from '../../src/core/canvas-renderer';
import {
  exportCanvasToPDF,
  exportCanvasToPDFBlob,
  getPDFDimensions,
  generateLabelFilename,
  resolveLabelPDFPath,
  savePDFToVault,
} from '../../src/core/pdf-exporter';
import { LabelGenerator } from '../../src/core/label-generator';
import { LabelConfig, LabelContent, MinimalVault } from '../../src/core/types';

describe('PDF Exporter Module', () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = createRenderingCanvas(472, 354);
    const ctx = mockCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 472, 354);
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, 10, 50, 50);
    }
  });

  describe('Exact Dimensions & Orientation (User Story 1 - P1 MVP)', () => {
    it('calculates landscape orientation when width exceeds height', () => {
      const dims = getPDFDimensions(40, 30);
      expect(dims.widthMm).toBe(40);
      expect(dims.heightMm).toBe(30);
      expect(dims.orientation).toBe('landscape');
    });

    it('calculates portrait orientation when height exceeds width', () => {
      const dims = getPDFDimensions(30, 50);
      expect(dims.widthMm).toBe(30);
      expect(dims.heightMm).toBe(50);
      expect(dims.orientation).toBe('portrait');
    });

    it('calculates portrait orientation when width equals height', () => {
      const dims = getPDFDimensions(40, 40);
      expect(dims.orientation).toBe('portrait');
    });

    it('exports 40mm x 30mm canvas to binary PDF with %PDF- magic header', () => {
      const pdfBytes = exportCanvasToPDF(mockCanvas, 40, 30);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.byteLength).toBeGreaterThan(100);

      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('exports 30mm x 50mm canvas in portrait orientation', () => {
      const portraitCanvas = createRenderingCanvas(354, 590);
      const pdfBytes = exportCanvasToPDF(portraitCanvas, 30, 50);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.byteLength).toBeGreaterThan(100);

      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('exports canvas to a valid Blob instance via exportCanvasToPDFBlob', () => {
      const blob = exportCanvasToPDFBlob(mockCanvas, 40, 30);

      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(100);
      expect(blob.type).toBe('application/pdf');
    });

    it('throws error when exporting with non-positive dimensions', () => {
      expect(() => exportCanvasToPDF(mockCanvas, 0, 30)).toThrow(
        'PDF page dimensions must be positive numbers.',
      );
      expect(() => exportCanvasToPDF(mockCanvas, 40, -10)).toThrow(
        'PDF page dimensions must be positive numbers.',
      );
      expect(() => exportCanvasToPDFBlob(mockCanvas, -5, 30)).toThrow(
        'PDF page dimensions must be positive numbers.',
      );
    });
  });

  describe('Filename Generation (User Story 3 - P3)', () => {
    it('generates static filename [NoteName]_label.pdf by default', () => {
      const filename = generateLabelFilename('Technology/Projects/MyNote.md');
      expect(filename).toBe('MyNote_label.pdf');
    });

    it('generates filename for note at root without directory prefix', () => {
      const filename = generateLabelFilename('MyNote.md');
      expect(filename).toBe('MyNote_label.pdf');
    });

    it('generates filename for note path without .md extension', () => {
      const filename = generateLabelFilename('Projects/HardwareAsset');
      expect(filename).toBe('HardwareAsset_label.pdf');
    });

    it('appends date timestamp when includeTimestamp is true', () => {
      const mockDate = new Date('2026-10-04T12:00:00Z');
      const filename = generateLabelFilename('Notes/Server.md', {
        includeTimestamp: true,
        date: mockDate,
      });
      expect(filename).toBe('Server_label_2026-10-04.pdf');
    });

    it('normalizes Windows backslashes in note path', () => {
      const filename = generateLabelFilename('Folder\\Nested\\Device.md');
      expect(filename).toBe('Device_label.pdf');
    });
  });

  describe('Path Resolution (User Story 2 - P2)', () => {
    it('resolves same-folder for nested note', () => {
      const path = resolveLabelPDFPath('Technology/Projects/MyNote.md', {
        location: 'same-folder',
      });
      expect(path).toBe('Technology/Projects/MyNote_label.pdf');
    });

    it('resolves same-folder for root-level note without leading slash', () => {
      const path = resolveLabelPDFPath('MyNote.md', {
        location: 'same-folder',
      });
      expect(path).toBe('MyNote_label.pdf');
    });

    it('defaults to same-folder when options or location are omitted', () => {
      expect(resolveLabelPDFPath('Projects/Note.md')).toBe('Projects/Note_label.pdf');
      expect(resolveLabelPDFPath('Note.md')).toBe('Note_label.pdf');
      expect(resolveLabelPDFPath('Note.md', {})).toBe('Note_label.pdf');
    });

    it('resolves dedicated-folder to _labels/ at vault root', () => {
      const path = resolveLabelPDFPath('Technology/Projects/MyNote.md', {
        location: 'dedicated-folder',
      });
      expect(path).toBe('_labels/MyNote_label.pdf');
    });

    it('resolves dedicated-folder for root note to _labels/', () => {
      const path = resolveLabelPDFPath('MyNote.md', {
        location: 'dedicated-folder',
      });
      expect(path).toBe('_labels/MyNote_label.pdf');
    });

    it('resolves custom-folder with clean normalization', () => {
      const path1 = resolveLabelPDFPath('Hardware/Switch.md', {
        location: 'custom-folder',
        customFolder: 'PrintQueue/Pending',
      });
      expect(path1).toBe('PrintQueue/Pending/Switch_label.pdf');

      const path2 = resolveLabelPDFPath('Hardware/Switch.md', {
        location: 'custom-folder',
        customFolder: '/PrintQueue/Pending/',
      });
      expect(path2).toBe('PrintQueue/Pending/Switch_label.pdf');
    });

    it('preserves timestamp in path resolution when configured', () => {
      const mockDate = new Date('2026-10-04T12:00:00Z');
      const path = resolveLabelPDFPath('Projects/MyNote.md', {
        location: 'dedicated-folder',
        naming: { includeTimestamp: true, date: mockDate },
      });
      expect(path).toBe('_labels/MyNote_label_2026-10-04.pdf');
    });
  });

  describe('Vault Directory Creation & Persistence (User Story 2 & 3)', () => {
    let mockVault: MinimalVault;
    let existingPaths: Set<string>;
    let writtenFiles: Map<string, ArrayBuffer>;

    beforeEach(() => {
      existingPaths = new Set(['existing-folder']);
      writtenFiles = new Map();

      mockVault = {
        adapter: {
          exists: jest.fn(async (path: string) => existingPaths.has(path)),
          mkdir: jest.fn(async (folderPath: string) => {
            existingPaths.add(folderPath);
          }),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, data);
            existingPaths.add(path);
          }),
        },
      };
    });

    it('creates nested missing directories recursively before writing', async () => {
      const pdfBytes = new Uint8Array([1, 2, 3, 4]);
      const savedPath = await savePDFToVault(
        mockVault,
        'Archive/Labels/2026/Tool_label.pdf',
        pdfBytes,
      );

      expect(savedPath).toBe('Archive/Labels/2026/Tool_label.pdf');
      expect(mockVault.adapter.mkdir).toHaveBeenCalledWith('Archive');
      expect(mockVault.adapter.mkdir).toHaveBeenCalledWith('Archive/Labels');
      expect(mockVault.adapter.mkdir).toHaveBeenCalledWith('Archive/Labels/2026');
      expect(mockVault.adapter.writeBinary).toHaveBeenCalledWith(
        'Archive/Labels/2026/Tool_label.pdf',
        expect.any(ArrayBuffer),
      );
    });

    it('does not call mkdir when file is at root level', async () => {
      const pdfBytes = new Uint8Array([1, 2, 3, 4]);
      const savedPath = await savePDFToVault(mockVault, 'MyNote_label.pdf', pdfBytes);

      expect(savedPath).toBe('MyNote_label.pdf');
      expect(mockVault.adapter.mkdir).not.toHaveBeenCalled();
      expect(mockVault.adapter.writeBinary).toHaveBeenCalledWith(
        'MyNote_label.pdf',
        expect.any(ArrayBuffer),
      );
    });

    it('cleanly overwrites existing file on regeneration (Overwriting on Regeneration)', async () => {
      const initialBytes = new Uint8Array([1, 2, 3]);
      await savePDFToVault(mockVault, 'Tools/Multimeter_label.pdf', initialBytes);

      const updatedBytes = new Uint8Array([4, 5, 6, 7]);
      await savePDFToVault(mockVault, 'Tools/Multimeter_label.pdf', updatedBytes);

      const written = writtenFiles.get('Tools/Multimeter_label.pdf');
      expect(written).toBeDefined();
      expect(new Uint8Array(written!)).toEqual(updatedBytes);
    });

    it('wraps adapter errors with diagnostic vault write error message', async () => {
      (mockVault.adapter.writeBinary as jest.Mock).mockRejectedValueOnce(
        new Error('Disk I/O error'),
      );

      await expect(
        savePDFToVault(mockVault, 'Folder/Label.pdf', new Uint8Array([1])),
      ).rejects.toThrow("Failed to save PDF to vault at 'Folder/Label.pdf': Disk I/O error");
    });
  });

  describe('LabelGenerator.exportLabelPDF Integration (US1, US2, US3)', () => {
    let generator: LabelGenerator;
    let mockVault: MinimalVault;
    let writtenFiles: Map<string, ArrayBuffer>;

    beforeEach(() => {
      generator = new LabelGenerator();
      writtenFiles = new Map();
      mockVault = {
        adapter: {
          exists: jest.fn(async () => false),
          mkdir: jest.fn(async () => {}),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, data);
          }),
        },
      };
    });

    const validConfig: LabelConfig = {
      size: { width: 40, height: 30, dpi: 300 },
      layout: {
        qrCodePlacement: 'left',
        margins: { top: 2, right: 2, bottom: 2, left: 2 },
      },
      style: {
        fontFamily: 'sans-serif',
        fontSize: 12,
        fontColor: '#000000',
        backgroundColor: '#FFFFFF',
      },
    };

    const validContent: LabelContent = {
      noteTitle: 'Workshop Multimeter',
      notePath: 'Equipment/Multimeter.md',
      obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter.md',
    };

    it('generates, saves, and returns ExportedPDFResult', async () => {
      const result = await generator.exportLabelPDF(mockVault, validConfig, validContent, {
        location: 'same-folder',
      });

      expect(result.filePath).toBe('Equipment/Multimeter_label.pdf');
      expect(result.fileSize).toBeGreaterThan(100);
      expect(result.pdfData).toBeInstanceOf(Uint8Array);
      expect(result.dimensions).toEqual({
        widthMm: 40,
        heightMm: 30,
        orientation: 'landscape',
      });
      expect(writtenFiles.has('Equipment/Multimeter_label.pdf')).toBe(true);
    });

    it('rejects when export options validation fails', async () => {
      await expect(
        generator.exportLabelPDF(mockVault, validConfig, validContent, {
          location: 'custom-folder',
          customFolder: '',
        }),
      ).rejects.toThrow('PDF export options validation failed');
    });
  });
});
