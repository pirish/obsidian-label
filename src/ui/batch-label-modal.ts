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
import {
  BatchSelectionMethod,
  discoverVaultFolders,
  filterNotesByFolder,
  filterNotesBySearch,
  filterNotesByTag,
} from '../commands/batch-processor';
import { generateLabelForNote } from '../commands/orchestrator';
import { getBatchPage, mergeBatchPDFPages, PDFPageSpec } from '../core/pdf-exporter';
import { settingsToLabelConfig } from '../settings/mappers';
import { DEFAULT_SETTINGS } from '../settings/types';
import { ProgressModal } from './progress-modal';

/**
 * Modal for selecting multiple vault notes (by folder, tag, or search query),
 * previewing matched notes, generating labels in batch with a progress indicator,
 * and optionally merging outputs into a single multi-page PDF.
 */
export class BatchLabelModal extends Modal {
  public plugin: any;
  public selectedNotes: TFile[] = [];
  public selectionMethod: BatchSelectionMethod = 'folder';
  public selectedFolder: string = '/';
  public includeSubfolders: boolean = true;
  public selectedTag: string = '';
  public searchQuery: string = '';
  public mergeBatchPDFs: boolean = false;

  public selectionContainer!: HTMLDivElement;
  public previewContainer!: HTMLDivElement;

  public selectionMethodDropdown?: DropdownComponent;
  public folderDropdown?: DropdownComponent;
  public includeSubfoldersToggle?: ToggleComponent;
  public tagInput?: TextComponent;
  public searchInput?: TextComponent;
  public mergeToggle?: ToggleComponent;
  public generateButton?: ButtonComponent;

  constructor(appOrPlugin: App | any, plugin?: any) {
    const resolvedApp = plugin ? appOrPlugin : appOrPlugin?.app || appOrPlugin;
    const resolvedPlugin = plugin || appOrPlugin;
    super(resolvedApp);
    this.plugin = resolvedPlugin;
    this.mergeBatchPDFs = Boolean(this.plugin?.settings?.mergeBatchPDFs);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Batch Label Generation' });

    // Selection Method
    contentEl.createEl('h3', { text: 'Select Notes' });

    new Setting(contentEl).setName('Selection Method').addDropdown((dropdown) => {
      this.selectionMethodDropdown = dropdown;
      dropdown
        .addOptions({
          folder: 'All notes in a folder',
          tag: 'All notes with a tag',
          search: 'Search results',
        })
        .setValue(this.selectionMethod)
        .onChange((value) => {
          this.showSelectionUI(value);
        });
    });

    // Selection UI (changes based on method)
    this.selectionContainer = contentEl.createDiv(
      'selection-container',
    ) as unknown as HTMLDivElement;

    // Preview
    contentEl.createEl('h3', { text: 'Preview' });
    this.previewContainer = contentEl.createDiv('preview-container') as unknown as HTMLDivElement;

    // Merge PDFs Toggle (initialized from plugin settings)
    new Setting(contentEl)
      .setName('Merge into single multi-page PDF')
      .setDesc(
        'Combine all generated labels from this batch into a single PDF (labels_batch_YYYY-MM-DD.pdf) while keeping individual PDFs',
      )
      .addToggle((toggle) => {
        this.mergeToggle = toggle;
        toggle.setValue(this.mergeBatchPDFs).onChange(async (value: boolean) => {
          this.mergeBatchPDFs = value;
          if (this.plugin?.settings) {
            this.plugin.settings.mergeBatchPDFs = value;
            if (typeof this.plugin.saveSettings === 'function') {
              await this.plugin.saveSettings();
            }
          }
        });
      });

    // Generate button
    new Setting(contentEl).addButton((btn) => {
      this.generateButton = btn;
      btn
        .setButtonText('Generate Labels')
        .setCta()
        .setDisabled(true)
        .onClick(async () => {
          await this.generateBatchLabels();
        });
    });

    this.showSelectionUI(this.selectionMethod);
  }

  private getVaultMarkdownFiles(): TFile[] {
    return typeof this.app?.vault?.getMarkdownFiles === 'function'
      ? this.app.vault.getMarkdownFiles()
      : [];
  }

