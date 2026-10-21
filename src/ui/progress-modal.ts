import { App, Modal } from 'obsidian';

/**
 * Modal displaying live progress status and a visual progress bar during batch label generation.
 */
export class ProgressModal extends Modal {
  public total: number;
  public current: number = 0;
  public progressBar!: HTMLDivElement;
  public statusText!: HTMLParagraphElement;

  constructor(app: App, total: number) {
    super(app);
    this.total = total;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Generating Labels' });

    this.statusText = contentEl.createEl('p', {
      text: `0 / ${this.total}`,
    }) as unknown as HTMLParagraphElement;

    const progressContainer = contentEl.createDiv('progress-container');
    this.progressBar = progressContainer.createDiv('progress-bar') as unknown as HTMLDivElement;
    this.progressBar.style.width = '0%';
  }

  update(current: number): void {
    this.current = current;
    const percentage = this.total > 0 ? (current / this.total) * 100 : 0;

    if (this.statusText) {
      if (typeof (this.statusText as any).setText === 'function') {
        (this.statusText as any).setText(`${current} / ${this.total}`);
      } else {
        this.statusText.textContent = `${current} / ${this.total}`;
      }
    }

    if (this.progressBar && this.progressBar.style) {
      this.progressBar.style.width = `${percentage}%`;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
