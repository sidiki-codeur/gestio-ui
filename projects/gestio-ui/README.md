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

| Point d’entrée                       | Composants                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `/button`                            | `button[gestioButton]`, `a[gestioButton]`                                                  |
| `/input`, `/textarea`, `/select`     | `gestio-input`, `gestio-textarea`, `gestio-select`                                         |
| `/checkbox`, `/radio`, `/switch`     | `gestio-checkbox`, `gestio-radio-group` + `gestio-radio`, `gestio-switch`                  |
| `/form-field`                        | `gestio-form-field` + `[gestioFieldControl]` (contrôles natifs : date, heure…)             |
| `/card`, `/badge`, `/tabs`           | `gestio-card`, `gestio-badge`, `gestio-tabs`                                               |
| `/table`, `/datagrid`, `/pagination` | `table[gestioTable]`, `gestio-datagrid`, `gestio-pagination`                               |
| `/menu`                              | `[gestioMenuTriggerFor]`, `gestio-menu`, `[gestioMenuItem]`                                |
| `/tooltip`                           | `[gestioTooltip]`                                                                          |
| `/alert`, `/skeleton`, `/spinner`    | `gestio-alert`, `gestio-skeleton`, `gestio-spinner`                                        |
| `/dialog`, `/toast`                  | `GestioDialogService`, `GestioToastService` + `gestio-toaster`                             |
| `/layout`                            | `gestio-app-shell`, `gestio-container`, `gestio-stack`, `gestio-grid`, `GestioBreakpoints` |

## Personnalisation

Surchargez les tokens dans une feuille chargée après le thème :

```css
:root {
  --gestio-color-primary: #0f766e;
  --gestio-color-primary-hover: #115e59;
  --gestio-radius-md: 0.5rem;
}
```

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

L’API peut encore évoluer. Pas encore de combobox, date picker dédié (utilisez
`<input type="date">` dans `gestio-form-field`), sous-menus ni popover ; la datagrid travaille côté
client (pour une pagination serveur, combinez `table[gestioTable]` et `gestio-pagination`).

## Licence

MIT