  showSelectionUI(method: string): void {
    this.selectionMethod = (
      ['folder', 'tag', 'search'].includes(method) ? method : 'folder'
    ) as BatchSelectionMethod;

    if (!this.selectionContainer) return;
    this.selectionContainer.empty();

    this.folderDropdown = undefined;
    this.includeSubfoldersToggle = undefined;
    this.tagInput = undefined;
    this.searchInput = undefined;

    if (this.selectionMethod === 'folder') {
      const folders = discoverVaultFolders(this.app);
      if (!folders.includes(this.selectedFolder)) {
        this.selectedFolder = folders[0] || '/';
      }

      new Setting(this.selectionContainer)
        .setName('Folder')
        .setDesc('Select a vault folder to generate labels for')
        .addDropdown((dropdown) => {
          this.folderDropdown = dropdown;
          for (const folder of folders) {
            dropdown.addOption(folder, folder === '/' ? 'Vault Root (/)' : folder);
          }
          dropdown.setValue(this.selectedFolder).onChange((val: string) => {
            this.selectedFolder = val;
            this.selectedNotes = filterNotesByFolder(
              this.getVaultMarkdownFiles(),
              this.selectedFolder,
              this.includeSubfolders,
            );
            void this.updatePreview();
          });
        });

      new Setting(this.selectionContainer)
        .setName('Include subfolders')
        .setDesc('Include notes inside nested subfolders of the selected folder')
        .addToggle((toggle) => {
          this.includeSubfoldersToggle = toggle;
          toggle.setValue(this.includeSubfolders).onChange((val: boolean) => {
            this.includeSubfolders = val;
            this.selectedNotes = filterNotesByFolder(
              this.getVaultMarkdownFiles(),
              this.selectedFolder,
              this.includeSubfolders,
            );
            void this.updatePreview();
          });
        });

      this.selectedNotes = filterNotesByFolder(
        this.getVaultMarkdownFiles(),
        this.selectedFolder,
        this.includeSubfolders,
      );
      void this.updatePreview();
      return;
    }

    if (this.selectionMethod === 'tag') {
      new Setting(this.selectionContainer)
        .setName('Tag')
        .setDesc('Enter a tag name (e.g. #inventory or inventory)')
        .addText((text) => {
          this.tagInput = text;
          text
            .setPlaceholder('#inventory')
            .setValue(this.selectedTag)
            .onChange((val: string) => {
              this.selectedTag = val;
              this.selectedNotes = filterNotesByTag(
                this.app,
                this.getVaultMarkdownFiles(),
                this.selectedTag,
              );
              void this.updatePreview();
            });
        });

      this.selectedNotes = filterNotesByTag(
        this.app,
        this.getVaultMarkdownFiles(),
        this.selectedTag,
      );
      void this.updatePreview();
      return;
    }

    if (this.selectionMethod === 'search') {
      new Setting(this.selectionContainer)
        .setName('Search Query')
        .setDesc('Match notes by title, file path, or note content')
        .addText((text) => {
          this.searchInput = text;
          text
            .setPlaceholder('Search notes...')
            .setValue(this.searchQuery)
            .onChange(async (val: string) => {
              this.searchQuery = val;
              this.selectedNotes = await filterNotesBySearch(
                this.app,
                this.getVaultMarkdownFiles(),
                this.searchQuery,
              );
              await this.updatePreview();
            });
        });

      void filterNotesBySearch(this.app, this.getVaultMarkdownFiles(), this.searchQuery).then(
        (matched) => {
          this.selectedNotes = matched;
          void this.updatePreview();
        },
      );
    }
  }

  async updatePreview(): Promise<void> {
    if (!this.previewContainer) return;
    this.previewContainer.empty();

    if (this.selectedNotes.length === 0) {
      this.previewContainer.createEl('p', {
        text: 'No notes selected',
      });
      this.generateButton?.setDisabled(true);
      return;
    }

    this.generateButton?.setDisabled(false);

    this.previewContainer.createEl('p', {
      text: `${this.selectedNotes.length} labels will be generated`,
    });

    const noteList = this.previewContainer.createEl('ul');
    this.selectedNotes.slice(0, 10).forEach((note) => {
      noteList.createEl('li', { text: note.path });
    });

    if (this.selectedNotes.length > 10) {
      this.previewContainer.createEl('p', {
        text: `... and ${this.selectedNotes.length - 10} more`,
      });
    }
  }

  async generateBatchLabels(): Promise<void> {
    const progressModal = new ProgressModal(this.app, this.selectedNotes.length);
    progressModal.open();

    const pdfPaths: string[] = [];

    for (let i = 0; i < this.selectedNotes.length; i++) {
      const note = this.selectedNotes[i];

      try {
        let pdfPath: string;
        if (typeof this.plugin?.generateLabelForNote === 'function') {
          const res = await this.plugin.generateLabelForNote(note);
          pdfPath = typeof res === 'string' ? res : res?.filePath;
        } else {
          const settings = {
            ...(this.plugin?.settings || DEFAULT_SETTINGS),
            autoPrint: false,
          };
          const res = await generateLabelForNote(
            this.app,
            note,
            settings,
            undefined,
            this.plugin?.generator,
            false,
          );
          pdfPath = res.filePath;
        }
        pdfPaths.push(pdfPath);
        progressModal.update(i + 1);
      } catch (error) {
        console.error(`Failed to generate label for ${note.path}:`, error);
        // Continue with other notes
      }
    }

    progressModal.close();

    // Optional: merge PDFs
    const shouldMerge = Boolean(this.plugin?.settings?.mergeBatchPDFs ?? this.mergeBatchPDFs);
    if (shouldMerge && pdfPaths.length > 0) {
      await this.mergePDFs(pdfPaths);
    }

    new Notice(`Generated ${pdfPaths.length} labels`);
    this.close();
  }

  async mergePDFs(pdfPaths: string[]): Promise<string> {
    const fallbackSettings = this.plugin?.settings || DEFAULT_SETTINGS;
    const fallbackConfig = settingsToLabelConfig(fallbackSettings);

    const pages: PDFPageSpec[] = [];

    for (const pdfPath of pdfPaths) {
      if (typeof this.app?.vault?.adapter?.readBinary === 'function') {
        await this.app.vault.adapter.readBinary(pdfPath);
      }

      const cached = getBatchPage(pdfPath);
      if (cached) {
        pages.push({
          widthMm: cached.widthMm,
          heightMm: cached.heightMm,
          imageDataUrl: cached.previewDataUrl,
        });
      } else {
        pages.push({
          widthMm: fallbackConfig.size.width,
          heightMm: fallbackConfig.size.height,
        });
      }
    }

    const mergedBytes = mergeBatchPDFPages(pages);
    const outputPath = 'labels_batch_' + new Date().toISOString().split('T')[0] + '.pdf';

    const buffer: ArrayBuffer = mergedBytes.buffer.slice(
      mergedBytes.byteOffset,
      mergedBytes.byteOffset + mergedBytes.byteLength,
    ) as ArrayBuffer;

    await this.app.vault.adapter.writeBinary(outputPath, buffer);

    new Notice(`Merged PDF created: ${outputPath}`);
    return outputPath;
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
