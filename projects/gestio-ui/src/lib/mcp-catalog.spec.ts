import catalog from '../../mcp/catalog.json';
import * as publicApi from '../public-api';

/**
 * Le catalogue du serveur MCP (mcp/catalog.json) doit décrire exactement
 * l'API publique : un composant ajouté ou une entrée renommée sans mise à
 * jour du catalogue fait échouer ce test.
 */
interface ComponentDef {
  selectors: unknown[];
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

const api = publicApi as unknown as Record<string, unknown>;

/** Définition compilée d'un composant (ɵcmp) ou d'une directive (ɵdir). */
function definition(className: string): ComponentDef | undefined {
  const value = api[className] as { ɵcmp?: ComponentDef; ɵdir?: ComponentDef } | undefined;
  return value?.ɵcmp ?? value?.ɵdir;
}

describe('Catalogue MCP', () => {
  it('documente chaque composant et directive exportés', () => {
    const documented = new Set(catalog.components.flatMap((c) => c.classes.map((k) => k.class)));
    const exported = Object.keys(api).filter((name) => definition(name));
    // Composant interne utilisé par GestioDialogService.confirm().
    const missing = exported.filter(
      (name) => !documented.has(name) && name !== 'GestioConfirmDialog',
    );
    expect(missing).toEqual([]);
  });

  it('documente chaque service et fonction exportés', () => {
    const documented = new Set(catalog.components.flatMap((c) => c.exports));
    const runtime = Object.keys(api).filter(
      (name) => typeof api[name] === 'function' || Array.isArray(api[name]),
    );
    expect(runtime.filter((name) => !documented.has(name))).toEqual([]);
  });

  for (const entry of catalog.components) {
    it(`${entry.id} : entrées et sorties conformes au code`, () => {
      const defs = entry.classes.map((k) => {
        const def = definition(k.class);
        expect(def, `${k.class} introuvable dans l'API publique`).toBeDefined();
        return def!;
      });
      const actualInputs = new Set(defs.flatMap((d) => Object.keys(d.inputs)));
      const actualOutputs = new Set(defs.flatMap((d) => Object.keys(d.outputs)));
      const documentedInputs = new Set(entry.inputs.map((i) => i.name));
      const documentedOutputs = new Set(entry.outputs.map((o) => o.name));

      expect([...documentedInputs].sort()).toEqual([...actualInputs].sort());
      expect([...documentedOutputs].sort()).toEqual([...actualOutputs].sort());
    });
  }
});
