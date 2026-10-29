// Utilitaires internes aux graphiques (non exportés par le point d'entrée).

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Pas « joli » (1, 2 ou 5 × 10^n) proche de `raw`. */
function niceStep(raw: number): number {
  const exponent = Math.floor(Math.log10(raw));
  const base = 10 ** exponent;
  const fraction = raw / base;
  const nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  return nice * base;
}

/**
 * Graduations « jolies » couvrant `[min, max]` (la première et la dernière
 * graduation bornent le domaine de l'axe).
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!isFiniteNumber(min) || !isFiniteNumber(max)) return [0, 1];
  if (min > max) [min, max] = [max, min];
  if (min === max) {
    // Série constante : on ouvre le domaine autour de la valeur.
    const pad = Math.abs(min) || 1;
    min = min >= 0 ? 0 : min - pad;
    max = max <= 0 ? 0 : max + (min === 0 ? 0 : pad);
    if (min === max) max = min + pad;
  }
  const step = niceStep((max - min) / Math.max(1, count));
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let i = 0; start + i * step <= end + step / 2; i++) {
    const tick = Number((start + i * step).toFixed(decimals));
    ticks.push(Object.is(tick, -0) ? 0 : tick);
  }
  return ticks.length > 1 ? ticks : [start, start + step];
}

/** Jetons de repli de la palette (`--gestio-chart-N` n'est pas obligatoire). */
const PALETTE_FALLBACKS = [
  '--gestio-color-primary',
  '--gestio-color-info',
  '--gestio-color-warning',
  '--gestio-color-success',
  '--gestio-color-danger',
  '--gestio-color-neutral',
  '--gestio-color-primary-text',
  '--gestio-color-info-text',
];

/** Couleur de la série `index` : jeton de données, puis jeton sémantique. */
export function chartColor(index: number, custom?: string): string {
  if (custom) return custom;
  const slot = index % PALETTE_FALLBACKS.length;
  return `var(--gestio-chart-${slot + 1}, var(${PALETTE_FALLBACKS[slot]}))`;
}

/**
 * Motifs superposés aux aplats (barres, parts) pour ne pas reposer sur la
 * seule couleur. Le premier est un aplat uni.
 */
export const CHART_PATTERNS: readonly string[] = [
  '',
  'M-2 2l4-4M0 8l8-8M6 10l4-4',
  'M2.5 2.5h1v1h-1zM6.5 6.5h1v1h-1z',
  'M0 2h8M0 6h8',
  'M0 0l8 8M8 0l-8 8',
  'M2 0v8M6 0v8',
  'M-2 6l4 4M0 0l8 8M6 -2l4 4',
  'M0 4h8M4 0v8',
];

/** Motif de la série `index` (0 : aplat uni). */
export function patternIndex(index: number): number {
  return index % CHART_PATTERNS.length;
}

/** Traits des courbes : continu, tirets, pointillés, mixte. */
const DASHES = ['', '6 4', '2 4', '10 4 2 4'];

export function chartDash(index: number): string | null {
  return DASHES[index % DASHES.length] || null;
}

/** Forme des marqueurs : cercle, carré, triangle, losange (pleins puis creux). */
export function markerPath(index: number, x: number, y: number, r = 4): string {
  const f = (n: number) => n.toFixed(2);
  switch (index % 4) {
    case 1:
      return `M${f(x - r)} ${f(y - r)}h${f(r * 2)}v${f(r * 2)}h${f(-r * 2)}Z`;
    case 2:
      return `M${f(x)} ${f(y - r * 1.25)}L${f(x + r * 1.2)} ${f(y + r * 0.9)}H${f(x - r * 1.2)}Z`;
    case 3:
      return `M${f(x)} ${f(y - r * 1.3)}L${f(x + r * 1.3)} ${f(y)}L${f(x)} ${f(y + r * 1.3)}L${f(x - r * 1.3)} ${f(y)}Z`;
    default:
      return `M${f(x - r)} ${f(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
  }
}

/** Les marqueurs des séries 5 à 8 sont creux. */
export function markerHollow(index: number): boolean {
  return index % 8 >= 4;
}

/** Largeur approximative d'un texte de 12 px (pour réserver les marges des axes). */
export function textWidth(text: string): number {
  return text.length * 6.6;
}
