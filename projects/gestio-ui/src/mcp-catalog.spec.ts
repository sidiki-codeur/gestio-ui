import catalog from '../mcp/catalog.json';
import * as publicApi from './public-api';
import * as alert from '@gestiolabs336/ui/alert';
import * as badge from '@gestiolabs336/ui/badge';
import * as button from '@gestiolabs336/ui/button';
import * as card from '@gestiolabs336/ui/card';
import * as checkbox from '@gestiolabs336/ui/checkbox';
import * as core from '@gestiolabs336/ui/core';
import * as datagrid from '@gestiolabs336/ui/datagrid';
import * as dialog from '@gestiolabs336/ui/dialog';
import * as formField from '@gestiolabs336/ui/form-field';
import * as input from '@gestiolabs336/ui/input';
import * as layout from '@gestiolabs336/ui/layout';
import * as menu from '@gestiolabs336/ui/menu';
import * as pagination from '@gestiolabs336/ui/pagination';
import * as radio from '@gestiolabs336/ui/radio';
import * as ripple from '@gestiolabs336/ui/ripple';
import * as select from '@gestiolabs336/ui/select';
import * as skeleton from '@gestiolabs336/ui/skeleton';
import * as spinner from '@gestiolabs336/ui/spinner';
import * as switchEntry from '@gestiolabs336/ui/switch';
import * as table from '@gestiolabs336/ui/table';
import * as tabs from '@gestiolabs336/ui/tabs';
import * as textarea from '@gestiolabs336/ui/textarea';
import * as toast from '@gestiolabs336/ui/toast';
import * as tooltip from '@gestiolabs336/ui/tooltip';
import * as blockActivityFeed from '@gestiolabs336/ui/blocks/activity-feed';
import * as blockCalendar from '@gestiolabs336/ui/blocks/calendar';
import * as blockCarousel from '@gestiolabs336/ui/blocks/carousel';
import * as blockCartSummary from '@gestiolabs336/ui/blocks/cart-summary';
import * as blockEmptyState from '@gestiolabs336/ui/blocks/empty-state';
import * as blockEventCalendar from '@gestiolabs336/ui/blocks/event-calendar';
import * as blockForgotPasswordForm from '@gestiolabs336/ui/blocks/forgot-password-form';
import * as blockLoginForm from '@gestiolabs336/ui/blocks/login-form';
import * as blockOtpInput from '@gestiolabs336/ui/blocks/otp-input';
import * as blockPageHeader from '@gestiolabs336/ui/blocks/page-header';
import * as blockPricingTable from '@gestiolabs336/ui/blocks/pricing-table';
import * as blockProductCard from '@gestiolabs336/ui/blocks/product-card';
import * as blockQuantityInput from '@gestiolabs336/ui/blocks/quantity-input';
import * as blockRating from '@gestiolabs336/ui/blocks/rating';
import * as blockSignupForm from '@gestiolabs336/ui/blocks/signup-form';
import * as blockSocialButton from '@gestiolabs336/ui/blocks/social-button';
import * as blockStatCard from '@gestiolabs336/ui/blocks/stat-card';

/**
 * Le catalogue du serveur MCP (mcp/catalog.json) doit décrire exactement
 * l'API publique : un composant ajouté ou une entrée renommée sans mise à
 * jour du catalogue fait échouer ce test.
 */
interface ComponentDef {
  selectors: unknown[];
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  /** Directives hôtes : { alias public d'origine: alias exposé }. */
  hostDirectives?: { inputs: Record<string, string>; outputs: Record<string, string> }[] | null;
}

/** Entrées / sorties propres et celles exposées par les directives hôtes (ex. CDK Menu). */
function publicNames(def: ComponentDef, kind: 'inputs' | 'outputs'): string[] {
  const exposed = (def.hostDirectives ?? []).flatMap((host) => Object.values(host[kind] ?? {}));
  return [...Object.keys(def[kind]), ...exposed];
}

const api = publicApi as unknown as Record<string, unknown>;

