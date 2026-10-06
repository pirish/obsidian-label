/**
 * Mock Obsidian API Test Harness
 * For unit and integration testing without Electron/Obsidian desktop runtime.
 */

export class MockHTMLElement {
  public tagName: string;
  private _textContent: string = '';
  public innerHTML: string = '';
  public value: string = '';
  public children: MockHTMLElement[] = [];
  public classList: Set<string> = new Set();
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};
  public parentElement: MockHTMLElement | null = null;
  private listeners: Map<string, ((...args: any[]) => any)[]> = new Map();

  constructor(tagName: string = 'div') {
    this.tagName = tagName.toUpperCase();
  }

  get textContent(): string {
    if (this.children.length === 0) {
      return this._textContent;
    }
    return this._textContent + this.children.map((c) => c.textContent).join(' ');
  }

  set textContent(val: string) {
    this._textContent = val;
  }

  setText(val: string): this {
    this.textContent = val;
    return this;
  }

  get text(): string {
    return this.textContent;
  }
  set text(val: string) {
    this.textContent = val;
  }

  createEl(
    tag: string,
    options?: {
      text?: string;
      cls?: string;
      attr?: Record<string, string>;
    },
  ): MockHTMLElement {
    const el = new MockHTMLElement(tag);
    if (options?.text) el.textContent = options.text;
    if (options?.cls) {
      options.cls.split(' ').forEach((c) => el.classList.add(c));
    }
    if (options?.attr) {
      Object.entries(options.attr).forEach(([k, v]) => el.setAttribute(k, v));
    }
    this.appendChild(el);
    return el;
  }

  createDiv(options?: { text?: string; cls?: string }): MockHTMLElement {
    return this.createEl('div', options);
  }

  createSpan(options?: { text?: string; cls?: string }): MockHTMLElement {
    return this.createEl('span', options);
  }

  empty(): void {
    this.children = [];
    this._textContent = '';
    this.innerHTML = '';
  }

  appendChild(child: MockHTMLElement): MockHTMLElement {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: MockHTMLElement): MockHTMLElement {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
  }

  getAttribute(name: string): string | undefined {
    return this.attributes[name];
  }

  addEventListener(event: string, handler: (...args: any[]) => any): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  dispatchEvent(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((h) => h(...args));
  }

  click(): void {
    this.dispatchEvent('click');
  }
}

export class DropdownComponent {
  public selectEl: MockHTMLElement = new MockHTMLElement('select');
  public options: Record<string, string> = {};
  public value: string = '';
  private changeCallback?: (val: string) => any;

  addOption(value: string, display: string): this {
    this.options[value] = display;
    const optEl = this.selectEl.createEl('option', { text: display });
    optEl.setAttribute('value', value);
    return this;
  }

  addOptions(options: Record<string, string>): this {
    Object.entries(options).forEach(([k, v]) => this.addOption(k, v));
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    this.selectEl.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  onChange(callback: (value: string) => any): this {
    this.changeCallback = callback;
    return this;
  }

  triggerChange(value: string): Promise<any> | void {
    this.setValue(value);
    if (this.changeCallback) {
      return this.changeCallback(value);
    }
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }
}

export class SliderComponent {
  public sliderEl: MockHTMLElement = new MockHTMLElement('input');
  public min: number = 0;
  public max: number = 100;
  public step: number = 1;
  public value: number = 0;
  private changeCallback?: (val: number) => any;

  setLimits(min: number, max: number, step: number): this {
    this.min = min;
    this.max = max;
    this.step = step;
    return this;
  }

  setValue(value: number): this {
    this.value = value;
    this.sliderEl.value = String(value);
    return this;
  }

  getValue(): number {
    return this.value;
  }

  setDynamicTooltip(): this {
    return this;
  }

  onChange(callback: (value: number) => any): this {
    this.changeCallback = callback;
    return this;
  }

  triggerChange(value: number): Promise<any> | void {
    this.setValue(value);
    if (this.changeCallback) {
      return this.changeCallback(value);
    }
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }
}

export class TextComponent {
  public inputEl: MockHTMLElement = new MockHTMLElement('input');
  public value: string = '';
  public placeholder: string = '';
  private changeCallback?: (val: string) => any;

