import { CustomLabelModal } from '../../src/ui/custom-label-modal';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { App, TFile } from '../../tests/mocks/obsidian';

describe('CustomLabelModal - User Story 2 (P2)', () => {
  let mockApp: App;
  let mockFile: TFile;

  beforeEach(() => {
    mockFile = new TFile('Equipment/Oscilloscope.md');
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => mockFile),
      },
      vault: {
        getName: jest.fn(() => 'TestVault'),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
  });

  it('renders with pre-populated default settings', () => {
    const onGenerate = jest.fn(async () => {});
    const modal = new CustomLabelModal(
      mockApp as any,
      mockFile as any,
      DEFAULT_SETTINGS,
      onGenerate,
    );

    modal.open();

    expect(modal.presetDropdown).toBeDefined();
    expect(modal.qrPlacementDropdown).toBeDefined();
    expect(modal.saveFrontmatterToggle).toBeDefined();
    expect(modal.presetDropdown?.getValue()).toBe('dymo-standard');
    expect(modal.qrPlacementDropdown?.getValue()).toBe('left');
  });

  it('dynamically reveals custom width and height inputs when custom preset is selected', async () => {
    const onGenerate = jest.fn(async () => {});
    const modal = new CustomLabelModal(
      mockApp as any,
      mockFile as any,
      DEFAULT_SETTINGS,
      onGenerate,
    );

    modal.open();
    expect(modal.customWidthInput).toBeUndefined();

    await (modal.presetDropdown as any)?.triggerChange('custom');

    expect(modal.customWidthInput).toBeDefined();
    expect(modal.customHeightInput).toBeDefined();
  });

  it('triggers onGenerate with overrides when Generate Label button is clicked', async () => {
    const onGenerate = jest.fn(async () => {});
    const modal = new CustomLabelModal(
      mockApp as any,
      mockFile as any,
      DEFAULT_SETTINGS,
      onGenerate,
    );

    modal.open();

    // Select different preset and QR placement
    await (modal.presetDropdown as any)?.triggerChange('brother-62mm');
    await (modal.qrPlacementDropdown as any)?.triggerChange('top');
    await (modal.saveFrontmatterToggle as any)?.triggerChange(true);

    expect(modal.generateButton).toBeDefined();
    await (modal.generateButton as any)?.triggerClick();

    expect(onGenerate).toHaveBeenCalledWith({
      defaultLabelSize: 'brother-62mm',
      qrCodePlacement: 'top',
      qrCodeSize: 25,
      saveToFrontmatter: true,
      customWidth: 89,
      customHeight: 28,
    });
    expect((modal as any).isOpen).toBe(false);
  });

  it('closes cleanly without invoking onGenerate when canceled', async () => {
    const onGenerate = jest.fn(async () => {});
    const modal = new CustomLabelModal(
      mockApp as any,
      mockFile as any,
      DEFAULT_SETTINGS,
      onGenerate,
    );

    modal.open();
    expect(modal.cancelButton).toBeDefined();
    await (modal.cancelButton as any)?.triggerClick();

    expect(onGenerate).not.toHaveBeenCalled();
    expect((modal as any).isOpen).toBe(false);
  });

  it('renders template dropdown and sets templateId on change', async () => {
    const onGenerate = jest.fn(async () => {});
    const modal = new CustomLabelModal(
      mockApp as any,
      mockFile as any,
      DEFAULT_SETTINGS,
      onGenerate,
    );

    modal.open();
    expect(modal.templateDropdown).toBeDefined();
    expect(modal.templateDropdown?.getValue()).toBe('standard');

    await (modal.templateDropdown as any)?.triggerChange('compact');
    expect(modal.overrides.templateId).toBe('compact');
    expect(modal.overrides.customWidth).toBe(30);
    expect(modal.overrides.customHeight).toBe(30);
  });
});
