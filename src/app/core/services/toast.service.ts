import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-right' | 'top-left' | 'top-center'
  | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  dismissible?: boolean;
  progress?: boolean;
  action?: ToastAction;
}

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  dismissible: boolean;
  progress: boolean;
  action?: ToastAction;
  createdAt: number;
  leaving?: boolean;
}

export interface ToastConfig {
  position: ToastPosition;
  maxToasts: number;
}

const DEFAULTS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _counter = 0;
  private _timers = new Map<number, ReturnType<typeof setTimeout>>();
  private _pausedAt = new Map<number, number>();
  private _remaining = new Map<number, number>();

  readonly toasts = signal<Toast[]>([]);
  readonly config = signal<ToastConfig>({
    position: 'bottom-right',
    maxToasts: 5,
  });

  configure(config: Partial<ToastConfig>): void {
    this.config.update(c => ({ ...c, ...config }));
  }

  success(message: string, options?: ToastOptions): void {
    this.add('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.add('error', message, options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.add('warning', message, options);
  }

  info(message: string, options?: ToastOptions): void {
    this.add('info', message, options);
  }

  dismiss(id: number): void {
    clearTimeout(this._timers.get(id));
    this._timers.delete(id);
    this._remaining.delete(id);
    this._pausedAt.delete(id);

    this.toasts.update(list => list.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => this.toasts.update(list => list.filter(t => t.id !== id)), 200);
  }

  dismissAll(): void {
    this._timers.forEach(timer => clearTimeout(timer));
    this._timers.clear();
    this._remaining.clear();
    this._pausedAt.clear();
    this.toasts.set([]);
  }

  pause(id: number): void {
    const timer = this._timers.get(id);
    if (!timer) return;

    clearTimeout(timer);
    this._timers.delete(id);

    const toast = this.toasts().find(t => t.id === id);
    if (!toast || toast.duration === 0) return;

    const elapsed = Date.now() - toast.createdAt;
    const remaining = Math.max(0, (this._remaining.get(id) ?? toast.duration) - elapsed);
    this._remaining.set(id, remaining);
    this._pausedAt.set(id, Date.now());
  }

  resume(id: number): void {
    const toast = this.toasts().find(t => t.id === id);
    if (!toast || toast.duration === 0) return;
    if (this._timers.has(id)) return;

    const remaining = this._remaining.get(id) ?? toast.duration;

    // Actualizar createdAt para que la barra de progreso CSS continúe correctamente
    this.toasts.update(list =>
      list.map(t => t.id === id ? { ...t, createdAt: Date.now(), duration: remaining } : t)
    );

    const timer = setTimeout(() => this.dismiss(id), remaining);
    this._timers.set(id, timer);
    this._pausedAt.delete(id);
    this._remaining.delete(id);
  }

  private add(type: ToastType, message: string, options: ToastOptions = {}): void {
    const { maxToasts } = this.config();
    const id = ++this._counter;
    const duration = options.duration ?? DEFAULTS[type];

    const toast: Toast = {
      id,
      type,
      message,
      title: options.title,
      duration,
      dismissible: options.dismissible ?? true,
      progress: options.progress ?? true,
      action: options.action,
      createdAt: Date.now(),
    };

    this.toasts.update(list => {
      const updated = [...list, toast];
      return updated.length > maxToasts ? updated.slice(updated.length - maxToasts) : updated;
    });

    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this._timers.set(id, timer);
    }
  }


}
