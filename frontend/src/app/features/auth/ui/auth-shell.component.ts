import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Shared auth layout: brand panel (left) + card panel (right) + responsive mobile header.
 * Project content into the two slots:
 *   <div brand>…brand body (eyebrow, headline, stats/perks)…</div>
 *   <div card>…the auth card content…</div>
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="shell">
      <aside class="brand">
        <a class="logo" routerLink="/" aria-label="TopNotes home">
          <span class="logo-mark"><span>T</span></span> TopNotes
        </a>
        <div class="brand-body"><ng-content select="[brand]" /></div>
        <p class="brand-foot">Trusted by aspirants across 320+ cities in India.</p>
      </aside>

      <main class="auth">
        <div class="mobile-head">
          <a class="logo" routerLink="/" aria-label="TopNotes home">
            <span class="logo-mark"><span>T</span></span> TopNotes
          </a>
          <p class="tagline">Notes from real toppers, <em>verified.</em></p>
        </div>
        <div class="card anim-slide-up"><ng-content select="[card]" /></div>
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        height: 100vh;
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        overflow: hidden;
      }

      .brand {
        position: relative;
        overflow: hidden;
        color: #fff;
        padding: 56px 64px;
        display: flex;
        flex-direction: column;
        background:
          radial-gradient(120% 90% at 12% 8%, rgba(91, 75, 224, 0.55) 0%, rgba(91, 75, 224, 0) 55%),
          radial-gradient(120% 120% at 95% 100%, rgba(245, 165, 36, 0.3) 0%, rgba(245, 165, 36, 0) 50%),
          linear-gradient(160deg, var(--c-primary-hover) 0%, var(--c-primary) 48%, #34287d 100%);
      }
      .brand::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 38px);
        -webkit-mask-image: radial-gradient(80% 80% at 70% 30%, #000 0%, transparent 75%);
        mask-image: radial-gradient(80% 80% at 70% 30%, #000 0%, transparent 75%);
      }
      .brand > * {
        position: relative;
        z-index: 1;
      }
      .brand-body {
        margin: auto 0;
        padding: 48px 0;
        max-width: 460px;
      }
      .brand-foot {
        font-size: var(--text-xs);
        color: rgba(255, 255, 255, 0.5);
      }

      .logo {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        font-weight: 800;
        font-size: var(--text-lg);
        letter-spacing: -0.01em;
      }
      .logo-mark {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: linear-gradient(150deg, #fff, var(--c-primary-50));
        color: var(--c-primary);
        font-weight: 800;
        font-size: var(--text-lg);
        box-shadow: var(--shadow-sm);
      }
      .logo-mark span {
        transform: translateY(-1px);
      }

      .auth {
        display: flex;
        height: 100%;
        overflow-y: auto;
        padding: 40px 48px;
        background: var(--c-canvas);
      }
      .card {
        width: 100%;
        max-width: 460px;
        margin: auto;
        background: var(--c-surface);
        border: 1px solid var(--c-line);
        border-radius: 16px;
        box-shadow: var(--shadow-md);
        padding: 36px 40px;
      }

      .mobile-head {
        display: none;
      }
      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
          height: auto;
          overflow: visible;
        }
        .brand {
          display: none;
        }
        .auth {
          padding: 0;
          height: auto;
          overflow: visible;
        }
        .card {
          max-width: 480px;
          margin: 0 auto;
          border: none;
          box-shadow: none;
          border-radius: 0;
          padding: 32px 24px 48px;
        }
        .mobile-head {
          display: block;
          color: #fff;
          padding: 22px 24px;
          background:
            radial-gradient(120% 140% at 90% 0%, rgba(245, 165, 36, 0.28) 0%, rgba(245, 165, 36, 0) 55%),
            linear-gradient(135deg, var(--c-primary-hover), var(--c-primary));
        }
        .mobile-head .logo {
          font-size: var(--text-base);
        }
        .mobile-head .logo-mark {
          width: 32px;
          height: 32px;
          font-size: var(--text-base);
        }
        .mobile-head .tagline {
          margin: 14px 0 0;
          font-size: var(--text-base);
          font-weight: 700;
          line-height: 1.3;
          max-width: 320px;
        }
        .mobile-head .tagline em {
          font-style: normal;
          color: var(--c-accent);
        }
      }
      @media (max-width: 360px) {
        .card {
          padding: 28px 18px 40px;
        }
      }
    `,
  ],
})
export class AuthShellComponent {}
