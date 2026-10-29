# @gestiolabs336/ui

Composants Angular 22 sobres et accessibles pour les tableaux de bord, logiciels de gestion et
interfaces d’administration.

**Documentation et exemples interactifs : https://sidiki-codeur.github.io/gestio-ui/**

- Composants standalone, signaux, compatibles zoneless et SSR
- Thème par design tokens CSS `--gestio-*`, modes clair, sombre et système
- Accessibilité : éléments natifs, ARIA, navigation clavier, focus visible, `prefers-reduced-motion`
- Serveur MCP inclus : les assistants IA connaissent l’API exacte de la version installée

## Installation

```bash
npm install @gestiolabs336/ui @angular/cdk
```

Dépendances pairs : `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (^22.2).

Importez le thème dans `angular.json`, avant vos propres styles :

```json
"styles": ["node_modules/@gestiolabs336/ui/styles/gestio-ui.css", "src/styles.css"]
```

Thème sombre : `<html data-gestio-theme="dark">` (ou `"system"` pour suivre le système).

## Utilisation

Chaque composant a son propre point d’entrée : importez-le depuis là où il est utilisé, seul son
code est alors chargé avec la route concernée.

```ts
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioInput } from '@gestiolabs336/ui/input';

@Component({
  imports: [ReactiveFormsModule, GestioButton, GestioInput],
  template: `
    <gestio-input label="E-mail" type="email" formControlName="email" required />
    <button gestioButton type="submit">Enregistrer</button>
  `,
})
export class ContactForm {}
```

`@gestiolabs336/ui` réexporte tout (compatibilité 0.1), mais charge alors l’ensemble de la
bibliothèque dès la première route.

Les champs fonctionnent avec Reactive Forms, `ngModel` et Signal Forms (`[formField]`).

## Composants

| Point d’entrée                       | Composants                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `/button`                            | `button[gestioButton]`, `a[gestioButton]`                                                     |
| `/input`, `/textarea`, `/select`     | `gestio-input`, `gestio-textarea`, `gestio-select`                                            |
| `/checkbox`, `/radio`, `/switch`     | `gestio-checkbox`, `gestio-radio-group` + `gestio-radio`, `gestio-switch`                     |
| `/form-field`                        | `gestio-form-field` + `[gestioFieldControl]` (contrôles natifs : date, heure…)                |
| `/card`, `/badge`, `/tabs`           | `gestio-card`, `gestio-badge`, `gestio-tabs`                                                  |
| `/table`, `/datagrid`, `/pagination` | `table[gestioTable]`, `gestio-datagrid`, `gestio-pagination`                                  |
| `/menu`                              | `[gestioMenuTriggerFor]`, `gestio-menu`, `[gestioMenuItem]`                                   |
| `/tooltip`                           | `[gestioTooltip]`                                                                             |
| `/alert`, `/skeleton`, `/spinner`    | `gestio-alert`, `gestio-skeleton`, `gestio-spinner`                                           |
| `/dialog`, `/toast`                  | `GestioDialogService`, `GestioToastService` + `gestio-toaster`                                |
| `/layout`                            | `gestio-app-shell`, `gestio-container`, `gestio-stack`, `gestio-grid`, `GestioBreakpoints`    |
| `/accordion`, `/breadcrumb`          | `gestio-accordion` + `gestio-accordion-item`, `gestio-breadcrumb` + `gestio-breadcrumb-entry` |
| `/avatar`, `/chips`                  | `gestio-avatar`, `gestio-avatar-group`, `gestio-chip`, `gestio-chip-input`                    |
| `/combobox`, `/date-picker`          | `gestio-combobox` (recherche, sélection multiple), `gestio-date-picker`                       |
| `/slider`, `/segmented-control`      | `gestio-slider` (valeur ou plage), `gestio-segmented-control` + `gestio-segment`              |
| `/progress`, `/stepper`              | `gestio-progress-bar`, `gestio-progress-circle`, `gestio-stepper` + `gestio-step`             |
| `/file-upload`, `/popover`           | `gestio-file-upload`, `[gestioPopoverTrigger]`                                                |
| `/drawer`, `/ripple`                 | `gestio-drawer`, `GestioDrawerService`, `[gestioRipple]`                                      |

## Blocs

Composants de plus haut niveau, chacun dans son point d’entrée `@gestiolabs336/ui/blocks/<bloc>`.

| Point d’entrée                                                              | Composants                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/blocks/login-form`, `/blocks/signup-form`, `/blocks/forgot-password-form` | `gestio-login-form`, `gestio-signup-form`, `gestio-forgot-password-form`             |
| `/blocks/social-button`, `/blocks/otp-input`                                | `button[gestioSocialButton]` (Google, GitHub, Microsoft, Apple), `gestio-otp-input`  |
| `/blocks/calendar`, `/blocks/event-calendar`                                | `gestio-calendar` (date ou plage), `gestio-event-calendar` (agenda mensuel)          |
| `/blocks/carousel`, `/blocks/product-card`                                  | `gestio-carousel` + `gestio-carousel-slide`, `gestio-product-card`                   |
| `/blocks/rating`, `/blocks/quantity-input`                                  | `gestio-rating`, `gestio-review`, `gestio-quantity-input`                            |
| `/blocks/cart-summary`, `/blocks/pricing-table`                             | `gestio-cart-summary`, `gestio-pricing-table` + `gestio-pricing-plan`                |
| `/blocks/stat-card`, `/blocks/activity-feed`                                | `gestio-stat-card`, `gestio-activity-feed`                                           |
| `/blocks/empty-state`, `/blocks/page-header`                                | `gestio-empty-state`, `gestio-page-header`                                           |
| `/blocks/chart`                                                             | `gestio-bar-chart`, `gestio-line-chart`, `gestio-donut-chart` (SVG, sans dépendance) |
| `/blocks/kanban`                                                            | `gestio-kanban` + `ng-template[gestioKanbanCard]`                                    |
| `/blocks/command-palette`, `/blocks/notification-center`                    | `gestio-command-palette` (Ctrl+K), `gestio-notification-center`                      |
| `/blocks/error-page`                                                        | `gestio-error-page` (404, 403, 500, maintenance, hors ligne)                         |

