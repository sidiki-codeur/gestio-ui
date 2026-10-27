import { Component, signal } from '@angular/core';
import { GestioCarousel, GestioCarouselSlide } from '@gestiolabs336/ui/blocks/carousel';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

interface Announcement {
  readonly title: string;
  readonly text: string;
  readonly tone: 'primary' | 'success' | 'warning';
}

@Component({
  selector: 'sc-carousel-page',
  imports: [GestioCarousel, GestioCarouselSlide, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Carrousel" eyebrow="Blocs">
      <code>gestio-carousel</code> suit le motif ARIA « Carousel » : boutons précédent / suivant,
      indicateurs, flèches <kbd>←</kbd> <kbd>→</kbd> et glissement tactile. Seule la diapositive
      active est atteignable au clavier et lue par les lecteurs d’écran.
    </sc-page-header>

    <sc-example heading="Annonces" [code]="basicCode" stacked>
      <gestio-carousel ariaLabel="Annonces produit" [(index)]="index">
        @for (item of announcements; track item.title) {
          <gestio-carousel-slide [label]="item.title">
            <div class="sc-slide" [class]="'sc-slide--' + item.tone">
              <h3 class="sc-slide__title">{{ item.title }}</h3>
              <p class="sc-slide__text">{{ item.text }}</p>
              <a gestioButton variant="outline" size="sm" href="#annonces">En savoir plus</a>
            </div>
          </gestio-carousel-slide>
        }
      </gestio-carousel>
      <p class="sc-result" aria-live="polite">
        index : <strong>{{ index() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Défilement automatique en boucle"
      description="Un bouton pause est toujours proposé ; le défilement s’arrête au survol et au focus."
      [code]="autoplayCode"
      stacked
    >
      <gestio-carousel ariaLabel="Témoignages clients" autoplay loop [interval]="4000">
        @for (quote of quotes; track quote.author) {
          <gestio-carousel-slide [label]="quote.author">
            <figure class="sc-slide sc-slide--neutral">
              <blockquote class="sc-slide__text">« {{ quote.text }} »</blockquote>
              <figcaption class="sc-muted">— {{ quote.author }}</figcaption>
            </figure>
          </gestio-carousel-slide>
        }
      </gestio-carousel>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-carousel et gestio-carousel-slide" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Si l’utilisateur a demandé à réduire les animations, le défilement automatique ne démarre
          pas (il reste possible de le lancer avec le bouton) et les transitions sont coupées.
          Méthodes publiques : <code>previous()</code>, <code>next()</code>,
          <code>goTo(index)</code>.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-slide {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--gestio-space-3);
      min-height: 12rem;
      margin: 0;
      padding: var(--gestio-space-8) var(--gestio-space-12);
      box-sizing: border-box;
      background: var(--gestio-color-surface-muted);
      color: var(--gestio-color-text);
    }
    .sc-slide--primary {
      background: var(--gestio-color-primary-subtle);
    }
    .sc-slide--success {
      background: var(--gestio-color-success-subtle);
    }
    .sc-slide--warning {
      background: var(--gestio-color-warning-subtle);
    }
    .sc-slide__title {
      margin: 0;
      font-size: var(--gestio-font-size-xl);
    }
    .sc-slide__text {
      margin: 0;
      max-width: 40rem;
      font-size: var(--gestio-font-size-lg);
      line-height: var(--gestio-line-height-normal);
    }
  `,
})
export class CarouselPage {
  protected readonly index = signal(0);

  protected readonly announcements: Announcement[] = [
    {
      title: 'Relances automatiques',
      text: 'Programmez des relances par e-mail avant chaque échéance de facture.',
      tone: 'primary',
    },
    {
      title: 'Export comptable FEC',
      text: 'Générez le fichier des écritures comptables en un clic depuis le tableau de bord.',
      tone: 'success',
    },
    {
      title: 'Maintenance le 2 novembre',
      text: 'Le service sera indisponible de 2 h à 4 h. Aucune donnée ne sera perdue.',
      tone: 'warning',
    },
  ];

  protected readonly quotes = [
    { author: 'Claire Moreau, Atelier Moreau', text: 'Nous facturons deux fois plus vite.' },
    {
      author: 'Julien Bernard, Bernard BTP',
      text: 'Les devis se transforment en factures sans ressaisie.',
    },
    { author: 'Inès Haddad, Studio Lumen', text: 'Le suivi des paiements est enfin clair.' },
  ];

  protected readonly basicCode = `<gestio-carousel ariaLabel="Annonces produit" [(index)]="index">
  @for (item of announcements; track item.title) {
    <gestio-carousel-slide [label]="item.title">…</gestio-carousel-slide>
  }
</gestio-carousel>`;

  protected readonly autoplayCode = `<gestio-carousel ariaLabel="Témoignages clients" autoplay loop [interval]="4000">
  <gestio-carousel-slide label="Claire Moreau">…</gestio-carousel-slide>
  …
</gestio-carousel>`;

  protected readonly api: ApiRow[] = [
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible du carrousel (à fournir).' },
    {
      name: 'index',
      type: 'model<number>',
      default: '0',
      description: 'Diapositive active ; [(index)].',
    },
    { name: 'loop', type: 'boolean', default: 'false', description: 'Boucle au début / à la fin.' },
    {
      name: 'autoplay',
      type: 'boolean',
      default: 'false',
      description: 'Défilement automatique avec bouton pause.',
    },
    {
      name: 'interval',
      type: 'number',
      default: '5000',
      description: 'Durée d’une diapositive (ms).',
    },
    {
      name: 'showControls',
      type: 'boolean',
      default: 'true',
      description: 'Boutons précédent / suivant.',
    },
    {
      name: 'showIndicators',
      type: 'boolean',
      default: 'true',
      description: 'Indicateurs de position.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioCarouselLabels>',
      default: '{}',
      description: 'Libellés.',
    },
    {
      name: 'gestio-carousel-slide · label',
      type: 'string',
      description: 'Nom de la diapositive.',
    },
  ];
}
