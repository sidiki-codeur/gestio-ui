let nextUniqueId = 0;

/**
 * Génère un identifiant unique pour associer les éléments d'un composant
 * (label, champ, aide, erreur…). Usage interne.
 */
export function gestioUniqueId(prefix: string): string {
  return `${prefix}-${nextUniqueId++}`;
}
