# Gestio UI

Bibliothèque de composants Angular pour les tableaux de bord, logiciels de gestion et interfaces
d’administration, accompagnée d’un catalogue interactif (showcase).

- Angular 22 (composants standalone, signaux, détection OnPush par défaut, zoneless)
- `@angular/cdk` 22 pour la modale (overlay, piège et restauration du focus) et les annonces
  accessibles des notifications
- Thème par design tokens CSS `--gestio-*`, clair et sombre
- Aucune ressource externe (polices système, icônes SVG inline)
- Serveur MCP intégré au paquet pour que les assistants IA connaissent l’API exacte

## Structure

```
projects/
  gestio-ui/                    Bibliothèque (ng-packagr)
    src/public-api.ts           API publique : tout import passe par « @gestiolabs/ui »
    src/styles/gestio-ui.css    Thème : tokens, modes clair / sombre / système, styles d’overlay
    src/lib/
      core/                     Utilitaires internes (identifiants, types, styles de champ partagés)
      button/ input/ textarea/ checkbox/ select/
      card/ badge/ table/ datagrid/ dialog/ toast/ tabs/
      layout/                   Container, pile, grille, coque d’application, points de rupture
    mcp/                        Serveur MCP (server.mjs), catalogue vérifié par les tests, README
  showcase/                     Application de démonstration
    src/app/core/               Thème du showcase, navigation
    src/app/shared/             Exemple, bloc de code copiable, tableau d’API, en-tête de page
    src/app/pages/              Une page par composant + introduction, fondations, formulaire, 404
dist/
  gestio-ui/                    Paquet compilé (fesm2022, types, styles/gestio-ui.css)
```

Le showcase importe la bibliothèque via l’alias TypeScript `gestio-ui` → `dist/gestio-ui`
(`tsconfig.json`). **La bibliothèque doit donc être compilée avant le showcase.**

## Commandes

| Commande                 | Effet                                                      |
| ------------------------ | ---------------------------------------------------------- |
| `npm start`              | Compile la bibliothèque puis lance le showcase (port 4200) |
| `npm run build`          | Compile la bibliothèque puis le showcase (production)      |
| `npm run build:lib`      | Compile la bibliothèque dans `dist/gestio-ui`              |
| `npm run watch:lib`      | Recompile la bibliothèque à chaque modification            |
| `npm run serve:showcase` | Lance uniquement le showcase (bibliothèque déjà compilée)  |
| `npm run build:showcase` | Compile uniquement le showcase                             |
| `npm test`               | Tests de la bibliothèque, du showcase et du serveur MCP    |
| `npm run test:lib`       | Tests de la bibliothèque (mode watch)                      |
| `npm run test:mcp`       | Tests du protocole du serveur MCP (`node --test`)          |
| `npm run mcp`            | Lance le serveur MCP depuis les sources (stdio)            |

Développement avec rechargement de la bibliothèque, dans deux terminaux :

```bash
npm run watch:lib
npm run serve:showcase
```

## Utiliser la bibliothèque dans une application

### 1. Dépendances

`@gestiolabs/ui` déclare en `peerDependencies` : `@angular/core`, `@angular/common`, `@angular/forms`
et `@angular/cdk` (^22.2).

### 2. Importer le thème

Le fichier `styles/gestio-ui.css` est copié dans le paquet et exposé dans `exports`. Dans
`angular.json` de l’application hôte :

```json
"styles": [
  "node_modules/@gestiolabs/ui/styles/gestio-ui.css",
  "src/styles.css"
]
```

ou, dans une feuille de styles globale : `@import '@gestiolabs/ui/styles/gestio-ui.css';`

Dans ce workspace, le showcase référence directement `dist/gestio-ui/styles/gestio-ui.css`.

Le thème ne contient que des variables `--gestio-*` et des classes `.gestio-*` utilisées par les
overlays : il ne stylise aucun élément HTML de l’application hôte. Les styles des composants sont
encapsulés (pas de `::ng-deep`).

### 3. Thème sombre

