import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  danger: boolean;
}

/** Promise-based confirmation dialog. Render once via <app-confirm> at the app root. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _state = signal<ConfirmState>({ open: false, title: '', message: '', confirmText: 'Confirm', danger: false });
  readonly state = this._state.asReadonly();
  private resolver: ((v: boolean) => void) | null = null;

  ask(opts: { message: string; title?: string; confirmText?: string; danger?: boolean }): Promise<boolean> {
    this._state.set({
      open: true,
      title: opts.title ?? 'Are you sure?',
      message: opts.message,
      confirmText: opts.confirmText ?? 'Confirm',
      danger: opts.danger ?? false,
    });
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  respond(value: boolean): void {
    this._state.update((s) => ({ ...s, open: false }));
    this.resolver?.(value);
    this.resolver = null;
  }
}
