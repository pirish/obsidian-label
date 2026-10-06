import { App, ButtonComponent, Modal } from 'obsidian';

/**
 * Confirmation dialog before running vault batch label regeneration.
 */
export class BatchConfirmModal extends Modal {
  public eligibleCount: number;
  public onConfirm: () => Promise<void>;
  public confirmButton?: ButtonComponent;
  public cancelButton?: ButtonComponent;

  constructor(app: App, eligibleCount: number, onConfirm: () => Promise<void>) {
    super(app);
    this.eligibleCount = eligibleCount;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    contentEl.empty();

    if (typeof (titleEl as any).setText === 'function') {
      (titleEl as any).setText('Regenerate All Labels in Vault');
    } else {
      titleEl.textContent = 'Regenerate All Labels in Vault';
    }

    const warningText =
      this.eligibleCount === 1
        ? 'Are you sure you want to regenerate labels for 1 note? Existing label PDFs will be overwritten.'
        : `Are you sure you want to regenerate labels for ${this.eligibleCount} notes? Existing label PDFs will be overwritten.`;

    contentEl.createEl('p', {
      text: warningText,
      cls: 'setting-item-description',
    });

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    this.confirmButton = new ButtonComponent(buttonContainer)
      .setButtonText('Regenerate All')
      .setWarning()
      .onClick(async () => {
        await this.onConfirm();
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