- Sombre : `<html data-gestio-theme="dark">`
- Selon le système (`prefers-color-scheme`) : `<html data-gestio-theme="system">`

Placez l’attribut sur `<html>` : les modales et notifications, rendues dans `<body>`, en héritent.

### 4. Composants

```ts
import { GestioButton, GestioInput, GestioSelect, GestioSelectOption } from '@gestiolabs/ui';

@Component({
  imports: [ReactiveFormsModule, GestioButton, GestioInput, GestioSelect],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <gestio-input
        label="Raison sociale"
        formControlName="name"
        required
        [error]="
          form.controls.name.touched && form.controls.name.invalid ? 'Champ obligatoire.' : null
        "
      />
      <gestio-input label="Effectif" type="number" formControlName="employees" />
      <gestio-select label="Délai" [options]="delays" formControlName="delay" />
      <button gestioButton type="submit" [loading]="saving()">Enregistrer</button>
    </form>
  `,
})
export class ClientForm {
  delays: GestioSelectOption<number>[] = [
    { label: '30 jours', value: 30 },
    { label: '45 jours fin de mois', value: 45 },
  ];
}
```

| Composant       | Sélecteur / API                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Bouton          | `button[gestioButton]`, `a[gestioButton]`                                                                       |
| Champ de saisie | `gestio-input` (ControlValueAccessor ; `number \| null` si `type="number"`)                                     |
| Zone de texte   | `gestio-textarea` (ControlValueAccessor)                                                                        |
| Case à cocher   | `gestio-checkbox` (ControlValueAccessor booléen, `[(checked)]`)                                                 |
| Sélecteur       | `gestio-select` (select natif, type string/number préservé)                                                     |
| Carte           | `gestio-card` + `GESTIO_CARD_IMPORTS` (`[gestioCardActions]`, `[gestioCardFooter]`)                             |
| Badge           | `gestio-badge`                                                                                                  |
| Tableau         | `table[gestioTable]`, `gestio-table-container` (tableau HTML natif mis en forme)                                |
| Mises en page   | `gestio-container`, `gestio-stack`, `gestio-grid` + `[gestioGridSpan]`, `gestio-app-shell`, `GestioBreakpoints` |
| Datagrid        | `gestio-datagrid` + `ng-template[gestioCell]` (tri, recherche, pagination, sélection)                           |
| Modale          | `GestioDialogService`, `gestio-dialog` + `GESTIO_DIALOG_IMPORTS`                                                |
| Notifications   | `GestioToastService`, `gestio-toaster`, `provideGestioToast()`                                                  |
| Onglets         | `gestio-tabs` / `gestio-tab`                                                                                    |

Le détail des entrées de chaque composant est présenté dans le showcase.

### 5. Notifications

```ts
// app.config.ts
providers: [provideGestioToast({ duration: 5000, maxVisible: 3, position: 'bottom-right' })];
```

```html
<!-- app.html : une seule fois -->
<router-outlet />
<gestio-toaster />
```

```ts
private readonly toast = inject(GestioToastService);
this.toast.success('Facture envoyée.', { title: 'Succès' });
this.toast.error('Échec du paiement.', { duration: 0 }); // 0 = persistante
```

L’état est porté par l’instance du service, fournie à la racine de l’application (une instance
par requête en SSR). Les minuteurs et annonces ne sont créés que dans le navigateur.

### 6. Modales

Aucune configuration globale n’est nécessaire.

```ts
@Component({
  imports: [GESTIO_DIALOG_IMPORTS, GestioButton],
  template: `
    <gestio-dialog title="Archiver la facture" description="Elle restera consultable.">
      <p>Facture {{ data.numero }}</p>
      <div gestioDialogActions>
        <button gestioButton variant="outline" (click)="ref.close(false)">Annuler</button>
        <button gestioButton (click)="ref.close(true)">Archiver</button>
      </div>
    </gestio-dialog>
  `,
})
class ArchiveDialog {
  ref = inject<GestioDialogRef<boolean>>(GestioDialogRef);
  data = inject<{ numero: string }>(GESTIO_DIALOG_DATA);
}