  setPlaceholder(placeholder: string): this {
    this.placeholder = placeholder;
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    this.inputEl.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  onChange(callback: (value: string) => any): this {
    this.changeCallback = callback;
    return this;
  }

  triggerChange(value: string): Promise<any> | void {
    this.setValue(value);
    if (this.changeCallback) {
      return this.changeCallback(value);
    }
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }
}

export class ToggleComponent {
  public toggleEl: MockHTMLElement = new MockHTMLElement('input');
  public value: boolean = false;
  private changeCallback?: (val: boolean) => any;

  setValue(value: boolean): this {
    this.value = value;
    this.toggleEl.value = String(value);
    return this;
  }

  getValue(): boolean {
    return this.value;
  }

  onChange(callback: (value: boolean) => any): this {
    this.changeCallback = callback;
    return this;
  }

  triggerChange(value: boolean): Promise<any> | void {
    this.setValue(value);
    if (this.changeCallback) {
      return this.changeCallback(value);
    }
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }
}

export class ColorComponent {
  public colorEl: MockHTMLElement = new MockHTMLElement('input');
  public value: string = '#000000';
  private changeCallback?: (val: string) => any;

  setValue(value: string): this {
    this.value = value;
    this.colorEl.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  onChange(callback: (value: string) => any): this {
    this.changeCallback = callback;
    return this;
  }

  triggerChange(value: string): Promise<any> | void {
    this.setValue(value);
    if (this.changeCallback) {
      return this.changeCallback(value);
    }
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }
}

export class ButtonComponent {
  public buttonEl: MockHTMLElement = new MockHTMLElement('button');
  public text: string = '';
  private clickCallback?: (evt: any) => any;

  constructor(containerEl?: any) {
    if (containerEl && typeof containerEl.appendChild === 'function') {
      containerEl.appendChild(this.buttonEl);
    }
  }

  setButtonText(text: string): this {
    this.text = text;
    this.buttonEl.textContent = text;
    return this;
  }

  setIcon(_icon: string): this {
    return this;
  }

  setClass(cls: string): this {
    this.buttonEl.classList.add(cls);
    return this;
  }

  setTooltip(_tooltip: string): this {
    return this;
  }

  setCta(): this {
    this.buttonEl.classList.add('mod-cta');
    return this;
  }

  setWarning(): this {
    this.buttonEl.classList.add('mod-warning');
    return this;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  onClick(callback: (evt: any) => any): this {
    this.clickCallback = callback;
    this.buttonEl.addEventListener('click', callback);
    return this;
  }

  triggerClick(): Promise<any> | void {
    if (this.clickCallback) {
      return this.clickCallback({});
    }
  }
}

export class Setting {
  public settingEl: MockHTMLElement;
  public infoEl: MockHTMLElement;
  public nameEl: MockHTMLElement;
  public descEl: MockHTMLElement;
  public controlEl: MockHTMLElement;

  public dropdowns: DropdownComponent[] = [];
  public sliders: SliderComponent[] = [];
  public textFields: TextComponent[] = [];
  public toggles: ToggleComponent[] = [];
  public colorPickers: ColorComponent[] = [];
  public buttons: ButtonComponent[] = [];

  constructor(containerEl: any) {
    this.settingEl = containerEl.createEl
      ? containerEl.createEl('div', { cls: 'setting-item' })
      : new MockHTMLElement('div');
    this.infoEl = this.settingEl.createEl('div', { cls: 'setting-item-info' });
    this.nameEl = this.infoEl.createEl('div', { cls: 'setting-item-name' });
    this.descEl = this.infoEl.createEl('div', { cls: 'setting-item-description' });
    this.controlEl = this.settingEl.createEl('div', { cls: 'setting-item-control' });
  }

