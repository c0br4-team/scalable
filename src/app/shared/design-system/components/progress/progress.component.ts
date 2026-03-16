import { Component, computed, input } from '@angular/core';
import { ProgressColor, ProgressSize, ProgressType } from '../../models/components.types';

@Component({
  selector: 'sce-progress',
  standalone: true,
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
})
export class ProgressComponent {
  type = input<ProgressType>('bar');
  value = input<number>(0);          // 0-100, ignored when indeterminate
  indeterminate = input<boolean>(false);
  color = input<ProgressColor>('primary');
  size = input<ProgressSize>('md');
  label = input<string>('');
  showValue = input<boolean>(false);

  /* ── SVG circular math ── */
  protected readonly radius = 40;
  protected readonly circumference = 2 * Math.PI * this.radius; // ≈ 251.33

  protected strokeOffset = computed(() =>
    this.circumference * (1 - Math.min(100, Math.max(0, this.value())) / 100)
  );

  /* ── Color maps ── */
  protected trackCls = computed(() => ({
    primary: 'bg-indigo-200',
    success: 'bg-green-200',
    danger: 'bg-red-200',
    warning: 'bg-amber-200',
  }[this.color()]));

  protected fillCls = computed(() => ({
    primary: 'bg-indigo-600',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-amber-400',
  }[this.color()]));

  protected svgStroke = computed(() => ({
    primary: '#4f46e5',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
  }[this.color()]));

  protected dotCls = computed(() => ({
    primary: 'bg-indigo-600',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-amber-400',
  }[this.color()]));

  /* ── Size maps ── */
  protected barHeightCls = computed(() => ({
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[this.size()]));

  protected circSizePx = computed(() => ({ sm: 48, md: 72, lg: 96 }[this.size()]));

  protected dotSizeCls = computed(() => ({
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[this.size()]));

  protected skeletonHeightCls = computed(() => ({
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
  }[this.size()]));

  protected labelSizeCls = computed(() => ({
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[this.size()]));
}