/** Points d'entrée secondaires, indexés par leur nom de paquet. */
const ENTRY_POINTS: Record<string, Record<string, unknown>> = {
  '@gestiolabs336/ui/alert': alert,
  '@gestiolabs336/ui/badge': badge,
  '@gestiolabs336/ui/button': button,
  '@gestiolabs336/ui/card': card,
  '@gestiolabs336/ui/checkbox': checkbox,
  '@gestiolabs336/ui/core': core,
  '@gestiolabs336/ui/datagrid': datagrid,
  '@gestiolabs336/ui/dialog': dialog,
  '@gestiolabs336/ui/form-field': formField,
  '@gestiolabs336/ui/input': input,
  '@gestiolabs336/ui/layout': layout,
  '@gestiolabs336/ui/menu': menu,
  '@gestiolabs336/ui/pagination': pagination,
  '@gestiolabs336/ui/radio': radio,
  '@gestiolabs336/ui/ripple': ripple,
  '@gestiolabs336/ui/select': select,
  '@gestiolabs336/ui/skeleton': skeleton,
  '@gestiolabs336/ui/spinner': spinner,
  '@gestiolabs336/ui/switch': switchEntry,
  '@gestiolabs336/ui/table': table,
  '@gestiolabs336/ui/tabs': tabs,
  '@gestiolabs336/ui/textarea': textarea,
  '@gestiolabs336/ui/toast': toast,
  '@gestiolabs336/ui/tooltip': tooltip,
  '@gestiolabs336/ui/blocks/activity-feed': blockActivityFeed,
  '@gestiolabs336/ui/blocks/calendar': blockCalendar,
  '@gestiolabs336/ui/blocks/carousel': blockCarousel,
  '@gestiolabs336/ui/blocks/cart-summary': blockCartSummary,
  '@gestiolabs336/ui/blocks/empty-state': blockEmptyState,
  '@gestiolabs336/ui/blocks/event-calendar': blockEventCalendar,
  '@gestiolabs336/ui/blocks/forgot-password-form': blockForgotPasswordForm,
  '@gestiolabs336/ui/blocks/login-form': blockLoginForm,
  '@gestiolabs336/ui/blocks/otp-input': blockOtpInput,
  '@gestiolabs336/ui/blocks/page-header': blockPageHeader,
  '@gestiolabs336/ui/blocks/pricing-table': blockPricingTable,
  '@gestiolabs336/ui/blocks/product-card': blockProductCard,
  '@gestiolabs336/ui/blocks/quantity-input': blockQuantityInput,
  '@gestiolabs336/ui/blocks/rating': blockRating,
  '@gestiolabs336/ui/blocks/signup-form': blockSignupForm,
  '@gestiolabs336/ui/blocks/social-button': blockSocialButton,
  '@gestiolabs336/ui/blocks/stat-card': blockStatCard,
};

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
    // Les exports préfixés par ɵ sont internes (partagés entre points d'entrée).
    const runtime = Object.keys(api).filter(
      (name) =>
        !name.startsWith('ɵ') && (typeof api[name] === 'function' || Array.isArray(api[name])),
    );
    expect(runtime.filter((name) => !documented.has(name))).toEqual([]);
  });

  for (const entry of catalog.components) {
    it(`${entry.id} : exporté par son point d'entrée ${entry.entryPoint}`, () => {
      const module = ENTRY_POINTS[entry.entryPoint];
      expect(module, `point d'entrée inconnu`).toBeDefined();
      // Seuls les exports présents à l'exécution sont vérifiables (pas les types).
      const runtime = entry.exports.filter((name) => name in api);
      expect(runtime.filter((name) => !(name in module))).toEqual([]);
    });

    it(`${entry.id} : entrées et sorties conformes au code`, () => {
      const defs = entry.classes.map((k) => {
        const def = definition(k.class);
        expect(def, `${k.class} introuvable dans l'API publique`).toBeDefined();
        return def!;
      });
      const actualInputs = new Set(defs.flatMap((d) => publicNames(d, 'inputs')));
      const actualOutputs = new Set(defs.flatMap((d) => publicNames(d, 'outputs')));
      const documentedInputs = new Set(entry.inputs.map((i) => i.name));
      const documentedOutputs = new Set(entry.outputs.map((o) => o.name));

      expect([...documentedInputs].sort()).toEqual([...actualInputs].sort());
      expect([...documentedOutputs].sort()).toEqual([...actualOutputs].sort());
    });
  }
});
