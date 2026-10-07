import { App, ButtonComponent, Modal, Notice, Setting } from 'obsidian';
import { LabelTemplate } from '../templates/types';
import {
  deleteCustomTemplate,
  duplicateTemplate,
  getBuiltinTemplates,
} from '../templates/registry';
import { TemplateEditorModal } from './template-editor-modal';

export class TemplateManagerModal extends Modal {
  public plugin: any;
  public createTemplateButton?: ButtonComponent;

  constructor(app: App, plugin: any) {
    super(app);
    this.plugin = plugin;
  }

  onOpen(): void {
    this.render();
  }

  render(): void {
    const { contentEl, titleEl } = this;
    contentEl.empty();

    const titleText = 'Template Manager';
    if (typeof (titleEl as any).setText === 'function') {
      (titleEl as any).setText(titleText);
    } else {
      titleEl.textContent = titleText;
    }

    // ==========================================
    // 1. Built-in Templates (Read-only / Duplicate)
    // ==========================================
    contentEl.createEl('h3', { text: 'Built-in Templates' });
    const builtins = getBuiltinTemplates();

    for (const tpl of builtins) {
      const itemEl = contentEl.createDiv({ cls: 'template-manager-item builtin' });
      const dims = `${tpl.labelSize.width}×${tpl.labelSize.height} mm`;

      new Setting(itemEl)
        .setName(tpl.name)
        .setDesc(`${tpl.description} (${dims})`)
        .addButton((btn) => {
          btn
            .setButtonText('Duplicate as Custom')
            .setTooltip('Create an editable custom copy of this built-in template')
            .onClick(() => {
              this.duplicate(tpl);
            });
        });
    }

    // ==========================================
    // 2. Custom Templates (Manage / Edit / Delete)
    // ==========================================
    contentEl.createEl('h3', { text: 'Custom Templates' });
    const customTemplates: LabelTemplate[] = Array.isArray(this.plugin.settings?.customTemplates)
      ? this.plugin.settings.customTemplates
      : [];

    if (customTemplates.length === 0) {
      const emptyEl = contentEl.createEl('p', {
        cls: 'template-empty-message',
        text: 'No custom templates created yet. Click "Create New Template" below to build your first layout.',
      });
      emptyEl.style.color = 'var(--text-muted)';
      emptyEl.style.fontStyle = 'italic';
    } else {
      for (const tpl of customTemplates) {
        const itemEl = contentEl.createDiv({ cls: 'template-manager-item custom' });
        const dims = `${tpl.labelSize.width}×${tpl.labelSize.height} mm`;
        const isActive = this.plugin.settings?.defaultTemplate === tpl.id;
        const nameText = isActive ? `${tpl.name} [Default]` : tpl.name;

        new Setting(itemEl)
          .setName(nameText)
          .setDesc(`${tpl.description || 'Custom template'} (${dims})`)
          .addButton((btn) => {
            btn.setButtonText('Edit').onClick(() => {
              this.editTemplate(tpl);
            });
          })
          .addButton((btn) => {
            btn
              .setButtonText('Duplicate')
              .setTooltip('Create an editable copy')
              .onClick(() => {
                this.duplicate(tpl);
              });
          })
          .addButton((btn) => {
            btn
              .setButtonText('Delete')
              .setWarning()
              .onClick(async () => {
                await this.deleteTemplate(tpl.id, tpl.name);
              });
          });
      }
    }

    // ==========================================
    // 3. Create New Template CTA
    // ==========================================
    const ctaContainer = contentEl.createDiv({ cls: 'template-manager-cta' });
    ctaContainer.style.marginTop = '20px';

    new Setting(ctaContainer).addButton((btn) => {
      this.createTemplateButton = btn;
      btn
        .setButtonText('Create New Template')
        .setCta()
        .onClick(() => {
          this.createTemplate();
        });
    });
  }

  createTemplate(): void {
    const editor = new TemplateEditorModal(this.app, this.plugin, undefined, async () => {
      this.render();
    });
    editor.open();
  }

  editTemplate(template: LabelTemplate): void {
    const editor = new TemplateEditorModal(this.app, this.plugin, template, async () => {
      this.render();
    });
    editor.open();
  }

  duplicate(template: LabelTemplate): void {
    const duplicated = duplicateTemplate(template);
    const editor = new TemplateEditorModal(this.app, this.plugin, duplicated, async () => {
      this.render();
    });
    editor.open();
  }

  async deleteTemplate(templateId: string, templateName?: string): Promise<void> {
    const name = templateName || templateId;
    const { updatedSettings, wasActive } = deleteCustomTemplate(this.plugin.settings, templateId);

    this.plugin.settings = updatedSettings;
    if (typeof this.plugin.saveSettings === 'function') {
      await this.plugin.saveSettings();
    }

    if (wasActive) {
      new Notice(`Template "${name}" deleted. Default template reset to "Standard".`);
    } else {
      new Notice(`Template "${name}" deleted.`);
    }

    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
