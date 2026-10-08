import { App, ButtonComponent, Modal, Setting, ToggleComponent } from 'obsidian';

/**
 * Confirmation dialog before running vault batch label regeneration.
 */
export class BatchConfirmModal extends Modal {
  public eligibleCount: number;
  public onConfirm: (alsoPrint?: boolean) => Promise<void>;
  public confirmButton?: ButtonComponent;
  public cancelButton?: ButtonComponent;
  public alsoPrintToggle?: ToggleComponent;
  public autoPrintEnabled: boolean;
  public printerName: string;
  public alsoPrint: boolean = false;

  constructor(
    app: App,
    eligibleCount: number,
    onConfirm: (alsoPrint?: boolean) => Promise<void>,
    autoPrintEnabled: boolean = false,
    printerName: string = '',
  ) {
    super(app);
    this.eligibleCount = eligibleCount;
    this.onConfirm = onConfirm;
    this.autoPrintEnabled = autoPrintEnabled;
    this.printerName = printerName;
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

    if (this.autoPrintEnabled) {
      new Setting(contentEl)
        .setName('Send regenerated labels to printer')
        .setDesc(
          this.printerName
            ? `Auto-print is enabled. Send all ${this.eligibleCount} labels to printer "${this.printerName}"?`
            : `Auto-print is enabled. Send all ${this.eligibleCount} labels to configured printer?`,
        )
        .addToggle((toggle) => {
          this.alsoPrintToggle = toggle;
          toggle.setValue(false).onChange((val) => {
            this.alsoPrint = val;
          });
        });
    }

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    this.confirmButton = new ButtonComponent(buttonContainer)
      .setButtonText('Regenerate All')
      .setWarning()
      .onClick(async () => {
        await this.onConfirm(this.alsoPrint);
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
