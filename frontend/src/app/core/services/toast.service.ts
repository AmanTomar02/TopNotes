import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'danger' | 'info';
  message: string;
}

/** App-wide toast notifications. Render once via <app-toast> at the app root. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private seq = 0;

  show(message: string, type: Toast['type'] = 'info', durationMs = 3200): void {
    const id = ++this.seq;
    this._toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string) {
    this.show(message, 'success');
  }
  error(message: string) {
    this.show(message, 'danger');
  }
  info(message: string) {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
