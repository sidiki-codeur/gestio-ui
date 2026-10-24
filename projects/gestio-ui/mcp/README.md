# Serveur MCP de @gestiolabs/ui

Ce serveur [Model Context Protocol](https://modelcontextprotocol.io) donne aux assistants IA
(Claude Code, Cursor, VS Code / Copilot, Windsurf…) la documentation exacte de la version de
`@gestiolabs/ui` installée dans le projet : composants, entrées, exemples, pièges, guides et design
tokens. L'assistant n'a donc pas à deviner l'API.

Il est livré avec la bibliothèque : aucune installation supplémentaire et aucune dépendance.
Il fonctionne hors ligne (transport stdio) et n'accède qu'aux fichiers du paquet.

## Configuration

Une fois `@gestiolabs/ui` installé dans le projet, la commande `npx gestio-ui-mcp` lance le serveur.

**Claude Code** : `.mcp.json` à la racine du projet (ou `claude mcp add gestio-ui -- npx gestio-ui-mcp`) :

```json
{
  "mcpServers": {
    "gestio-ui": { "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}
```

**VS Code** (`.vscode/mcp.json`) :

```json
{
  "servers": {
    "gestio-ui": { "type": "stdio", "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}
```

**Cursor** (`.cursor/mcp.json`) : même format que Claude Code.

Sans `npx` : `node node_modules/@gestiolabs/ui/mcp/server.mjs`.

## Outils exposés

| Outil                | Rôle                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `get_setup_guide`    | Installation, thème, formulaires, accessibilité, limites             |
| `list_components`    | Composants et services avec sélecteur et résumé                      |
| `get_component`      | Documentation complète d'un composant (`button`, `GestioSelect`…)    |
| `get_guide`          | Guide thématique : setup, theming, forms, accessibility, ssr, limits |
| `search_docs`        | Recherche plein texte                                                |
| `list_design_tokens` | Tokens `--gestio-*` lus dans le thème installé (clair et sombre)     |

Chaque composant et guide est aussi disponible comme ressource :
`gestio-ui://components/<id>` et `gestio-ui://guides/<id>`.

## Fiabilité

- Le catalogue (`catalog.json`) est vérifié par un test de la bibliothèque : chaque composant
  exporté doit y figurer, avec exactement ses entrées et sorties réelles.
- Les design tokens sont lus directement dans `styles/gestio-ui.css`.
- Les besoins non couverts sont listés dans le guide `limits`, pour éviter qu'un assistant
  invente une API.
