import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let _cid = 0;

/** Lightweight SVG area/line chart (no chart lib). Reused on seller + admin dashboards. */
@Component({
  selector: 'app-area-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="chart" viewBox="0 0 600 240" preserveAspectRatio="none" role="img" aria-label="Revenue chart">
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5B4BE0" stop-opacity=".22" />
          <stop offset="1" stop-color="#5B4BE0" stop-opacity="0" />
        </linearGradient>
      </defs>
      @for (g of grid(); track g.y) {
        <line x1="40" [attr.y1]="g.y" x2="590" [attr.y2]="g.y" stroke="#EAECF0" stroke-width="1" />
        <text [attr.x]="32" [attr.y]="g.y + 4" text-anchor="end" font-size="10" fill="#98A2B3">{{ g.label }}</text>
      }
      @if (data().length > 1) {
        <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gid + ')'" />
        <path
          [attr.d]="linePath()"
          fill="none"
          stroke="#5B4BE0"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle [attr.cx]="lastX()" [attr.cy]="lastY()" r="4" fill="#5B4BE0" stroke="#fff" stroke-width="2" />
      }
      @for (l of labelTicks(); track l.x) {
        <text [attr.x]="l.x" y="232" text-anchor="middle" font-size="10" fill="#98A2B3">{{ l.text }}</text>
      }
    </svg>
  `,
})
export class AreaChartComponent {
  data = input<number[]>([]);
  labels = input<string[]>([]);
  /** value formatter for the y-axis grid labels */
  fmt = input<(v: number) => string>((v) => String(Math.round(v)));

  protected readonly gid = `cg-${++_cid}`;
  private readonly W = 600;
  private readonly H = 240;
  private readonly pad = { t: 16, r: 10, b: 28, l: 40 };

  private max = computed(() => Math.max(1, ...this.data()) * 1.15);
  private iw = this.W - this.pad.r - this.pad.l;
  private ih = this.H - this.pad.t - this.pad.b;

  private x = (i: number) => this.pad.l + (i / Math.max(1, this.data().length - 1)) * this.iw;
  private y = (v: number) => this.pad.t + this.ih - (v / this.max()) * this.ih;

  protected linePath = computed(() =>
    this.data()
      .map((v, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(1)},${this.y(v).toFixed(1)}`)
      .join(' '),
  );
  protected areaPath = computed(() => {
    const n = this.data().length;
    return `${this.linePath()} L${this.x(n - 1).toFixed(1)},${this.pad.t + this.ih} L${this.pad.l},${this.pad.t + this.ih} Z`;
  });
  protected lastX = computed(() => this.x(this.data().length - 1));
  protected lastY = computed(() => this.y(this.data()[this.data().length - 1] ?? 0));

  protected grid = computed(() =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      y: this.pad.t + this.ih - f * this.ih,
      label: this.fmt()(f * this.max()),
    })),
  );

  protected labelTicks = computed(() => {
    const labels = this.labels();
    const n = this.data().length;
    if (!labels.length || n < 2) return [];
    return labels.map((text, i) => ({
      x: this.x(Math.round((i * (n - 1)) / (labels.length - 1))),
      text,
    }));
  });
}
