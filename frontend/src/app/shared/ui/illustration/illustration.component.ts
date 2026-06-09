import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Flat, on-brand vector illustrations (unDraw aesthetic) for empty states,
 * auth panels and dashboard headers. Brand indigo (#5B4BE0) + slate greys.
 * Add new scenes by extending the union and the @switch below.
 */
@Component({
  selector: 'app-illustration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (name()) {
      @case ('notes') {
        <svg viewBox="0 0 240 200" fill="none" role="img" aria-hidden="true">
          <circle cx="120" cy="102" r="80" fill="#EEEBFB" />
          <g transform="rotate(-7 120 104)">
            <rect x="76" y="50" width="84" height="106" rx="9" fill="#fff" stroke="#D9D4F7" stroke-width="2" />
          </g>
          <rect x="86" y="54" width="84" height="106" rx="9" fill="#fff" stroke="#C7C0F4" stroke-width="2" />
          <rect x="100" y="74" width="48" height="7" rx="3.5" fill="#C7C0F4" />
          <rect x="100" y="90" width="56" height="6" rx="3" fill="#EAECF0" />
          <rect x="100" y="104" width="42" height="6" rx="3" fill="#EAECF0" />
          <rect x="100" y="118" width="50" height="6" rx="3" fill="#EAECF0" />
          <circle cx="150" cy="132" r="23" fill="#fff" stroke="#5B4BE0" stroke-width="5" />
          <line x1="167" y1="149" x2="184" y2="166" stroke="#5B4BE0" stroke-width="7" stroke-linecap="round" />
        </svg>
      }
      @case ('sales') {
        <svg viewBox="0 0 240 200" fill="none" role="img" aria-hidden="true">
          <circle cx="120" cy="102" r="80" fill="#EEEBFB" />
          <rect x="60" y="64" width="120" height="86" rx="11" fill="#fff" stroke="#C7C0F4" stroke-width="2" />
          <rect x="82" y="110" width="15" height="26" rx="3" fill="#C7C0F4" />
          <rect x="108" y="96" width="15" height="40" rx="3" fill="#8E80EC" />
          <rect x="134" y="82" width="15" height="54" rx="3" fill="#5B4BE0" />
          <path
            d="M80 120 L108 102 L134 90 L158 74"
            stroke="#5B4BE0"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="162" cy="66" r="17" fill="#fff" stroke="#5B4BE0" stroke-width="3" />
          <text x="162" y="72" text-anchor="middle" font-size="17" font-weight="800" fill="#5B4BE0">₹</text>
        </svg>
      }
      @case ('purchases') {
        <svg viewBox="0 0 240 200" fill="none" role="img" aria-hidden="true">
          <circle cx="120" cy="102" r="80" fill="#EEEBFB" />
          <path
            d="M80 80 h80 l-8 76 a7 7 0 0 1 -7 6 H95 a7 7 0 0 1 -7 -6 Z"
            fill="#fff"
            stroke="#C7C0F4"
            stroke-width="2"
          />
          <path d="M103 88 V70 a17 17 0 0 1 34 0 v18" fill="none" stroke="#5B4BE0" stroke-width="3" stroke-linecap="round" />
          <rect x="103" y="106" width="34" height="42" rx="4" fill="#5B4BE0" />
          <rect x="110" y="106" width="5" height="42" fill="#8E80EC" />
          <path d="M122 122 l5 5 9-10" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      }
      @case ('study') {
        <svg viewBox="0 0 240 200" fill="none" role="img" aria-hidden="true">
          <circle cx="120" cy="104" r="82" fill="#EEEBFB" />
          <path d="M120 92 L66 74 v62 l54 18 54-18 V74 Z" fill="#fff" stroke="#C7C0F4" stroke-width="2" />
          <path d="M120 92 v80" stroke="#C7C0F4" stroke-width="2" />
          <path d="M120 92 L66 74 l54-18 54 18 Z" fill="#EEEBFB" stroke="#C7C0F4" stroke-width="2" />
          <path d="M90 104 h22M90 116 h22M128 104 h22M128 116 h22" stroke="#C7C0F4" stroke-width="3" stroke-linecap="round" />
          <circle cx="174" cy="64" r="18" fill="#5B4BE0" />
          <path d="M167 64 l5 5 9-10" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      }
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 0;
        width: 100%;
        max-width: 220px;
      }
      svg {
        width: 100%;
        height: auto;
      }
    `,
  ],
})
export class IllustrationComponent {
  name = input.required<'notes' | 'sales' | 'purchases' | 'study'>();
}
