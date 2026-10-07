import {
  App,
  ButtonComponent,
  DropdownComponent,
  Modal,
  Notice,
  Setting,
  SliderComponent,
  TextComponent,
  ToggleComponent,
} from 'obsidian';
import { LabelTemplate } from '../templates/types';
import { saveCustomTemplate, validateTemplate } from '../templates/registry';

export class TemplateEditorModal extends Modal {
  public plugin: any;
  public template: LabelTemplate;
  public isNew: boolean;
  public originalId?: string;
  public onSave?: (template: LabelTemplate) => Promise<void> | void;

  // Accessible component references for tests and UI automation
  public nameInput?: TextComponent;
  public descriptionInput?: TextComponent;
  public widthInput?: TextComponent;
  public heightInput?: TextComponent;
  public qrPlacementDropdown?: DropdownComponent;
  public qrSizeSlider?: SliderComponent;
  public marginsTopInput?: TextComponent;
  public marginsRightInput?: TextComponent;
  public marginsBottomInput?: TextComponent;
  public marginsLeftInput?: TextComponent;
  public textAlignmentDropdown?: DropdownComponent;
  public fontFamilyDropdown?: DropdownComponent;
  public fontSizeInput?: TextComponent;
  public fontColorInput?: TextComponent;
  public backgroundColorInput?: TextComponent;
  public borderWidthInput?: TextComponent;
  public borderColorInput?: TextComponent;
  public showTitleToggle?: ToggleComponent;
  public titleMaxLengthInput?: TextComponent;
  public showPathToggle?: ToggleComponent;
  public showDateCreatedToggle?: ToggleComponent;
  public showDateModifiedToggle?: ToggleComponent;
  public customFieldsInput?: TextComponent;
  public saveButton?: ButtonComponent;
  public cancelButton?: ButtonComponent;

  private customFieldsRaw: string = '';

  constructor(
    app: App,
    plugin: any,
    initialTemplate?: Partial<LabelTemplate>,
    onSave?: (template: LabelTemplate) => Promise<void> | void,
  ) {
    super(app);
    this.plugin = plugin;
    this.onSave = onSave;
    this.isNew = !initialTemplate || !initialTemplate.id;
    this.originalId = initialTemplate?.id;

    // Initialize or clone working template state
    this.template = {
      id: initialTemplate?.id || `tpl-${Date.now().toString(36)}`,
      name: initialTemplate?.name || '',
      description: initialTemplate?.description || '',
      labelSize: {
        width: initialTemplate?.labelSize?.width ?? 89,
        height: initialTemplate?.labelSize?.height ?? 28,
        dpi: initialTemplate?.labelSize?.dpi ?? 300,
      },
      layout: {
        qrCodePlacement: initialTemplate?.layout?.qrCodePlacement ?? 'left',
        qrCodeSize: initialTemplate?.layout?.qrCodeSize ?? 25,
        margins: {
          top: initialTemplate?.layout?.margins?.top ?? 2,
          right: initialTemplate?.layout?.margins?.right ?? 2,
          bottom: initialTemplate?.layout?.margins?.bottom ?? 2,
          left: initialTemplate?.layout?.margins?.left ?? 2,
        },
        textAlignment: initialTemplate?.layout?.textAlignment ?? 'left',
      },
      style: {
        fontFamily: initialTemplate?.style?.fontFamily ?? 'Arial',
        fontSize: initialTemplate?.style?.fontSize ?? 12,
        fontColor: initialTemplate?.style?.fontColor ?? '#000000',
        backgroundColor: initialTemplate?.style?.backgroundColor ?? '#FFFFFF',
        borderWidth: initialTemplate?.style?.borderWidth ?? 1,
        borderColor: initialTemplate?.style?.borderColor ?? '#CCCCCC',
      },
      contentRules: {
        showTitle: initialTemplate?.contentRules?.showTitle ?? true,
        showPath: initialTemplate?.contentRules?.showPath ?? true,
        showDateCreated: initialTemplate?.contentRules?.showDateCreated ?? false,
        showDateModified: initialTemplate?.contentRules?.showDateModified ?? false,
        customFields: initialTemplate?.contentRules?.customFields
          ? [...initialTemplate.contentRules.customFields]
          : [],
        titleMaxLength: initialTemplate?.contentRules?.titleMaxLength ?? 40,
      },
      isBuiltin: false,
    };

    this.customFieldsRaw = this.template.contentRules.customFields.join(', ');
  }

  onOpen(): void {
    this.render();
  }

