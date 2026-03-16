import { Component, computed, input, output } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { ButtonColor, ButtonSize, ButtonType } from '../../models/components.types';

const ACCENT_HEX: Record<ButtonColor, string> = {
  pink:   '#ec4899',
  cyan:   '#06b6d4',
  blue:   '#60a5fa',
  yellow: '#facc15',
  red:    '#ef4444',
  green:  '#22c55e',
  indigo: '#6366f1',
  gray:   '#6b7280',
};

const SIZE_CLS: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-2',
  md: 'px-4 py-2   text-sm gap-2.5',
  lg: 'px-5 py-2.5 text-base gap-3',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: '14',
  md: '16',
  lg: '20',
};

@Component({
  selector: 'sce-button',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './button.component.html',
  styles: [`
    button:hover  { color: var(--accent); background-color: color-mix(in srgb, var(--accent) 10%, transparent); border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
    button:active { transform: scale(0.95); }
  `],
})
export class ButtonComponent {
  label    = input<string>('');
  /** Nombre del heroicon, e.g. "heroArrowLeft", "heroCog6Tooth" */
  iconName = input<string>('');
  /** SVG como string HTML (alternativa a iconName) */
  icon     = input<string>('');
  color    = input<ButtonColor>('gray');
  size     = input<ButtonSize>('md');
  type     = input<ButtonType>('button');
  disabled = input<boolean>(false);

  clicked = output<MouseEvent>();

  protected sizeCls     = computed(() => SIZE_CLS[this.size()]);
  protected iconSize    = computed(() => ICON_SIZE[this.size()]);
  protected accentStyle = computed(() => ({ '--accent': ACCENT_HEX[this.color()] }));
}
