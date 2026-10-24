import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GestioBadge, GestioButton, GestioCard } from '@gestiolabs336/ui';
import { CodeBlock } from '../../shared/code-block';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-home-page',
  imports: [RouterLink, GestioButton, GestioCard, GestioBadge, CodeBlock, PageHeader],
  template: `
    <sc-page-header heading="Gestio UI" eyebrow="Version 0.1 — première version">
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
      <p>
        Dans ce workspace, la bibliothèque est compilée dans <code>dist/gestio-ui</code> et
        consommée par le showcase via l’alias TypeScript <code>@gestiolabs336/ui</code>.
      </p>
      <div class="sc-stack">
        <sc-code-block language="bash" [code]="buildCode" />
        <sc-code-block language="json" [code]="stylesCode" />
        <sc-code-block language="typescript" [code]="importCode" />
      </div>
    </section>

    <section class="sc-section" aria-labelledby="home-contenu">
      <h2 id="home-contenu">Contenu de la version 0.1</h2>
      <div class="sc-row">
        @for (name of components; track name) {
          <gestio-badge variant="primary">{{ name }}</gestio-badge>
        }
      </div>
      <div class="sc-note sc-note--warning" role="note">
        <strong>Limites</strong>
        <p>
          Pas encore de combobox avec recherche, de sélection multiple, de date picker ni d’édition
          en ligne dans la datagrid (traitements côté client uniquement). Les libellés internes
          (fermer, afficher le mot de passe…) sont en français par défaut et se surchargent par des
          entrées dédiées.
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
      text: 'Champs compatibles Reactive Forms (ControlValueAccessor), types de valeurs préservés.',
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
    'Case à cocher',
    'Sélecteur',
    'Carte',
    'Badge',
    'Tableau',
    'Datagrid',
    'Modale',
    'Notifications',
    'Onglets',
    'Mises en page',
  ];

  protected readonly buildCode = `# Compiler la bibliothèque (à relancer après chaque modification, ou en mode watch)
npm run build:lib

# Démarrer le showcase
npm start`;

  protected readonly stylesCode = `// angular.json de l'application hôte
"styles": [
  "node_modules/@gestiolabs336/ui/styles/gestio-ui.css",
  "src/styles.css"
]`;

  protected readonly importCode = `import { GestioButton, GestioInput } from '@gestiolabs336/ui';

@Component({
  imports: [GestioButton, GestioInput],
  template: \`<button gestioButton>Enregistrer</button>\`,
})
export class MonComposant {}`;
}
