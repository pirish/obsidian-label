import {
  App,
  ButtonComponent,
  DropdownComponent,
  Modal,
  Notice,
  Setting,
  TextComponent,
  TFile,
  ToggleComponent,
} from 'obsidian';
import { CustomLabelOverride } from '../commands/orchestrator';
import { LabelPresetOption, ObsidianLabelSettings, QRPlacementOption } from '../settings/types';
import { getAllTemplates } from '../templates/registry';

/**
 * Modal dialog for per-note custom settings overrides.
 */
export class CustomLabelModal extends Modal {
  public file: TFile;
  public currentSettings: ObsidianLabelSettings;
  public onGenerate: (overrides: CustomLabelOverride) => Promise<void>;
  public overrides: CustomLabelOverride;

  // Accessible component references for tests
  public templateDropdown?: DropdownComponent;
  public presetDropdown?: DropdownComponent;
  public customWidthInput?: TextComponent;
  public customHeightInput?: TextComponent;
  public qrPlacementDropdown?: DropdownComponent;
  public saveFrontmatterToggle?: ToggleComponent;
  public generateButton?: ButtonComponent;
  public cancelButton?: ButtonComponent;

  constructor(
    app: App,
    file: TFile,
    currentSettings: ObsidianLabelSettings,
    onGenerate: (overrides: CustomLabelOverride) => Promise<void>,
  ) {
    super(app);
    this.file = file;
    this.currentSettings = currentSettings;
    this.onGenerate = onGenerate;
    this.overrides = {
      defaultLabelSize: currentSettings.defaultLabelSize,
      customWidth: currentSettings.customWidth,
      customHeight: currentSettings.customHeight,
      qrCodePlacement: currentSettings.qrCodePlacement,
      qrCodeSize: currentSettings.qrCodeSize,
      saveToFrontmatter: false,
    };
  }

  onOpen(): void {
    this.render();
  }

  render(): void {
    const { contentEl, titleEl } = this;
    contentEl.empty();

    if (typeof (titleEl as any).setText === 'function') {
      (titleEl as any).setText(`Custom Label: ${this.file.basename}`);
    } else {
      titleEl.textContent = `Custom Label: ${this.file.basename}`;
    }

    // Template selection
    const allTemplates = getAllTemplates(this.currentSettings);
    new Setting(contentEl)
      .setName('Template')
      .setDesc('Select a label template for this note')
      .addDropdown((dropdown) => {
        this.templateDropdown = dropdown;
        allTemplates.forEach((tpl) => {
          const isCustom = !['standard', 'compact', 'inventory'].includes(tpl.id);
          dropdown.addOption(tpl.id, isCustom ? `${tpl.name} (custom)` : tpl.name);
        });
        dropdown
          .setValue(this.overrides.templateId || this.currentSettings.defaultTemplate || 'standard')
          .onChange(async (val: string) => {
            this.overrides.templateId = val;
            const chosen = allTemplates.find((t) => t.id === val);
            if (chosen) {
              this.overrides.customWidth = chosen.labelSize.width;
              this.overrides.customHeight = chosen.labelSize.height;
              this.overrides.qrCodePlacement = chosen.layout.qrCodePlacement as any;
              this.overrides.qrCodeSize = chosen.layout.qrCodeSize;
            }
          });
      });

    // Label size dropdown
    new Setting(contentEl)
      .setName('Label Size Override')
      .setDesc('Select a label stock preset or custom dimensions for this label')
      .addDropdown((dropdown) => {
        this.presetDropdown = dropdown;
        dropdown
          .addOptions({
            'dymo-standard': 'Dymo Standard (89×28mm)',
            'brother-62mm': 'Brother 62mm (62×100mm)',
            'avery-5160': 'Avery 5160 (66.7×25.4mm)',
            'phomemo-40x30': 'Phomemo 40×30mm (40×30mm)',
            'generic-square-50': 'Generic Square (50×50mm)',
            custom: 'Custom Size',
          })
          .setValue(this.overrides.defaultLabelSize || this.currentSettings.defaultLabelSize)
          .onChange(async (val: string) => {
            this.overrides.defaultLabelSize = val as LabelPresetOption;
            this.render();
          });
      });

    // Custom dimensions if 'custom' is active
    if (this.overrides.defaultLabelSize === 'custom') {
      new Setting(contentEl).setName('Width (mm)').addText((text) => {
        this.customWidthInput = text;
        text
          .setPlaceholder('89')
          .setValue(String(this.overrides.customWidth ?? this.currentSettings.customWidth))
          .onChange(async (val) => {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              this.overrides.customWidth = num;
            }
          });
      });

      new Setting(contentEl).setName('Height (mm)').addText((text) => {
        this.customHeightInput = text;
        text
          .setPlaceholder('28')
          .setValue(String(this.overrides.customHeight ?? this.currentSettings.customHeight))
          .onChange(async (val) => {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              this.overrides.customHeight = num;
            }
          });
      });
    } else {
      this.customWidthInput = undefined;
      this.customHeightInput = undefined;
    }

    // QR Placement
    new Setting(contentEl)
      .setName('QR Code Placement')
      .setDesc('Override QR code placement relative to note title')
      .addDropdown((dropdown) => {
        this.qrPlacementDropdown = dropdown;
        dropdown
          .addOptions({
            left: 'Left',
            right: 'Right',
            top: 'Top',
            bottom: 'Bottom',
          })
          .setValue(this.overrides.qrCodePlacement || this.currentSettings.qrCodePlacement)
          .onChange(async (val: string) => {
            this.overrides.qrCodePlacement = val as QRPlacementOption;
          });
      });

    // Save as note default toggle
    new Setting(contentEl)
      .setName('Save as note default')
      .setDesc('Persist these custom settings to the note frontmatter for future generations')
      .addToggle((toggle) => {
        this.saveFrontmatterToggle = toggle;
        toggle
          .setValue(this.overrides.saveToFrontmatter || false)
          .onChange(async (val: boolean) => {
            this.overrides.saveToFrontmatter = val;
          });
      });

    // Action buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    this.generateButton = new ButtonComponent(buttonContainer)
      .setButtonText('Generate Label')
      .setCta()
      .onClick(async () => {
        if (this.overrides.defaultLabelSize === 'custom') {
          if (
            !this.overrides.customWidth ||
            this.overrides.customWidth <= 0 ||
            !this.overrides.customHeight ||
            this.overrides.customHeight <= 0
          ) {
            new Notice('Please specify valid positive custom dimensions.');
            return;
          }
        }
        await this.onGenerate(this.overrides);
        this.close();
      });

    this.cancelButton = new ButtonComponent(buttonContainer).setButtonText('Cancel').onClick(() => {
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
