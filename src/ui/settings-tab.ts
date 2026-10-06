import {
  App,
  ButtonComponent,
  DropdownComponent,
  Notice,
  PluginSettingTab,
  Setting,
  SliderComponent,
  TextComponent,
  ToggleComponent,
} from 'obsidian';
import { isValidColor } from '../core/validator';
import { LabelPresetOption, OutputFolderOption, QRPlacementOption } from '../settings/types';

/**
 * Settings tab for configuring Obsidian Label options.
 */
export class ObsidianLabelSettingTab extends PluginSettingTab {
  public plugin: any;

  // Accessible component references for testing and UI automation
  public presetDropdown?: DropdownComponent;
  public customWidthInput?: TextComponent;
  public customHeightInput?: TextComponent;
  public qrPlacementDropdown?: DropdownComponent;
  public qrSizeSlider?: SliderComponent;
  public fontFamilyDropdown?: DropdownComponent;
  public fontSizeInput?: TextComponent;
  public fontColorInput?: TextComponent;
  public backgroundColorInput?: TextComponent;
  public borderWidthInput?: TextComponent;
  public borderColorInput?: TextComponent;
  public outputFolderDropdown?: DropdownComponent;
  public customOutputPathInput?: TextComponent;
  public timestampToggle?: ToggleComponent;
  public printerNameInput?: TextComponent;
  public autoPrintToggle?: ToggleComponent;
  public previewButton?: ButtonComponent;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsidian Label Settings' });

    // ==========================================
    // 1. Label Dimensions & Presets (User Story 1)
    // ==========================================
    containerEl.createEl('h3', { text: 'Label Media & Sizing' });