  setName(name: string): this {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(desc: string): this {
    this.descEl.textContent = desc;
    return this;
  }

  setClass(cls: string): this {
    this.settingEl.classList.add(cls);
    return this;
  }

  setHeading(): this {
    this.settingEl.classList.add('setting-item-heading');
    return this;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  addDropdown(cb: (dropdown: DropdownComponent) => any): this {
    const dropdown = new DropdownComponent();
    this.controlEl.appendChild(dropdown.selectEl);
    this.dropdowns.push(dropdown);
    cb(dropdown);
    return this;
  }

  addSlider(cb: (slider: SliderComponent) => any): this {
    const slider = new SliderComponent();
    this.controlEl.appendChild(slider.sliderEl);
    this.sliders.push(slider);
    cb(slider);
    return this;
  }

  addText(cb: (text: TextComponent) => any): this {
    const text = new TextComponent();
    this.controlEl.appendChild(text.inputEl);
    this.textFields.push(text);
    cb(text);
    return this;
  }

  addToggle(cb: (toggle: ToggleComponent) => any): this {
    const toggle = new ToggleComponent();
    this.controlEl.appendChild(toggle.toggleEl);
    this.toggles.push(toggle);
    cb(toggle);
    return this;
  }

  addColorPicker(cb: (color: ColorComponent) => any): this {
    const color = new ColorComponent();
    this.controlEl.appendChild(color.colorEl);
    this.colorPickers.push(color);
    cb(color);
    return this;
  }

  addButton(cb: (button: ButtonComponent) => any): this {
    const button = new ButtonComponent();
    this.controlEl.appendChild(button.buttonEl);
    this.buttons.push(button);
    cb(button);
    return this;
  }
}

export class PluginSettingTab {
  public app: any;
  public plugin: any;
  public containerEl: MockHTMLElement;

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = new MockHTMLElement('div');
  }

  display(): void {}
  hide(): void {}
}

export class Modal {
  public app: any;
  public containerEl: MockHTMLElement;
  public modalEl: MockHTMLElement;
  public titleEl: MockHTMLElement;
  public contentEl: MockHTMLElement;
  public isOpen: boolean = false;

  constructor(app: any) {
    this.app = app;
    this.containerEl = new MockHTMLElement('div');
    this.modalEl = this.containerEl.createDiv({ cls: 'modal' });
    this.titleEl = this.modalEl.createDiv({ cls: 'modal-title' });
    this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
  }

  open(): void {
    this.isOpen = true;
    this.onOpen();
  }

  close(): void {
    this.isOpen = false;
    this.onClose();
  }

  onOpen(): void {}
  onClose(): void {}
}

export class Notice {
  public message: string;
  public noticeEl: MockHTMLElement;

  constructor(message: string, _duration?: number) {
    this.message = message;
    this.noticeEl = new MockHTMLElement('div');
    this.noticeEl.textContent = message;
  }

  setMessage(message: string): this {
    this.message = message;
    this.noticeEl.textContent = message;
    return this;
  }

  hide(): void {}
}

export class TFile {
  public path: string;
  public name: string;
  public basename: string;
  public extension: string;
  public stat: { ctime: number; mtime: number; size: number };

  constructor(path: string = 'Untitled.md') {
    this.path = path;
    const parts = path.split('/');
    this.name = parts[parts.length - 1] || 'Untitled.md';
    const dotIdx = this.name.lastIndexOf('.');
    if (dotIdx > 0) {
      this.basename = this.name.substring(0, dotIdx);
      this.extension = this.name.substring(dotIdx + 1);
    } else {
      this.basename = this.name;
      this.extension = 'md';
    }
    this.stat = { ctime: Date.now(), mtime: Date.now(), size: 100 };
  }
}

export interface Command {
  id: string;
  name: string;
  icon?: string;
  callback?: () => any;
  checkCallback?: (checking: boolean) => boolean | void;
}

export class Plugin {
  public app: any;
  public manifest: any;
  public commands: Map<string, Command> = new Map();
  private storedData: any = {};

  constructor(app: any = {}, manifest: any = {}) {
    this.app = app;
    this.manifest = manifest;
  }

  addCommand(command: Command): Command {
    this.commands.set(command.id, command);
    return command;
  }

  async loadData(): Promise<any> {
    return this.storedData;
  }

  async saveData(data: any): Promise<void> {
    this.storedData = JSON.parse(JSON.stringify(data));
  }

  addSettingTab(_tab: PluginSettingTab): void {}
}

export interface App {
  workspace: {
    getActiveFile: () => any;
  };
  vault: {
    getName?: () => string;
    getMarkdownFiles?: () => TFile[];
    adapter: {
      exists: (path: string) => Promise<boolean>;
      writeBinary: (path: string, data: ArrayBuffer) => Promise<void>;
      mkdir: (path: string) => Promise<void>;
      read?: (path: string) => Promise<string>;
      write?: (path: string, data: string) => Promise<void>;
    };
  };
  fileManager?: {
    processFrontMatter?: (file: any, fn: (frontmatter: any) => void) => Promise<void>;
  };
  metadataCache?: {
    getFileCache?: (file: any) => { frontmatter?: Record<string, any> } | null;
  };
}
