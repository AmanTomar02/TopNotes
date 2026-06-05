import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Design-system button — the reference pattern for all shared UI:
 * standalone · OnPush · signal input()/output() · tokens-driven · zero hardcoded colors.
 *
 * <app-button variant="primary" size="md" [loading]="saving()" (click)="save()">Save</app-button>
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="classes()"
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <span class="spinner" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        font-family: var(--font-sans);
        font-weight: var(--fw-semibold);
        border-radius: var(--radius-sm);
        white-space: nowrap;
        transition:
          transform var(--dur-fast) var(--ease-standard),
          background var(--dur-fast) var(--ease-standard),
          box-shadow var(--dur-fast) var(--ease-standard),
          border-color var(--dur-fast) var(--ease-standard);
      }
      button:active:not(:disabled) {
        transform: translateY(1px) scale(0.99);
      }
      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      /* sizes */
      .sz-sm {
        height: 34px;
        padding: 0 var(--space-3);
        font-size: var(--text-sm);
      }
      .sz-md {
        height: 42px;
        padding: 0 var(--space-5);
        font-size: var(--text-sm);
      }
      .sz-lg {
        height: 50px;
        padding: 0 var(--space-6);
        font-size: var(--text-base);
      }

      /* variants */
      .v-primary {
        background: var(--c-primary);
        color: #fff;
        box-shadow: var(--shadow-sm);
      }
      .v-primary:hover:not(:disabled) {
        background: var(--c-primary-hover);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
      .v-secondary {
        background: var(--c-surface);
        color: var(--c-ink);
        border: 1px solid var(--c-line);
      }
      .v-secondary:hover:not(:disabled) {
        border-color: var(--c-primary);
        color: var(--c-primary);
      }
      .v-ghost {
        background: transparent;
        color: var(--c-text);
      }
      .v-ghost:hover:not(:disabled) {
        background: var(--c-primary-50);
        color: var(--c-primary);
      }
      .v-danger {
        background: var(--c-danger);
        color: #fff;
      }
      .v-danger:hover:not(:disabled) {
        background: #b91c1c;
        transform: translateY(-1px);
      }

      .block {
        width: 100%;
      }
    `,
  ],
})
export class ButtonComponent {
  variant = input<Variant>('primary');
  size = input<Size>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  loading = input(false);
  disabled = input(false);
  block = input(false);

  clicked = output<MouseEvent>();

  protected classes = computed(() => `v-${this.variant()} sz-${this.size()}${this.block() ? ' block' : ''}`);
}
