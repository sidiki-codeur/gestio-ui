import { GestioBreakpointOrBase, GestioResponsive, GestioSpace } from './responsive';

// Utilitaires internes des layouts (non exportés par l'API publique).

const ORDER: readonly GestioBreakpointOrBase[] = ['base', 'sm', 'md', 'lg', 'xl'];

/**
 * Résout une valeur responsive en une valeur par point de rupture
 * (chaque point hérite du précédent). Usage interne.
 */
export function resolveResponsive<T>(
  value: GestioResponsive<T> | undefined,
  fallback: T,
): Record<GestioBreakpointOrBase, T> {
  const isMap =
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => (ORDER as readonly string[]).includes(key));
  const map = (isMap ? value : { base: value ?? fallback }) as Partial<
    Record<GestioBreakpointOrBase, T>
  >;
  const result = {} as Record<GestioBreakpointOrBase, T>;
  let current = map.base ?? fallback;
  for (const breakpoint of ORDER) {
    current = map[breakpoint] ?? current;
    result[breakpoint] = current;
  }
  return result;
}

/** Variables CSS `--{prefix}-{bp}` pour chaque point de rupture. Usage interne. */
export function responsiveVars<T>(
  prefix: string,
  values: Record<GestioBreakpointOrBase, T>,
  format: (value: T) => string = String,
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const breakpoint of ORDER) vars[`${prefix}-${breakpoint}`] = format(values[breakpoint]);
  return vars;
}

export const spaceToken = (space: GestioSpace) => `var(--gestio-space-${space})`;
