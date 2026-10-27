/*
 * Utilitaires de dates purs (aucune mutation des `Date` reçues), en heure locale.
 * Partagés avec @gestiolabs336/ui/blocks/event-calendar via les exports préfixés par ɵ.
 */

/** Jour de la semaine : 0 = dimanche … 6 = samedi (convention de `Date#getDay`). */
export type GestioWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Même jour, à minuit (heure locale). */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Premier jour du mois, à minuit. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Décale de `days` jours (gère les changements d'heure). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Décale de `months` mois ; le jour est borné au dernier jour du mois cible (31 janv. + 1 → 28/29 févr.). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Compare deux jours en ignorant l'heure : négatif, 0 ou positif. */
export function compareDays(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

/** Premier jour de la semaine contenant `date`. */
export function startOfWeek(date: Date, firstDayOfWeek: GestioWeekday): Date {
  const offset = (date.getDay() - firstDayOfWeek + 7) % 7;
  return addDays(date, -offset);
}

/** Clé stable `AAAA-MM-JJ`, utile pour le suivi des listes et les sélecteurs DOM. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Semaines (de 7 jours) couvrant le mois de `month`, en commençant par `firstDayOfWeek`.
 * Inclut les jours des mois voisins nécessaires pour compléter la première et la dernière semaine.
 */
export function monthWeeks(month: Date, firstDayOfWeek: GestioWeekday): Date[][] {
  const first = startOfMonth(month);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  let cursor = startOfWeek(first, firstDayOfWeek);
  while (compareDays(cursor, last) <= 0) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

/** Noms des jours de la semaine, dans l'ordre d'affichage. */
export function weekdayNames(
  locale: string,
  firstDayOfWeek: GestioWeekday,
  format: 'long' | 'short' | 'narrow',
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
  // 4 janvier 1970 : un dimanche.
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(1970, 0, 4 + ((firstDayOfWeek + index) % 7))),
  );
}

/** Met en majuscule la première lettre (« octobre 2026 » → « Octobre 2026 »). */
export function capitalize(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
