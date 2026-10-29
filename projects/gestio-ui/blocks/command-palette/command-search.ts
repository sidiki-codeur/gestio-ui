/** Commande proposée par la palette. */
export interface GestioCommand {
  /** Identifiant unique (clé de suivi). */
  readonly id: string;
  /** Libellé affiché et recherché. */
  readonly label: string;
  /** Groupe d'affichage (« Navigation », « Créer »…). */
  readonly group?: string;
  /** Synonymes recherchés mais non affichés. */
  readonly keywords?: readonly string[];
  /** Raccourci affiché à titre indicatif (« Ctrl+N »). */
  readonly shortcut?: string;
  /** Icône décorative courte (caractère ou emoji), masquée aux lecteurs d'écran. */
  readonly icon?: string;
  /** Affichée mais non exécutable. */
  readonly disabled?: boolean;
}

/** Minuscules sans accents ni espaces superflus. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Score d'une sous-séquence (lettres dans l'ordre) : 1 à 19, ou -1. */
function subsequenceScore(needle: string, haystack: string): number {
  let from = 0;
  let first = -1;
  let last = -1;
  for (const char of needle) {
    const index = haystack.indexOf(char, from);
    if (index < 0) return -1;
    if (first < 0) first = index;
    last = index;
    from = index + 1;
  }
  const spread = last - first + 1 - needle.length;
  return 10 + Math.max(0, 9 - spread);
}

function tokenScore(
  token: string,
  label: string,
  keywords: readonly string[],
  group: string,
): number {
  if (label === token) return 120;
  if (label.startsWith(token)) return 100;
  if (new RegExp(`[\\s\\-_/.'’]${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(label)) {
    return 80;
  }
  if (label.includes(token)) return 60;
  if (keywords.some((keyword) => keyword.startsWith(token))) return 50;
  if (keywords.some((keyword) => keyword.includes(token))) return 40;
  if (group.includes(token)) return 20;
  return subsequenceScore(token, label);
}

/**
 * Filtre et trie des commandes pour une recherche floue, insensible à la
 * casse et aux accents. Chaque mot de la recherche doit correspondre au
 * libellé (début, mot, sous-chaîne ou lettres dans l'ordre), à un mot-clé
 * ou au groupe. Une recherche vide retourne toutes les commandes dans leur
 * ordre d'origine ; sinon, tri par pertinence (ordre d'origine à égalité).
 */
export function gestioFilterCommands(
  commands: readonly GestioCommand[],
  query: string,
): GestioCommand[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [...commands];

  const scored: { command: GestioCommand; score: number; index: number }[] = [];
  commands.forEach((command, index) => {
    const label = normalize(command.label);
    const keywords = (command.keywords ?? []).map(normalize);
    const group = normalize(command.group ?? '');
    let score = 0;
    for (const token of tokens) {
      const value = tokenScore(token, label, keywords, group);
      if (value < 0) return;
      score += value;
    }
    scored.push({ command, score, index });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.command);
}
