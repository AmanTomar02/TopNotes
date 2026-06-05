import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _uid = 0;

/**
 * Reusable form text field — label + input + error + optional password toggle.
 * Implements ControlValueAccessor, so it drops into reactive forms via formControlName.
 * Project a [fieldAction] (e.g. "Forgot password?") next to the label.
 */
@Component({
  selector: 'app-text-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextFieldComponent), multi: true }],
  template: `
    <div class="field" [class.invalid]="invalid()">
      <div class="label-row">
        <label [attr.for]="id">{{ label() }}</label>
        <ng-content select="[fieldAction]" />
      </div>
      <div class="input-wrap" [class.has-toggle]="type() === 'password'">
        <input
          class="input"
          [id]="id"
          [type]="inputType()"
          [placeholder]="placeholder()"
          [attr.autocomplete]="autocomplete()"
          [value]="value()"
          [disabled]="isDisabled()"
          [attr.aria-invalid]="invalid()"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
        @if (type() === 'password') {
          <button
            type="button"
            class="toggle-pw"
            tabindex="-1"
            (click)="show.set(!show())"
            [attr.aria-label]="show() ? 'Hide password' : 'Show password'"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        }
      </div>
      @if (invalid() && error()) {
        <p class="field-err">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .field {
        margin-bottom: 18px;
      }
      .label-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
      }
      label {
        display: block;
        font-size: var(--text-sm);
        font-weight: var(--fw-semibold);
        color: var(--c-ink);
        margin-bottom: 7px;
      }
      .input-wrap {
        position: relative;
      }
      .input {
        width: 100%;
        height: 46px;
        padding: 0 14px;
        font: inherit;
        font-size: var(--text-base);
        color: var(--c-ink);
        background: var(--c-surface);
        border: 1px solid var(--c-line);
        border-radius: var(--radius-sm);
        transition:
          border-color var(--transition),
          box-shadow var(--transition);
      }
      .input::placeholder {
        color: var(--c-muted);
      }
      .input:hover:not(:disabled) {
        border-color: #d6dae1;
      }
      .input:focus {
        outline: none;
        border-color: var(--c-primary-bright);
        box-shadow: var(--ring);
      }
      .input:disabled {
        background: var(--c-canvas);
        cursor: not-allowed;
      }
      .has-toggle .input {
        padding-right: 46px;
      }
      .field.invalid .input {
        border-color: var(--c-danger);
      }
      .field.invalid .input:focus {
        box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);
      }
      .toggle-pw {
        position: absolute;
        top: 0;
        right: 0;
        height: 46px;
        width: 44px;
        display: grid;
        place-items: center;
        color: var(--c-muted);
        border-radius: var(--radius-sm);
      }
      .toggle-pw:hover {
        color: var(--c-text);
      }
      .toggle-pw:focus-visible {
        outline: none;
        box-shadow: var(--ring);
        color: var(--c-primary-bright);
      }
      .field-err {
        margin-top: 7px;
        font-size: var(--text-xs);
        color: var(--c-danger);
      }
    `,
  ],
})
export class TextFieldComponent implements ControlValueAccessor {
  label = input('');
  type = input<'text' | 'email' | 'password' | 'tel'>('text');
  placeholder = input('');
  autocomplete = input<string | null>(null);
  invalid = input(false);
  error = input<string | null>(null);

  protected readonly id = `tf-${++_uid}`;
  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly show = signal(false);
  protected readonly inputType = computed(() => (this.type() === 'password' && this.show() ? 'text' : this.type()));

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  protected onInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: string): void {
    this.value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.isDisabled.set(d);
  }
}