## Personnalisation

Surchargez les tokens dans une feuille chargée après le thème :

```css
:root {
  --gestio-color-primary: #0f766e;
  --gestio-color-primary-hover: #115e59;
  --gestio-radius-md: 0.5rem;
}
```

### Style Material 3

Chargez `styles/gestio-material.css` **après** `gestio-ui.css`, puis posez `data-gestio-design="material"` sur `<html>`. Il fonctionne avec les thèmes clair, sombre et système.

```json
"styles": [
  "node_modules/@gestiolabs336/ui/styles/gestio-ui.css",
  "node_modules/@gestiolabs336/ui/styles/gestio-material.css",
  "src/styles.css"
]
```

```html
<html data-gestio-design="material" data-gestio-theme="system"></html>
```

La feuille ne redéfinit que des tokens : couleurs de Material 3 (schéma de référence #6750A4), survol et pression en surimpression, formes (boutons en pilule, modales arrondies à 28 px), élévations, police Roboto et animations. Aucune dépendance à Angular Material. Roboto n’est pas fournie : ajoutez-la à l’application (Google Fonts ou `@fontsource/roboto`).

Pour changer la couleur source, surchargez la famille `--gestio-color-primary-*` dans un sélecteur `[data-gestio-design="material"]` chargé ensuite.

Les boutons, boutons sociaux et éléments de menu affichent alors une onde de pression (directive `gestioRipple`, point d’entrée `@gestiolabs336/ui/ripple`, applicable à tout élément positionné).

Tokens de composants (avec repli sur l’échelle de rayons) : `--gestio-button-radius`, `--gestio-button-press-offset`, `--gestio-field-radius`, `--gestio-dialog-radius`, `--gestio-drawer-radius`, `--gestio-popover-radius`, `--gestio-chip-radius`, `--gestio-segmented-control-radius`, `--gestio-file-upload-radius`, `--gestio-kanban-card-radius`, `--gestio-notification-center-radius`… Les graphiques utilisent la palette `--gestio-chart-1` à `--gestio-chart-8` (contraste ≥ 3:1 dans chaque thème).

## Serveur MCP pour les assistants IA

Déclarez-le dans la configuration MCP du projet (ex. `.mcp.json` pour Claude Code) :

```json
{
  "mcpServers": {
    "gestio-ui": { "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}
```

Outils : `get_setup_guide`, `list_components`, `get_component`, `get_guide`, `search_docs`,
`list_design_tokens`. Détails dans `mcp/README.md`.

## Limites de la version 0.x

L’API peut encore évoluer. Pas encore de sous-menus ni de groupes d’options ; la datagrid travaille côté
client (pour une pagination serveur, combinez `table[gestioTable]` et `gestio-pagination`).

## Licence

MIT