const ref = this.dialog.open<boolean>(ArchiveDialog, {
  data: { numero: 'F-2024-118' },
  size: 'sm', // 'sm' | 'md' | 'lg'
  closeOnEscape: true,
  closeOnBackdropClick: false,
});
const archived = await ref.afterClosed(); // true | false | undefined

// Confirmation prête à l’emploi
const ok = await this.dialog.confirm({ title: 'Supprimer ?', variant: 'danger' }).afterClosed();
```

### 7. Mises en page responsive

Points de rupture (largeur minimale) : `sm` 640 px, `md` 768 px, `lg` 1024 px, `xl` 1280 px.
Les entrées responsives acceptent une valeur fixe ou un objet par point de rupture (mobile first) :

```html
<gestio-container>
  <gestio-stack [direction]="{ base: 'column', md: 'row' }" justify="between" [gap]="3">
    <h1>Clients</h1>
    <button gestioButton>Nouveau client</button>
  </gestio-stack>

  <gestio-grid [columns]="{ base: 1, sm: 2, lg: 4 }" [gap]="4">
    <gestio-card>…</gestio-card>
    <gestio-card [gestioGridSpan]="{ base: 'full', lg: 2 }">…</gestio-card>
  </gestio-grid>
</gestio-container>
```

- `gestio-grid` et `gestio-stack` réagissent à la largeur **de leur conteneur** (container
  queries) : ils restent corrects dans une carte ou une colonne étroite.
- `gestio-app-shell` (en-tête, barre latérale, `<main>`) réagit à la fenêtre : barre latérale fixe
  à partir de `lg`, tiroir accessible en dessous (focus, Échap, fond, contenu inerte). Le
  showcase l’utilise comme coque.
- `inject(GestioBreakpoints).md()` … pour adapter un comportement en TypeScript (`false` en SSR).

### 8. Datagrid

```ts
columns: GestioDataGridColumn<Invoice>[] = [
  { key: 'number', header: 'Numéro', sortable: true },
  { key: 'amount', header: 'Montant', sortable: true, align: 'end', format: (r) => euros.format(r.amount) },
  { key: 'status', header: 'Statut' },
];
```

```html
<gestio-datagrid
  caption="Factures"
  [columns]="columns"
  [rows]="invoices()"
  filterable
  selectable
  [(selection)]="selection"
>
  <ng-template gestioCell="status" [gestioCellOf]="invoices()" let-row>
    <gestio-badge [variant]="row.paid ? 'success' : 'warning'">…</gestio-badge>
  </ng-template>
