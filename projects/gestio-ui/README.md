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

```ts
import { GestioButton, GestioInput } from '@gestiolabs336/ui';

@Component({
  imports: [ReactiveFormsModule, GestioButton, GestioInput],
  template: `
    <gestio-input label="E-mail" type="email" formControlName="email" required />
    <button gestioButton type="submit">Enregistrer</button>
  `,
})
export class ContactForm {}
```

## Composants

| Catégorie    | Composants                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------ |
| Actions      | `button[gestioButton]`, `a[gestioButton]`                                                  |
| Formulaires  | `gestio-input`, `gestio-textarea`, `gestio-checkbox`, `gestio-select` (Reactive Forms)     |
| Affichage    | `gestio-card`, `gestio-badge`, `gestio-tabs`                                               |
| Données      | `table[gestioTable]`, `gestio-datagrid` (tri, recherche, pagination, sélection)            |
| Mise en page | `gestio-app-shell`, `gestio-container`, `gestio-stack`, `gestio-grid`, `GestioBreakpoints` |
| Retours      | `GestioDialogService` (modales), `GestioToastService` + `gestio-toaster`                   |

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

L’API peut encore évoluer. Pas encore de combobox, date picker, menu déroulant ni info-bulle ; la
datagrid travaille côté client. La bibliothèque est livrée en un seul module : tous les composants
utilisés se retrouvent dans le même chunk de l’application.

## Licence

MIT
