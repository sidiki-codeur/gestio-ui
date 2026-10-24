import { Component } from '@angular/core';
import { CodeBlock } from '../../shared/code-block';
import { PageHeader } from '../../shared/page-header';

interface Swatch {
  readonly name: string;
  readonly token: string;
}

@Component({
  selector: 'sc-foundations-page',
  imports: [CodeBlock, PageHeader],
  template: `
    <sc-page-header heading="Fondations" eyebrow="Design tokens">
      Toutes les valeurs visuelles sont exposées sous forme de variables CSS préfixées
      <code>--gestio-</code>. Elles s’adaptent au thème actif et peuvent être surchargées par
      l’application hôte.
    </sc-page-header>

    <section class="sc-section" aria-labelledby="f-couleurs">
      <h2 id="f-couleurs">Couleurs</h2>
      <p>Couleur principale indigo, couleurs sémantiques et neutres légèrement teintés.</p>
      @for (group of colorGroups; track group.title) {
        <h3>{{ group.title }}</h3>
        <div class="sc-grid">
          @for (swatch of group.swatches; track swatch.token) {
            <div class="sc-swatch">
              <div class="sc-swatch__color" [style.background]="'var(' + swatch.token + ')'"></div>
              <div class="sc-swatch__body">
                <strong>{{ swatch.name }}</strong>
                <code>{{ swatch.token }}</code>
              </div>
            </div>
          }
        </div>
      }
    </section>

    <section class="sc-section" aria-labelledby="f-typo">
      <h2 id="f-typo">Typographie</h2>
      <p>
        Pile de polices système (<code>--gestio-font-sans</code>) : aucun téléchargement, rendu
        natif sur chaque plateforme.
      </p>
      <div class="sc-example" style="padding: var(--gestio-space-5)">
        @for (size of fontSizes; track size.token) {
          <div class="sc-token-demo">
            <code>{{ size.token }}</code>
            <p class="sc-type-sample" [style.font-size]="'var(' + size.token + ')'">
              Facture n° 2024-118 — 1 250,00 €
            </p>
          </div>
        }
      </div>
    </section>

    <section class="sc-section" aria-labelledby="f-espacements">
      <h2 id="f-espacements">Espacements</h2>
      <p>Échelle sur une base de 4 px.</p>
      <div class="sc-example" style="padding: var(--gestio-space-5)">
        @for (space of spaces; track space) {
          <div class="sc-token-demo">
            <code>--gestio-space-{{ space }}</code>
            <div class="sc-space-bar" [style.width]="'var(--gestio-space-' + space + ')'"></div>
          </div>
        }
      </div>
    </section>

    <section class="sc-section" aria-labelledby="f-rayons">
      <h2 id="f-rayons">Rayons et ombres</h2>
      <div class="sc-grid">
        @for (radius of radii; track radius) {
          <div class="sc-radius-box" [style.border-radius]="'var(--gestio-radius-' + radius + ')'">
            <code>--gestio-radius-{{ radius }}</code>
          </div>
        }
      </div>
      <div class="sc-grid" style="margin-top: var(--gestio-space-6)">
        @for (shadow of shadows; track shadow) {
          <div class="sc-shadow-box" [style.box-shadow]="'var(--gestio-shadow-' + shadow + ')'">
            <code>--gestio-shadow-{{ shadow }}</code>
          </div>
        }
      </div>
    </section>

    <section class="sc-section" aria-labelledby="f-autres">
      <h2 id="f-autres">Animations et superpositions</h2>
      <p>
        Les durées passent à 1 ms lorsque <code>prefers-reduced-motion: reduce</code> est actif. Les
        niveaux de superposition ordonnent en-têtes collants, modales et notifications.
      </p>
      <sc-code-block language="css" [code]="motionCode" />
    </section>

    <section class="sc-section" aria-labelledby="f-theme">
      <h2 id="f-theme">Thèmes et personnalisation</h2>
      <p>
        Le thème clair s’applique par défaut. Placez <code>data-gestio-theme="dark"</code> sur
        l’élément <code>&lt;html&gt;</code> pour le thème sombre (les modales, rendues dans
        <code>&lt;body&gt;</code>, en héritent), ou <code>"system"</code> pour suivre le système.
      </p>
      <sc-code-block language="css" [code]="overrideCode" />
    </section>
  `,
})
export class FoundationsPage {
  protected readonly colorGroups: { title: string; swatches: Swatch[] }[] = [
    {
      title: 'Principale',
      swatches: [
        { name: 'Principale', token: '--gestio-color-primary' },
        { name: 'Survol', token: '--gestio-color-primary-hover' },
        { name: 'Fond atténué', token: '--gestio-color-primary-subtle' },
        { name: 'Texte principal', token: '--gestio-color-primary-text' },
      ],
    },
    {
      title: 'Sémantiques',
      swatches: [
        { name: 'Succès', token: '--gestio-color-success' },
        { name: 'Avertissement', token: '--gestio-color-warning' },
        { name: 'Danger', token: '--gestio-color-danger' },
        { name: 'Information', token: '--gestio-color-info' },
      ],
    },
    {
      title: 'Surfaces, textes et bordures',
      swatches: [
        { name: 'Arrière-plan', token: '--gestio-color-background' },
        { name: 'Surface', token: '--gestio-color-surface' },
        { name: 'Surface atténuée', token: '--gestio-color-surface-muted' },
        { name: 'Texte', token: '--gestio-color-text' },
        { name: 'Texte secondaire', token: '--gestio-color-text-muted' },
        { name: 'Bordure', token: '--gestio-color-border' },
        { name: 'Bordure marquée', token: '--gestio-color-border-strong' },
        { name: 'Anneau de focus', token: '--gestio-color-focus-ring' },
      ],
    },
  ];

  protected readonly fontSizes = [
    { token: '--gestio-font-size-xs' },
    { token: '--gestio-font-size-sm' },
    { token: '--gestio-font-size-md' },
    { token: '--gestio-font-size-lg' },
    { token: '--gestio-font-size-xl' },
    { token: '--gestio-font-size-2xl' },
    { token: '--gestio-font-size-3xl' },
  ];

  protected readonly spaces = [1, 2, 3, 4, 5, 6, 8, 10, 12];
  protected readonly radii = ['sm', 'md', 'lg', 'xl', 'full'];
  protected readonly shadows = ['xs', 'sm', 'md', 'lg'];

  protected readonly motionCode = `--gestio-duration-fast: 120ms;
--gestio-duration-normal: 180ms;
--gestio-duration-slow: 260ms;
--gestio-easing-standard: cubic-bezier(0.2, 0, 0, 1);

--gestio-z-dropdown: 1000;
--gestio-z-sticky: 1100;
--gestio-z-overlay: 1200;
--gestio-z-modal: 1300;
--gestio-z-toast: 1400;`;

  protected readonly overrideCode = `/* styles.css de l'application, chargé après gestio-ui.css */
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

/* Surcharge spécifique au thème sombre */
[data-gestio-theme='dark'] {
  --gestio-color-primary: #2dd4bf;
}`;
}
