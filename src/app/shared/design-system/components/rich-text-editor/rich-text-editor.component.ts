import {
  Component, forwardRef, ElementRef, viewChild, signal, OnDestroy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RteFormat = 'bold' | 'italic' | 'underline' | 'strikeThrough' |
  'insertOrderedList' | 'insertUnorderedList' | 'justifyLeft' |
  'justifyCenter' | 'justifyRight';

interface ToolbarAction {
  command: RteFormat;
  icon: string;
  tooltip: string;
}

@Component({
  selector: 'sce-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  standalone: true,
  styles: [`
    :host ::ng-deep [contenteditable] ul { list-style-type: disc;   padding-left: 1.5rem; margin: 0.25rem 0; }
    :host ::ng-deep [contenteditable] ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.25rem 0; }
    :host ::ng-deep [contenteditable] li { margin: 0.1rem 0; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements OnDestroy, ControlValueAccessor {
  protected editorRef = viewChild<ElementRef<HTMLDivElement>>('editor');

  protected isDisabled = signal(false);
  protected activeFormats = signal<Set<RteFormat>>(new Set());

  protected readonly toolbar: ToolbarAction[][] = [
    [
      { command: 'bold',          icon: 'B',   tooltip: 'Bold'          },
      { command: 'italic',        icon: 'I',   tooltip: 'Italic'        },
      { command: 'underline',     icon: 'U',   tooltip: 'Underline'     },
      { command: 'strikeThrough', icon: 'S',   tooltip: 'Strikethrough' },
    ],
    [
      { command: 'justifyLeft',   icon: '⬅',  tooltip: 'Align left'   },
      { command: 'justifyCenter', icon: '☰',  tooltip: 'Align center' },
      { command: 'justifyRight',  icon: '➡',  tooltip: 'Align right'  },
    ],
    [
      { command: 'insertUnorderedList', icon: '•≡', tooltip: 'Bullet list'  },
      { command: 'insertOrderedList',   icon: '1≡', tooltip: 'Ordered list' },
    ],
  ];

  protected isActive(command: RteFormat): boolean {
    return this.activeFormats().has(command);
  }

  protected updateActiveFormats(): void {
    const active = new Set<RteFormat>();
    const cmds: RteFormat[] = [
      'bold', 'italic', 'underline', 'strikeThrough',
      'justifyLeft', 'justifyCenter', 'justifyRight',
      'insertOrderedList', 'insertUnorderedList',
    ];
    const queryState = 'queryCommandState';
    cmds.forEach(cmd => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { if ((document as any)[queryState](cmd)) active.add(cmd); } catch {}
    });
    this.activeFormats.set(active);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private exec(command: string, value?: string): void {
    const cmd = 'execCommand';
    (document as any)[cmd](command, false, value ?? undefined);
  }

  protected applyFormat(command: RteFormat): void {
    if (this.isDisabled()) return;

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    editor.focus();

    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      this.insertList(command === 'insertUnorderedList' ? 'ul' : 'ol');
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    this.exec(command);
    this.updateActiveFormats();
    this.emitValue();
  }

  private insertList(tag: 'ul' | 'ol'): void {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const sel = window.getSelection();
    const list = document.createElement(tag);
    const li = document.createElement('li');
    list.appendChild(li);

    if (!sel || sel.rangeCount === 0) {
      editor.appendChild(list);
    } else {
      const range = sel.getRangeAt(0);
      let blockNode: Node = range.startContainer;
      while (blockNode.parentNode && blockNode.parentNode !== editor) {
        blockNode = blockNode.parentNode;
      }
      if (blockNode === editor) {
        editor.appendChild(list);
      } else {
        blockNode.parentNode?.replaceChild(list, blockNode);
      }
    }

    const newRange = document.createRange();
    newRange.setStart(li, 0);
    newRange.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(newRange);

    this.updateActiveFormats();
    this.emitValue();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ') this.checkMarkdownShortcut(event);
  }

  private checkMarkdownShortcut(event: KeyboardEvent): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent ?? '';
    const cursorPos = range.startOffset;
    const lineText = text.slice(0, cursorPos);

    const isUnordered = lineText === '*';
    const isOrdered   = /^\d+\.$/.test(lineText);
    if (!isUnordered && !isOrdered) return;

    event.preventDefault();

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    // Texto restante después del trigger (si había más en la línea)
    const remaining = text.slice(cursorPos);

    // Encontrar el nodo bloque padre directo del editor
    let blockNode: Node = node;
    while (blockNode.parentNode && blockNode.parentNode !== editor) {
      blockNode = blockNode.parentNode;
    }

    // Crear <ul> o <ol> con un <li>
    const list = document.createElement(isUnordered ? 'ul' : 'ol');
    const li = document.createElement('li');
    if (remaining) li.textContent = remaining;
    list.appendChild(li);

    // Reemplazar el nodo bloque (o el text node si está directo en el editor)
    if (blockNode === node) {
      editor.replaceChild(list, node);
    } else {
      blockNode.parentNode?.replaceChild(list, blockNode);
    }

    // Posicionar cursor dentro del <li>
    const newRange = document.createRange();
    if (li.firstChild) {
      newRange.setStart(li.firstChild, 0);
    } else {
      newRange.setStart(li, 0);
    }
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    this.updateActiveFormats();
    this.emitValue();
  }

  protected onInput(): void {
    this.updateActiveFormats();
    this.emitValue();
  }

  protected onKeyUp(): void  { this.updateActiveFormats(); }
  protected onMouseUp(): void { this.updateActiveFormats(); }

  private emitValue(): void {
    const html = this.editorRef()?.nativeElement.innerHTML ?? '';
    this.onChange(html === '<br>' ? '' : html);
    this.onTouched();
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const el = this.editorRef()?.nativeElement;
    if (el) el.innerHTML = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled.set(disabled); }

  ngOnDestroy(): void {}
}