  render(): void {
    const { contentEl, titleEl } = this;
    contentEl.empty();

    const titleText = this.isNew ? 'Create New Template' : `Edit Template: ${this.template.name}`;
    if (typeof (titleEl as any).setText === 'function') {
      (titleEl as any).setText(titleText);
    } else {
      titleEl.textContent = titleText;
    }

    // ==========================================
    // 1. General Info
    // ==========================================
    contentEl.createEl('h3', { text: 'General Information' });

    new Setting(contentEl)
      .setName('Template Name')
      .setDesc('Display name for this template')
      .addText((text) => {
        this.nameInput = text;
        text
          .setPlaceholder('e.g. Chemical Bottle Label')
          .setValue(this.template.name)
          .onChange((val) => {
            this.template.name = val;
            if (this.isNew) {
              const slug = val
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
              this.template.id = slug
                ? `${slug}-${Date.now().toString(36).slice(-4)}`
                : `tpl-${Date.now().toString(36)}`;
            }
          });
      });

    new Setting(contentEl)
      .setName('Description')
      .setDesc('Help text describing this template')
      .addText((text) => {
        this.descriptionInput = text;
        text
          .setPlaceholder('e.g. Standard label for lab reagents')
          .setValue(this.template.description)
          .onChange((val) => {
            this.template.description = val;
          });
      });

    // ==========================================
    // 2. Physical Dimensions
    // ==========================================
    contentEl.createEl('h3', { text: 'Physical Dimensions (mm)' });

    new Setting(contentEl)
      .setName('Width (mm)')
      .setDesc('Physical label width (15 - 300 mm)')
      .addText((text) => {
        this.widthInput = text;
        text
          .setPlaceholder('89')
          .setValue(String(this.template.labelSize.width))
          .onChange((val) => {
            const num = Number(val);
            if (!isNaN(num)) this.template.labelSize.width = num;
          });
      });

    new Setting(contentEl)
      .setName('Height (mm)')
      .setDesc('Physical label height (15 - 300 mm)')
      .addText((text) => {
        this.heightInput = text;
        text
          .setPlaceholder('28')
          .setValue(String(this.template.labelSize.height))
          .onChange((val) => {
            const num = Number(val);
            if (!isNaN(num)) this.template.labelSize.height = num;
          });
      });

    // ==========================================
    // 3. Layout & QR Placement
    // ==========================================
    contentEl.createEl('h3', { text: 'Layout & QR Placement' });

    new Setting(contentEl)
      .setName('QR Code Placement')
      .setDesc('Spatial placement of QR code relative to content')
      .addDropdown((dropdown) => {
        this.qrPlacementDropdown = dropdown;
        dropdown
          .addOptions({
            left: 'Left',
            right: 'Right',
            top: 'Top',
            bottom: 'Bottom',
            center: 'Center',
            none: 'None (No QR Code)',
          })
          .setValue(this.template.layout.qrCodePlacement)
          .onChange((val) => {
            this.template.layout.qrCodePlacement = val as any;
          });
      });

    new Setting(contentEl)
      .setName('QR Code Size (%)')
      .setDesc('Proportion of label dimension (10% to 100%)')
      .addSlider((slider) => {
        this.qrSizeSlider = slider;
        slider
          .setLimits(10, 100, 5)
          .setValue(this.template.layout.qrCodeSize)
          .setDynamicTooltip()
          .onChange((val) => {
            this.template.layout.qrCodeSize = val;
          });
      });

    new Setting(contentEl)
      .setName('Text Alignment')
      .setDesc('Horizontal alignment for label text')
      .addDropdown((dropdown) => {
        this.textAlignmentDropdown = dropdown;
        dropdown
          .addOptions({
            left: 'Left',
            center: 'Center',
            right: 'Right',
          })
          .setValue(this.template.layout.textAlignment || 'left')
          .onChange((val) => {
            this.template.layout.textAlignment = val as any;
          });
      });

    // Margins
    contentEl.createEl('h4', { text: 'Margins (mm)' });
    const marginsContainer = contentEl.createDiv({ cls: 'template-margins-grid' });

    new Setting(marginsContainer).setName('Top Margin').addText((text) => {
      this.marginsTopInput = text;
      text.setValue(String(this.template.layout.margins.top)).onChange((val) => {
        const num = Number(val);
        if (!isNaN(num)) this.template.layout.margins.top = num;
      });
    });

    new Setting(marginsContainer).setName('Right Margin').addText((text) => {
      this.marginsRightInput = text;
      text.setValue(String(this.template.layout.margins.right)).onChange((val) => {
        const num = Number(val);
        if (!isNaN(num)) this.template.layout.margins.right = num;
      });
    });

    new Setting(marginsContainer).setName('Bottom Margin').addText((text) => {
      this.marginsBottomInput = text;
      text.setValue(String(this.template.layout.margins.bottom)).onChange((val) => {
        const num = Number(val);
        if (!isNaN(num)) this.template.layout.margins.bottom = num;
      });
    });

    new Setting(marginsContainer).setName('Left Margin').addText((text) => {
      this.marginsLeftInput = text;
      text.setValue(String(this.template.layout.margins.left)).onChange((val) => {
        const num = Number(val);
        if (!isNaN(num)) this.template.layout.margins.left = num;
      });
    });

    // ==========================================
    // 4. Typography & Styling
    // ==========================================
    contentEl.createEl('h3', { text: 'Typography & Colors' });

    new Setting(contentEl)
      .setName('Font Family')
      .setDesc('Typography family')
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
          .setValue(this.template.style.fontFamily)
          .onChange((val) => {
            this.template.style.fontFamily = val;
          });
      });

    new Setting(contentEl)
      .setName('Font Size (pt)')
      .setDesc('Nominal typography size in points (4 - 72 pt)')
      .addText((text) => {
        this.fontSizeInput = text;
        text.setValue(String(this.template.style.fontSize)).onChange((val) => {
          const num = Number(val);
          if (!isNaN(num)) this.template.style.fontSize = num;
        });
      });

    new Setting(contentEl)
      .setName('Font Color')
      .setDesc('Hex color code (e.g. #000000)')
      .addText((text) => {
        this.fontColorInput = text;
        text.setValue(this.template.style.fontColor).onChange((val) => {
          this.template.style.fontColor = val;
        });
      });

    new Setting(contentEl)
      .setName('Background Color')
      .setDesc('Hex color code (e.g. #FFFFFF)')
      .addText((text) => {
        this.backgroundColorInput = text;
        text.setValue(this.template.style.backgroundColor).onChange((val) => {
          this.template.style.backgroundColor = val;
        });
      });

    new Setting(contentEl)
      .setName('Border Width (px)')
      .setDesc('Perimeter border stroke in pixels (0 for borderless)')
      .addText((text) => {
        this.borderWidthInput = text;
        text.setValue(String(this.template.style.borderWidth)).onChange((val) => {
          const num = Number(val);
          if (!isNaN(num)) this.template.style.borderWidth = num;
        });
      });

    new Setting(contentEl)
      .setName('Border Color')
      .setDesc('Hex color code for perimeter border stroke')
      .addText((text) => {
        this.borderColorInput = text;
        text.setValue(this.template.style.borderColor).onChange((val) => {
          this.template.style.borderColor = val;
        });
      });

    // ==========================================
    // 5. Content Rules
    // ==========================================
    contentEl.createEl('h3', { text: 'Content Rules' });

    new Setting(contentEl)
      .setName('Show Title')
      .setDesc('Display note title on the label')
      .addToggle((toggle) => {
        this.showTitleToggle = toggle;
        toggle.setValue(this.template.contentRules.showTitle).onChange((val) => {
          this.template.contentRules.showTitle = val;
        });
      });

    new Setting(contentEl)
      .setName('Title Max Length')
      .setDesc('Truncate long titles with an ellipsis (characters)')
      .addText((text) => {
        this.titleMaxLengthInput = text;
        text.setValue(String(this.template.contentRules.titleMaxLength)).onChange((val) => {
          const num = Number(val);
          if (!isNaN(num)) this.template.contentRules.titleMaxLength = num;
        });
      });

    new Setting(contentEl)
      .setName('Show Path')
      .setDesc('Display relative vault folder path on the label')
      .addToggle((toggle) => {
        this.showPathToggle = toggle;
        toggle.setValue(this.template.contentRules.showPath).onChange((val) => {
          this.template.contentRules.showPath = val;
        });
      });

    new Setting(contentEl)
      .setName('Show Date Created')
      .setDesc('Display note creation date (YYYY-MM-DD)')
      .addToggle((toggle) => {
        this.showDateCreatedToggle = toggle;
        toggle.setValue(this.template.contentRules.showDateCreated).onChange((val) => {
          this.template.contentRules.showDateCreated = val;
        });
      });

    new Setting(contentEl)
      .setName('Show Date Modified')
      .setDesc('Display note last modification date (YYYY-MM-DD)')
      .addToggle((toggle) => {
        this.showDateModifiedToggle = toggle;
        toggle.setValue(this.template.contentRules.showDateModified).onChange((val) => {
          this.template.contentRules.showDateModified = val;
        });
      });

    new Setting(contentEl)
      .setName('Custom Frontmatter Fields')
      .setDesc('Comma-separated frontmatter keys to render (e.g. category, location, serial)')
      .addText((text) => {
        this.customFieldsInput = text;
        text.setValue(this.customFieldsRaw).onChange((val) => {
          this.customFieldsRaw = val;
        });
      });

    // ==========================================
    // 6. Action Buttons
    // ==========================================
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    this.saveButton = new ButtonComponent(buttonContainer)
      .setButtonText(this.isNew ? 'Create Template' : 'Save Changes')
      .setCta()
      .onClick(async () => {
        await this.handleSave();
      });

    this.cancelButton = new ButtonComponent(buttonContainer).setButtonText('Cancel').onClick(() => {
      this.close();
    });
  }

  async handleSave(): Promise<void> {
    // Parse custom fields from raw text
    this.template.contentRules.customFields = this.customFieldsRaw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Validate
    const errors = validateTemplate(
      this.template,
      this.plugin.settings?.customTemplates || [],
      this.isNew ? undefined : this.originalId,
    );

    if (errors.length > 0) {
      new Notice(`Cannot save template:\n• ${errors.join('\n• ')}`);
      return;
    }

    // Save to settings
    this.plugin.settings = saveCustomTemplate(this.plugin.settings, this.template);
    if (typeof this.plugin.saveSettings === 'function') {
      await this.plugin.saveSettings();
    }

    new Notice(`Template "${this.template.name}" saved.`);
    if (this.onSave) {
      await this.onSave(this.template);
    }
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
