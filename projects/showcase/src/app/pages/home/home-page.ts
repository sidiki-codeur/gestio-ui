import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCard } from '@gestiolabs336/ui/card';
import { GestioTab, GestioTabs } from '@gestiolabs336/ui/tabs';
import { CodeBlock } from '../../shared/code-block';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-home-page',
  imports: [
    RouterLink,
    GestioButton,
    GestioCard,
    GestioBadge,
    GestioTabs,
    GestioTab,
    CodeBlock,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Gestio UI" eyebrow="Version 0.5">
      Une bibliothèque de composants Angular sobre et accessible, pensée pour les tableaux de bord,
      les logiciels de gestion et les interfaces d’administration.
    </sc-page-header>

    <div class="sc-hero-actions">
      <a gestioButton routerLink="/composants/bouton">Parcourir les composants</a>
      <a gestioButton variant="outline" routerLink="/fondations">Voir les fondations</a>
    </div>

    <section class="sc-section" aria-labelledby="home-principes">
      <h2 id="home-principes">Principes</h2>
      <div class="sc-grid">
        @for (feature of features; track feature.title) {
          <gestio-card>
            <div gestioCardHeader>
              <span class="sc-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" focusable="false"><path [attr.d]="feature.icon" /></svg>
              </span>
              <h3 class="sc-card-title">{{ feature.title }}</h3>
            </div>
            <p class="sc-muted" style="margin: 0">{{ feature.text }}</p>
          </gestio-card>
        }
      </div>
    </section>

    <section class="sc-section" aria-labelledby="home-install">
      <h2 id="home-install">Mise en place</h2>
      <gestio-tabs ariaLabel="Mode d’installation" [(selectedIndex)]="installTab">
        <gestio-tab label="Installation manuelle">
          <p>
            Paquet npm <code>@gestiolabs336/ui</code> (Angular 22). Installez-le avec le CDK,
            importez le thème, puis chaque composant là où il est utilisé.
          </p>
          <div class="sc-stack">
            <sc-code-block language="bash" [code]="buildCode" />
            <sc-code-block language="json" [code]="stylesCode" />
            <sc-code-block language="typescript" [code]="importCode" />
          </div>
        </gestio-tab>

        <gestio-tab label="Avec un assistant IA">
          <p>
            Copiez ce prompt dans Claude Code, Codex, Gemini CLI, Cursor ou Copilot, ouvert à la
            racine de votre projet Angular. Remplacez la dernière ligne par ce que vous voulez
            construire.
          </p>
          <sc-code-block language="prompt" [code]="aiPrompt" wrap />

          <h3>Brancher le serveur MCP</h3>
          <p>
            La bibliothèque embarque un serveur MCP qui fournit à l’assistant la documentation
            exacte de la version installée. Le prompt lui demande de l’ajouter ; vous pouvez aussi
            le déclarer vous-même, une fois le paquet installé.
          </p>
          <gestio-tabs variant="pills" ariaLabel="Assistant IA">
            @for (agent of mcpConfigs; track agent.name) {
              <gestio-tab [label]="agent.name">
                <p class="sc-muted">{{ agent.where }}</p>
                <sc-code-block [language]="agent.language" [code]="agent.code" />
              </gestio-tab>
            }
          </gestio-tabs>
          <div class="sc-note" role="note">
            <strong>Windows</strong>
            <p>
              Si l’assistant ne parvient pas à lancer <code>npx</code>, remplacez la commande par
              <code>cmd</code> et les arguments par <code>["/c", "npx", "gestio-ui-mcp"]</code>, ou
              utilisez <code>node node_modules/@gestiolabs336/ui/mcp/server.mjs</code>.
            </p>
          </div>
        </gestio-tab>
      </gestio-tabs>
    </section>

    <section class="sc-section" aria-labelledby="home-contenu">
      <h2 id="home-contenu">Contenu de la version 0.5</h2>
      <div class="sc-row">
        @for (name of components; track name) {
          <gestio-badge variant="primary">{{ name }}</gestio-badge>
        }
      </div>
      <div class="sc-note sc-note--warning" role="note">
        <strong>Limites</strong>
        <p>
          Pas encore de sous-menus ni d’édition en ligne dans la datagrid (traitements côté client
          uniquement). Les libellés internes (fermer, afficher le mot de passe…) sont en français
          par défaut et se surchargent par des entrées dédiées.
        </p>
      </div>
    </section>
  `,
})
export class HomePage {
  protected readonly features = [
    {
      title: 'Accessible par défaut',
      text: 'Éléments natifs, rôles ARIA, focus visible, navigation clavier et annonces aux lecteurs d’écran.',
      icon: 'M10 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM4 8h12M10 8v5m0 0l-3 4.5M10 13l3 4.5',
    },
    {
      title: 'Thèmes par tokens',
      text: 'Variables CSS --gestio-* : clair, sombre et surcharge de la couleur principale sans recompiler.',
      icon: 'M10 2.5a7.5 7.5 0 1 0 0 15c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.5-1-2.5S11 12 12 12h2a3.5 3.5 0 0 0 3.5-3.5C17.5 5 14 2.5 10 2.5z',
    },
    {
      title: 'Prête pour les formulaires',
      text: 'Champs compatibles Reactive Forms, ngModel et Signal Forms ([formField]), types de valeurs préservés.',
      icon: 'M4 3.5h12v13H4zM7 7.5h6M7 10.5h6M7 13.5h3',
    },
    {
      title: 'Compatible SSR',
      text: 'Aucun accès non protégé à window, document ou localStorage ; minuteurs créés côté navigateur.',
      icon: 'M3 4.5h14v4H3zM3 11.5h14v4H3zM6 6.5h.01M6 13.5h.01',
    },
  ];

  protected readonly components = [
    'Bouton',
    'Champ de saisie',
    'Zone de texte',
    'Champ de formulaire',
    'Case à cocher',
    'Boutons radio',
    'Interrupteur',
    'Sélecteur',
    'Carte',
    'Badge',
    'Alerte',
    'Tableau',
    'Datagrid',
    'Pagination',
    'Modale',
    'Menu déroulant',
    'Notifications',
    'Info-bulle',
    'Skeleton et spinner',
    'Onglets',
    'Accordéon',
    'Fil d’Ariane',
    'Avatar',
    'Progression',
    'Curseur',
    'Contrôle segmenté',
    'Assistant en étapes',
    'Dépôt de fichiers',
    'Puces',
    'Liste avec recherche',
    'Sélecteur de date',
    'Fenêtre surgissante',
    'Panneau latéral',
    'Mises en page',
    'Onde de pression (ripple)',
    'Blocs : authentification, calendrier, e-commerce, tableau de bord, graphiques, kanban, palette de commandes, notifications, pages d’erreur',
    'Style Material 3',
  ];

  protected readonly installTab = signal(0);

  protected readonly buildCode = `npm install @gestiolabs336/ui @angular/cdk`;

  protected readonly aiPrompt = `Intègre la bibliothèque Angular @gestiolabs336/ui (Gestio UI) dans ce projet.

Contexte : Gestio UI cible Angular 22.2+ (composants standalone, signaux, OnPush, zoneless). Chaque composant a son propre point d'entrée (@gestiolabs336/ui/button, @gestiolabs336/ui/blocks/login-form…). Documentation : https://sidiki-codeur.github.io/gestio-ui/

Étapes :
1. Vérifie dans package.json que le projet utilise Angular 22.2 ou plus. Sinon, arrête-toi et signale-le.
2. Installe les paquets : npm install @gestiolabs336/ui @angular/cdk
3. Ajoute à ta configuration le serveur MCP fourni par la bibliothèque (commande : npx gestio-ui-mcp, transport stdio). Utilise ses outils comme seule source de vérité : get_setup_guide d'abord, puis list_components, get_component, search_docs et list_design_tokens. N'invente aucun sélecteur, entrée ou sortie. Si tu ne peux pas ajouter de serveur MCP, lis node_modules/@gestiolabs336/ui/mcp/catalog.json.
4. Thème : dans angular.json (projects > <app> > architect > build > options > styles), ajoute "node_modules/@gestiolabs336/ui/styles/gestio-ui.css" AVANT les styles de l'application. Thème sombre : data-gestio-theme="dark" ou "system" sur <html>. Style Material 3 (seulement si je le demande) : ajoute aussi styles/gestio-material.css juste après et data-gestio-design="material" sur <html>.
5. Importe chaque composant depuis son point d'entrée, dans le tableau imports du composant standalone qui l'utilise. N'importe jamais '@gestiolabs336/ui' entier.
6. Notifications : un seul <gestio-toaster /> dans le composant racine. Modales : injecte GestioDialogService.
7. Règles : formulaires avec Reactive Forms ou Signal Forms ([formField]) ; libellé accessible sur chaque champ et bouton icône (label, ariaLabel) ; aucune couleur ni espacement en dur, utilise les variables CSS --gestio-* ; préfère les blocs existants (login-form, page-header, stat-card, empty-state…) avant de recréer un écran.
8. Vérifie : ng build sans erreur ni avertissement, tests existants au vert. Termine par la liste des fichiers modifiés.

Ma demande : [décris ici l'écran ou la fonctionnalité à construire avec Gestio UI]`;

  protected readonly mcpConfigs = [
    {
      name: 'Claude Code',
      where:
        'Commande à lancer à la racine du projet (ou fichier .mcp.json, même format que Cursor).',
      language: 'bash',
      code: `claude mcp add gestio-ui -- npx gestio-ui-mcp`,
    },
    {
      name: 'Codex',
      where: 'Fichier ~/.codex/config.toml.',
      language: 'toml',
      code: `[mcp_servers.gestio-ui]
command = "npx"
args = ["gestio-ui-mcp"]`,
    },
    {
      name: 'Gemini CLI',
      where: 'Fichier .gemini/settings.json à la racine du projet.',
      language: 'json',
      code: `{
  "mcpServers": {
    "gestio-ui": { "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}`,
    },
    {
      name: 'Cursor',
      where: 'Fichier .cursor/mcp.json à la racine du projet.',
      language: 'json',
      code: `{
  "mcpServers": {
    "gestio-ui": { "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}`,
    },
    {
      name: 'VS Code / Copilot',
      where: 'Fichier .vscode/mcp.json à la racine du projet.',
      language: 'json',
      code: `{
  "servers": {
    "gestio-ui": { "type": "stdio", "command": "npx", "args": ["gestio-ui-mcp"] }
  }
}`,
    },
  ];

  protected readonly stylesCode = `// angular.json de l'application hôte
"styles": [
  "node_modules/@gestiolabs336/ui/styles/gestio-ui.css",
  "src/styles.css"
]`;

  protected readonly importCode = `import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioInput } from '@gestiolabs336/ui/input';

@Component({
  imports: [GestioButton, GestioInput],
  template: \`<button gestioButton>Enregistrer</button>\`,
})
export class MonComposant {}`;
}
