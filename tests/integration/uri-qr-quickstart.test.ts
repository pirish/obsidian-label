import {
  generateObsidianURI,
  generateNativeObsidianURI,
  generateQRMatrix,
  generateQRDataURL,
  validateURIConfig,
  validateQROptions,
  defaultGenerator,
  LabelConfig,
} from '../../src/index';

describe('Feature 002 Quickstart Guide Verification (quickstart.md)', () => {
  it('verifies Scenario 1: Standard Obsidian URI Generation (P1 MVP)', () => {
    const uri1 = generateObsidianURI('Personal', 'Workshop/Tools/Multimeter.md');
    expect(uri1).toBe('obsidian://open?vault=Personal&file=Workshop%2FTools%2FMultimeter.md');

    const uriRoot = generateObsidianURI('Personal', 'MyNote.md');
    expect(uriRoot).toBe('obsidian://open?vault=Personal&file=MyNote.md');

    const nativeUri = generateNativeObsidianURI(
      undefined,
      { path: 'Hardware/Tool.md', name: 'Tool.md', basename: 'Tool', extension: 'md' },
      'Fallback',
    );
    expect(nativeUri).toBe('obsidian://open?vault=Fallback&file=Hardware%2FTool.md');
  });

  it('verifies Scenario 2: Special Characters, Spaces & Unicode Encoding (P2)', () => {
    const uriSpaces = generateObsidianURI('Work & Life', 'Projects/C++ & Rust/Notes 2026.md');
    expect(uriSpaces).toBe(
      'obsidian://open?vault=Work%20%26%20Life&file=Projects%2FC%2B%2B%20%26%20Rust%2FNotes%202026.md',
    );

    const uriUnicode = generateObsidianURI('Reisen', 'München/Reiseführer 🇩🇪.md');
    expect(uriUnicode).toBe(
      'obsidian://open?vault=Reisen&file=M%C3%BCnchen%2FReisef%C3%BChrer%20%F0%9F%87%A9%F0%9F%87%AA.md',
    );
  });

  it('verifies Scenario 3: QR Matrix Generation & Error Correction Levels (P3)', () => {
    const uri = generateObsidianURI('Personal', 'Workshop/Tools/Multimeter.md');

    const matrixL = generateQRMatrix(uri, { errorCorrectionLevel: 'L' });
    const matrixM = generateQRMatrix(uri, { errorCorrectionLevel: 'M' });
    const matrixH = generateQRMatrix(uri, { errorCorrectionLevel: 'H' });

    expect(matrixL.errorCorrectionLevel).toBe('L');
    expect(matrixM.errorCorrectionLevel).toBe('M');
    expect(matrixH.errorCorrectionLevel).toBe('H');
    expect(matrixH.size).toBeGreaterThanOrEqual(matrixL.size);
  });

  it('verifies Scenario 4: Async QR Data URL Generation', async () => {
    const uri = generateObsidianURI('Personal', 'Workshop/Tools/Multimeter.md');
    const dataUrl = await generateQRDataURL(uri, {
      width: 300,
      errorCorrectionLevel: 'H',
      margin: 1,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
    });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('verifies Scenario 5: Input Validation & Error Diagnostics', () => {
    const invalidVault = validateURIConfig({ vault: '', filePath: 'Note.md' });
    expect(invalidVault.isValid).toBe(false);
    expect(invalidVault.errors[0].code).toBe('EMPTY_VAULT');

    const invalidPath = validateURIConfig({ vault: 'Vault', filePath: '' });
    expect(invalidPath.isValid).toBe(false);
    expect(invalidPath.errors[0].code).toBe('EMPTY_FILE_PATH');

    const invalidEC = validateQROptions({ errorCorrectionLevel: 'INVALID' as unknown as 'M' });
    expect(invalidEC.isValid).toBe(false);
    expect(invalidEC.errors[0].code).toBe('INVALID_EC_LEVEL');
  });

  it('verifies End-to-End Label Generation with new URI and QR options', async () => {
    const content = defaultGenerator.createContent(
      'Work & Life',
      'Industrial Drill ⚡',
      'Workshop/Heavy Equipment/Drill.md',
      {
        customFields: { AssetID: 'EQ-9921', Status: 'Active' },
      },
    );

    const config: LabelConfig = {
      size: { width: 50, height: 30, dpi: 300 },
      qrOptions: {
        errorCorrectionLevel: 'H',
        margin: 1,
        darkColor: '#000000',
        lightColor: '#FFFFFF',
      },
      layout: {
        qrCodePlacement: 'left',
        qrCodeSize: 0.7,
      },
    };

    const rendered = await defaultGenerator.generate(config, content);
    expect(rendered.previewDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(rendered.pdfData).toBeInstanceOf(Uint8Array);
    expect(rendered.pdfData.length).toBeGreaterThan(100);
  });
});
