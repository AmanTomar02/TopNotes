/**
 * Shared display helpers for notes — single source of truth for subject colours,
 * exam labels, initials and currency formatting (previously duplicated across components).
 */

/** Subject → [from, to] gradient stops for note thumbnails. */
export const SUBJECT_COLORS: Record<string, [string, string]> = {
  Physics: ['#5B4BE0', '#3B2F8F'],
  Chemistry: ['#16A34A', '#0E7A38'],
  Biology: ['#0EA5A4', '#0A7572'],
  Mathematics: ['#F5A524', '#D97706'],
  Maths: ['#F5A524', '#D97706'],
  English: ['#DC2626', '#9F1D1D'],
};

export const EXAM_LABELS: Record<string, string> = {
  JEE_MAIN: 'JEE Main',
  JEE_ADVANCED: 'JEE Adv.',
  NEET: 'NEET',
  BOARD: 'Board',
};

function colors(subject?: string): [string, string] {
  return SUBJECT_COLORS[subject ?? ''] ?? ['#5B4BE0', '#3B2F8F'];
}

/** Textured thumbnail background (ruled-paper look) — used on note cards / detail preview. */
export function subjectGradient(subject?: string): string {
  const [a, b] = colors(subject);
  return `repeating-linear-gradient(0deg, rgba(255,255,255,.10) 0 1px, transparent 1px 22px), linear-gradient(150deg, ${a}, ${b})`;
}

/** Flat thumbnail background — used on small list/table thumbnails. */
export function subjectGradientFlat(subject?: string): string {
  const [a, b] = colors(subject);
  return `linear-gradient(150deg, ${a}, ${b})`;
}

export function examLabel(examType?: string): string {
  return EXAM_LABELS[examType ?? ''] ?? examType ?? '';
}

export function initials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** Full rupee amount, e.g. ₹1,299. */
export function rupee(value?: number): string {
  return '₹' + (value ?? 0).toLocaleString('en-IN');
}

/** Compact rupee for charts, e.g. ₹1.4k. */
export function rupeeShort(value: number): string {
  return '₹' + (value / 1000).toFixed(1) + 'k';
}