    new Setting(containerEl)
      .setName('Label Size')
      .setDesc('Select standard label stock or specify custom dimensions')
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
          .setValue(this.plugin.settings.defaultLabelSize)
          .onChange(async (value: string) => {
            this.plugin.settings.defaultLabelSize = value as LabelPresetOption;
            await this.plugin.saveSettings();
            this.display(); // re-render to toggle custom fields
          });
      });

    if (this.plugin.settings.defaultLabelSize === 'custom') {
      new Setting(containerEl)
        .setName('Custom Width (mm)')
        .setDesc('Physical label width in millimeters')
        .addText((text) => {
          this.customWidthInput = text;
          text
            .setPlaceholder('89')
            .setValue(String(this.plugin.settings.customWidth))
            .onChange(async (val: string) => {
              const num = Number(val);
              if (isNaN(num) || num <= 0) {
                new Notice('Custom width must be a positive number of millimeters.');
                return;
              }
              this.plugin.settings.customWidth = num;
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName('Custom Height (mm)')
        .setDesc('Physical label height in millimeters')
        .addText((text) => {
          this.customHeightInput = text;
          text
            .setPlaceholder('28')
            .setValue(String(this.plugin.settings.customHeight))
            .onChange(async (val: string) => {
              const num = Number(val);
              if (isNaN(num) || num <= 0) {
                new Notice('Custom height must be a positive number of millimeters.');
                return;
              }
              this.plugin.settings.customHeight = num;
              await this.plugin.saveSettings();
            });
        });
    } else {
      this.customWidthInput = undefined;
      this.customHeightInput = undefined;
    }

    // ==========================================
    // 2. QR Code Layout (User Story 2)
    // ==========================================
    containerEl.createEl('h3', { text: 'QR Code Layout' });

    new Setting(containerEl)
      .setName('QR Code Placement')
      .setDesc('Spatial placement of the QR code relative to text')
      .addDropdown((dropdown) => {
        this.qrPlacementDropdown = dropdown;
        dropdown
          .addOptions({
            left: 'Left',
            right: 'Right',
            top: 'Top',
            bottom: 'Bottom',
          })
          .setValue(this.plugin.settings.qrCodePlacement)
          .onChange(async (value: string) => {
            this.plugin.settings.qrCodePlacement = value as QRPlacementOption;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('QR Code Size')
      .setDesc('Proportion of label dimension (10% to 50%)')
      .addSlider((slider) => {
        this.qrSizeSlider = slider;
        slider
          .setLimits(10, 50, 5)
          .setValue(this.plugin.settings.qrCodeSize)
          .setDynamicTooltip()
          .onChange(async (value: number) => {
            this.plugin.settings.qrCodeSize = value;
            await this.plugin.saveSettings();
          });
      });

    // ==========================================
    // 3. Visual Styling & Typography (User Story 2)
    // ==========================================
    containerEl.createEl('h3', { text: 'Typography & Colors' });

    new Setting(containerEl)
      .setName('Font Family')
      .setDesc('CSS font family for label typography')
      .addDropdown((dropdown) => {
        this.fontFamilyDropdown = dropdown;
        dropdown
          .addOptions({
            Arial: 'Arial',
            'Courier New': 'Courier New',
            Georgia: 'Georgia',
            'Times New Roman': 'Times New Roman',
            Verdana: 'Verdana',
            'sans-serif': 'System Sans-Serif',
          })
          .setValue(this.plugin.settings.fontFamily)
          .onChange(async (value: string) => {
            this.plugin.settings.fontFamily = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Font Size (pt)')
      .setDesc('Nominal typography size in points for note title')
      .addText((text) => {
        this.fontSizeInput = text;
        text
          .setPlaceholder('12')
          .setValue(String(this.plugin.settings.fontSize))
          .onChange(async (val: string) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
              new Notice('Font size must be greater than 0.');
              return;
            }
            this.plugin.settings.fontSize = num;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Font Color')
      .setDesc('Hex color for typography and dark QR modules')
      .addText((text) => {
        this.fontColorInput = text;
        text
          .setPlaceholder('#000000')
          .setValue(this.plugin.settings.fontColor)
          .onChange(async (val: string) => {
            if (!isValidColor(val)) {
              new Notice('Invalid font hex color format (e.g. #000000).');
              return;
            }
            this.plugin.settings.fontColor = val;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Background Color')
      .setDesc('Hex color for label background and light QR modules')
      .addText((text) => {
        this.backgroundColorInput = text;
        text
          .setPlaceholder('#FFFFFF')
          .setValue(this.plugin.settings.backgroundColor)
          .onChange(async (val: string) => {
            if (!isValidColor(val)) {
              new Notice('Invalid background hex color format (e.g. #FFFFFF).');
              return;
            }
            this.plugin.settings.backgroundColor = val;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Border Width (px)')
      .setDesc('Perimeter border thickness in pixels (0 for borderless)')
      .addText((text) => {
        this.borderWidthInput = text;
        text
          .setPlaceholder('1')
          .setValue(String(this.plugin.settings.borderWidth))
          .onChange(async (val: string) => {
            const num = Number(val);
            if (isNaN(num) || num < 0) {
              new Notice('Border width must be non-negative.');
              return;
            }
            this.plugin.settings.borderWidth = num;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Border Color')
      .setDesc('Hex color for perimeter border stroke')
      .addText((text) => {
        this.borderColorInput = text;
        text
          .setPlaceholder('#CCCCCC')
          .setValue(this.plugin.settings.borderColor)
          .onChange(async (val: string) => {
            if (!isValidColor(val)) {
              new Notice('Invalid border hex color format (e.g. #CCCCCC).');
              return;
            }
            this.plugin.settings.borderColor = val;
            await this.plugin.saveSettings();
          });
      });

    // ==========================================
    // 4. PDF Output Destination & Naming (User Story 3)
    // ==========================================
    containerEl.createEl('h3', { text: 'PDF Export & Storage' });

    new Setting(containerEl)
      .setName('Output Folder')
      .setDesc('Vault location strategy for saving exported PDF labels')
      .addDropdown((dropdown) => {
        this.outputFolderDropdown = dropdown;
        dropdown
          .addOptions({
            'same-as-note': 'Same folder as note (default)',
            'dedicated-folder': 'Dedicated labels folder (_labels/)',
            custom: 'Custom vault folder',
          })
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value: string) => {
            this.plugin.settings.outputFolder = value as OutputFolderOption;
            await this.plugin.saveSettings();
            this.display(); // re-render to toggle custom path field
          });
      });

    if (this.plugin.settings.outputFolder === 'custom') {
      new Setting(containerEl)
        .setName('Custom Output Path')
        .setDesc('Vault-relative directory path for exported PDF labels')
        .addText((text) => {
          this.customOutputPathInput = text;
          text
            .setPlaceholder('PrintQueue/Pending')
            .setValue(this.plugin.settings.customOutputPath)
            .onChange(async (val: string) => {
              this.plugin.settings.customOutputPath = val;
              await this.plugin.saveSettings();
            });
        });
    } else {
      this.customOutputPathInput = undefined;
    }

    new Setting(containerEl)
      .setName('Include Date Timestamp in Filename')
      .setDesc('Appends _YYYY-MM-DD date stamp to filename (e.g. Note_label_2026-10-05.pdf)')
      .addToggle((toggle) => {
        this.timestampToggle = toggle;
        toggle.setValue(this.plugin.settings.includeTimestamp).onChange(async (value: boolean) => {
          this.plugin.settings.includeTimestamp = value;
          await this.plugin.saveSettings();
        });
      });

    // ==========================================
    // 5. Print Helper Preferences (User Story 3)
    // ==========================================
    containerEl.createEl('h3', { text: 'Print Helper Preferences' });

    new Setting(containerEl)
      .setName('Printer Name')
      .setDesc('Optional system printer name for external print helper scripts')
      .addText((text) => {
        this.printerNameInput = text;
        text
          .setPlaceholder('e.g. Brother QL-800')
          .setValue(this.plugin.settings.printerName)
          .onChange(async (val: string) => {
            this.plugin.settings.printerName = val;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Auto-Print after Generation')
      .setDesc('Automatically trigger printing workflow upon label generation')
      .addToggle((toggle) => {
        this.autoPrintToggle = toggle;
        toggle.setValue(this.plugin.settings.autoPrint).onChange(async (value: boolean) => {
          this.plugin.settings.autoPrint = value;
          await this.plugin.saveSettings();
        });
      });

    // ==========================================
    // 6. Live Sample Preview (User Story 4)
    // ==========================================
    containerEl.createEl('h3', { text: 'Live Sample Preview' });

    new Setting(containerEl)
      .setName('Preview Label')
      .setDesc('Generate and inspect a sample label with current active settings')
      .addButton((button) => {
        this.previewButton = button;
        button.setButtonText('Preview Label').onClick(async () => {
          if (typeof this.plugin.generatePreviewLabel === 'function') {
            await this.plugin.generatePreviewLabel();
          }
        });
      });
  }
}