</gestio-datagrid>
```

Tri, recherche et pagination sont faits côté client. `columnDividers` (sur `table[gestioTable]`
comme sur `gestio-datagrid`) ajoute des traits verticaux entre les colonnes. Pour une pagination serveur, passer
`[paginated]="false"` et gérer la pagination dans l’application.

## Serveur MCP pour les assistants IA

Le paquet inclut un serveur [MCP](https://modelcontextprotocol.io) sans dépendance
(`mcp/server.mjs`, binaire `gestio-ui-mcp`). Une fois la bibliothèque installée, déclarez-le dans
la configuration MCP du projet (ex. `.mcp.json` pour Claude Code) :

```json
{
  "mcpServers": {
    "gestio-ui": { "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}
```

Outils exposés : `get_setup_guide`, `list_components`, `get_component`, `get_guide`,
`search_docs` et `list_design_tokens`. Le catalogue `mcp/catalog.json` est contrôlé par
`src/lib/mcp-catalog.spec.ts` : un composant exporté ou une entrée absents du catalogue font
échouer les tests. Détails : `projects/gestio-ui/mcp/README.md`.

## Personnaliser les tokens

Chargez vos surcharges **après** `gestio-ui.css` :

```css
:root {
  --gestio-color-primary: #0f766e;
  --gestio-color-primary-hover: #115e59;
  --gestio-color-primary-active: #134e4a;
  --gestio-color-primary-subtle: #f0fdfa;
  --gestio-color-primary-subtle-hover: #ccfbf1;
  --gestio-color-primary-text: #115e59;
  --gestio-color-primary-border: #99f6e4;
  --gestio-color-focus-ring: #14b8a6;
  --gestio-radius-md: 0.5rem;
}

[data-gestio-theme='dark'] {
  --gestio-color-primary: #2dd4bf;
}
```

Familles de tokens : couleurs (`--gestio-color-*`), typographie (`--gestio-font-*`), espacements
(`--gestio-space-*`), hauteurs de contrôles, rayons (`--gestio-radius-*`), ombres
(`--gestio-shadow-*`), animations (`--gestio-duration-*`, `--gestio-easing-*`) et superpositions
(`--gestio-z-*`). Vérifiez le contraste (WCAG AA) de toute couleur personnalisée.

## Ajouter un composant

1. Créer `projects/gestio-ui/src/lib/<nom>/<nom>.ts` (+ `.html`, `.scss`) :
   - sélecteur préfixé `gestio-` (ou attribut `gestio…` sur un élément natif) ;
   - `input()`, `output()`, `model()`, `computed()` ; pas de `standalone: true` ni de
     `changeDetection` explicites (valeurs par défaut d’Angular 22) ;
   - styles basés uniquement sur les tokens `--gestio-*`, encapsulés, avec `:focus-visible`,
     `prefers-reduced-motion` et un rendu correct dans les deux thèmes ;
   - aucun accès direct à `window`, `document` ou `localStorage` (utiliser `DOCUMENT`,
     `isPlatformBrowser`, `afterNextRender`) ;
   - pour un champ de formulaire : `ControlValueAccessor` et `@use '../core/field'`.
2. Exporter le composant et ses types dans `src/public-api.ts`.
3. Ajouter `<nom>.spec.ts` (comportements, clavier, ARIA).
4. Documenter le composant dans `mcp/catalog.json` (entrées, sorties, exemples, pièges) :
   le test du catalogue échoue tant que ce n’est pas fait.
5. Créer la page `projects/showcase/src/app/pages/<nom>/` et l’ajouter à `app.routes.ts` et
   `core/navigation.ts`. Les extraits de code doivent refléter l’API réelle.
6. `npm run build && npm test`.

## Limites connues (v0.1)

- Sélecteur natif uniquement : pas de recherche, de sélection multiple ni de groupes d’options.
- Pas de combobox, date picker, menu déroulant ni infobulle.
- Taille du bundle : la bibliothèque est un seul module ESM ; le code de tous les composants
  utilisés par l’application se retrouve dans le chunk qui importe `@gestiolabs/ui` en premier
  (souvent le chunk initial). Le showcase dépasse ainsi l’avertissement de budget (≈ 515 kB pour
  500 kB). Correctif prévu : points d’entrée secondaires (`@gestiolabs/ui/datagrid`…).
- `gestioGridSpan` supérieur au nombre de colonnes crée des colonnes implicites.
- Datagrid : traitements côté client uniquement ; pas de navigation cellule par cellule (motif
  ARIA grid), d’édition en ligne, de colonnes redimensionnables ni de défilement virtuel.
- Notifications : au-delà de `maxVisible`, les plus anciennes sont retirées (pas de file
  d’attente). Pendant qu’une modale est ouverte, le CDK masque le reste de la page aux
  technologies d’assistance : les toasts restent annoncés (région live du CDK) mais leurs boutons
  ne sont pas atteignables avant la fermeture de la modale.
- Les onglets utilisent l’activation automatique ; les panneaux inactifs restent instanciés
  (masqués par `hidden`).
- Libellés internes en français par défaut (« Fermer », « Afficher le mot de passe »…) ;
  surchargeables par des entrées dédiées, sans système d’i18n intégré.
- Champs compatibles Reactive Forms et `ngModel` ; l’intégration directe avec Signal Forms n’est
  pas encore fournie.
- Le rendu SSR n’est pas configuré dans ce workspace : la compatibilité repose sur l’absence
  d’accès globaux non protégés, pas sur un test SSR exécuté.
