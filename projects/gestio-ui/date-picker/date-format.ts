/*
 * Mise en forme et lecture tolérante des dates saisies au clavier (heure locale).
 * Usage interne au sélecteur de date.
 */

export type DatePart = 'day' | 'month' | 'year';

/** Résultat de lecture : date, champ vide, ou texte non reconnu. */
export type ParsedDate =
  { kind: 'empty' } | { kind: 'invalid' } | { kind: 'date'; date: Date; complete: boolean };

const SAMPLE = new Date(2026, 10, 22);

function numericFormatter(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Ordre jour / mois / année de la locale (`fr-FR` : jour, mois, année). */
export function partOrder(locale: string): DatePart[] {
  return numericFormatter(locale)
    .formatToParts(SAMPLE)
    .map((part) => part.type)
    .filter((type): type is DatePart => type === 'day' || type === 'month' || type === 'year');
}

/** Date au format numérique court de la locale (`28/10/2026`). */
export function formatDate(date: Date, locale: string): string {
  return numericFormatter(locale).format(date);
}

/** Gabarit lisible du format (`jj/mm/aaaa`). */
export function formatPattern(locale: string, names: Record<DatePart, string>): string {
  return numericFormatter(locale)
    .formatToParts(SAMPLE)
    .map((part) =>
      part.type === 'day' || part.type === 'month' || part.type === 'year'
        ? names[part.type]
        : part.value,
    )
    .join('');
}

/** Minuscules sans accents ni point final (« Févr. » → « fevr »). */
function normalize(text: string, locale: string): string {
  return text.toLocaleLowerCase(locale).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\./g, '');
}

/** Noms de mois (longs et courts) normalisés, indexés de 0 à 11. */
function monthNames(locale: string): string[][] {
  const long = new Intl.DateTimeFormat(locale, { month: 'long' });
  const short = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(2026, month, 1);
    return [normalize(long.format(date), locale), normalize(short.format(date), locale)];
  });
}

function buildDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  // 31/02 → 3 mars : refusé.
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function fullYear(text: string): number {
  const year = Number(text);
  return text.length <= 2 ? 2000 + year : year;
}

/**
 * Lit une date saisie librement :
 * - séparateurs quelconques (`28/10/2026`, `28.10.26`, `28-10-2026`, `28 10 2026`) ;
 * - chiffres collés (`28102026`) ;
 * - ISO (`2026-10-28`) ;
 * - mois en lettres (`28 oct. 2026`, `28 octobre`) ;
 * - année omise (`28/10`) : année de `referenceYear`.
 *
 * `complete` est vrai si l'année est saisie sur 4 chiffres : la date peut alors être
 * validée pendant la frappe, sans attendre la sortie du champ.
 */
export function parseDate(text: string, locale: string, referenceYear: number): ParsedDate {
  const trimmed = text.trim();
  if (!trimmed) return { kind: 'empty' };

  const order = partOrder(locale);
  const letters = normalize(trimmed, locale).match(/\p{L}+/gu);
  let groups: string[] = trimmed.match(/\d+/g) ?? [];
  let day: string | undefined;
  let month: string | undefined;
  let year: string | undefined;

  if (letters) {
    // Mois en lettres : le premier mot reconnu donne le mois, les nombres le jour et l'année.
    const names = monthNames(locale);
    const word = letters.find((candidate) =>
      names.some((forms) =>
        forms.some((name) => candidate.length >= 3 && name.startsWith(candidate)),
      ),
    );
    if (!word || letters.length > 1 || groups.length < 1 || groups.length > 2) {
      return { kind: 'invalid' };
    }
    const index = names.findIndex((forms) => forms.some((name) => name.startsWith(word)));
    month = String(index + 1);
    [day, year] = groups;
  } else {
    if (groups.length === 1 && (groups[0].length === 8 || groups[0].length === 6)) {
      // Chiffres collés, découpés selon l'ordre de la locale.
      const digits = groups[0];
      const yearLength = digits.length - 4;
      groups = [];
      let cursor = 0;
      for (const part of order) {
        const length = part === 'year' ? yearLength : 2;
        groups.push(digits.slice(cursor, cursor + length));
        cursor += length;
      }
    }

    if (groups.length === 3 && groups[0].length === 4) {
      [year, month, day] = groups;
    } else if (groups.length === 3) {
      const values: Partial<Record<DatePart, string>> = {};
      order.forEach((part, index) => (values[part] = groups[index]));
      ({ day, month, year } = values);
    } else if (groups.length === 2) {
      const [first, second] = order.filter((part) => part !== 'year');
      const values: Partial<Record<DatePart, string>> = {
        [first]: groups[0],
        [second]: groups[1],
      };
      ({ day, month } = values);
    } else {
      return { kind: 'invalid' };
    }
  }

  if (!day || !month || (year !== undefined && year.length !== 2 && year.length !== 4)) {
    return { kind: 'invalid' };
  }
  const date = buildDate(
    year === undefined ? referenceYear : fullYear(year),
    Number(month),
    Number(day),
  );
  return date ? { kind: 'date', date, complete: year?.length === 4 } : { kind: 'invalid' };
}

/** Séparateurs reconnus entre les deux dates d'une plage. */
const RANGE_SEPARATOR = /\s*[–—]\s*|\s+-\s+|\s+(?:au|à|a|to|until|bis|al)\s+/i;

/** Découpe une plage saisie (`01/10/2026 – 15/10/2026`) ; `null` si un seul morceau. */
export function splitRange(text: string): [string, string] | null {
  const parts = text.split(RANGE_SEPARATOR);
  return parts.length === 2 ? [parts[0], parts[1]] : null;
}
