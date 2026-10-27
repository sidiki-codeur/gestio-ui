import { Component, signal } from '@angular/core';
import { FormField, form, min, required } from '@angular/forms/signals';
import { GestioRating, GestioReview } from '@gestiolabs336/ui/blocks/rating';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-rating-page',
  imports: [GestioRating, GestioReview, GestioButton, FormField, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Note et avis" eyebrow="Blocs">
      <code>gestio-rating</code> affiche une note en étoiles (fractions comprises) ou la fait saisir
      avec de vrais boutons radio : <kbd>Tab</kbd> entre dans le groupe, les flèches changent la
      note. <code>gestio-review</code> présente un avis client complet.
    </sc-page-header>

    <sc-example heading="Affichage" [code]="displayCode" stacked>
      <div class="sc-stack">
        <gestio-rating readonly showValue [value]="4.6" [count]="1284" />
        <gestio-rating readonly size="sm" [value]="3.5" [count]="42" />
        <gestio-rating readonly size="lg" [value]="5" />
        <gestio-rating readonly [value]="null" />
      </div>
    </sc-example>

    <sc-example
      heading="Saisie"
      description="Survolez les étoiles pour prévisualiser la note, ou utilisez les flèches."
      [code]="inputCode"
      stacked
    >
      <gestio-rating label="Satisfaction du support" [(value)]="score" />
      <p class="sc-result" aria-live="polite">
        value : <strong>{{ score() ?? 'aucune' }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Dans un formulaire (Signal Forms)" [code]="formCode" stacked>
      <form class="sc-form" (submit)="submit($event)">
        <gestio-rating label="Note de la prestation" [formField]="f.score" />
        <div class="sc-form__actions">
          <button gestioButton type="submit">Envoyer</button>
        </div>
      </form>
      <p class="sc-result" aria-live="polite">{{ sent() }}</p>
    </sc-example>

    <sc-example heading="Avis clients" [code]="reviewCode" stacked>
      <div class="sc-stack">
        <gestio-review
          author="Claire Moreau"
          date="2026-10-12"
          [rating]="5"
          heading="Facturation enfin simple"
          verified
        >
          Nous avons migré nos 300 clients en une matinée. Les relances automatiques nous font
          gagner plusieurs heures par semaine.
        </gestio-review>
        <gestio-review author="Julien Bernard" date="2026-09-28" [rating]="3.5" heading="Bon outil">
          Complet, mais l’export comptable mériterait plus d’options de format.
        </gestio-review>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-rating" [rows]="api" />
      <sc-api-table caption="Entrées de gestio-review" [rows]="reviewApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          En lecture seule, la note est une image nommée (« Note : 4,5 sur 5 ») ; en saisie, chaque
          étoile est un bouton radio nommé (« 3 étoiles »). Les étoiles vides restent contrastées
          (contour) pour ne pas porter l’information par la seule couleur.
        </p>
      </div>
    </section>
  `,
})
export class RatingPage {
  protected readonly score = signal<number | null>(null);
  protected readonly model = signal({ score: 0 });
  protected readonly f = form(this.model, (path) => {
    required(path.score);
    min(path.score, 1);
  });
  protected readonly sent = signal('Aucun envoi');

  protected submit(event: Event): void {
    event.preventDefault();
    this.sent.set(
      this.f().valid() ? `Note envoyée : ${this.model().score} / 5` : 'Choisissez une note',
    );
  }

  protected readonly displayCode = `<gestio-rating readonly showValue [value]="4.6" [count]="1284" />
<gestio-rating readonly size="sm" [value]="3.5" [count]="42" />`;

  protected readonly inputCode = `<gestio-rating label="Satisfaction du support" [(value)]="score" />`;

  protected readonly formCode = `// imports: [GestioRating, FormField]
model = signal({ score: 0 });
f = form(this.model, (path) => min(path.score, 1));

<gestio-rating label="Note de la prestation" [formField]="f.score" />`;

  protected readonly reviewCode = `<gestio-review
  author="Claire Moreau"
  date="2026-10-12"
  [rating]="5"
  heading="Facturation enfin simple"
  verified
>
  Nous avons migré nos 300 clients en une matinée…
</gestio-review>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'value',
      type: 'model<number | null>',
      default: 'null',
      description: 'Note ; [(value)] ou formulaire.',
    },
    { name: 'max', type: 'number', default: '5', description: 'Nombre d’étoiles.' },
    {
      name: 'readonly',
      type: 'boolean',
      default: 'false',
      description: 'Affichage seul (fractions acceptées).',
    },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive la saisie.' },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Taille des étoiles.',
    },
    { name: 'label', type: 'string', description: 'Légende visible en saisie.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans légende visible.' },
    {
      name: 'showValue',
      type: 'boolean',
      default: 'false',
      description: 'Affiche « 4,6 » (lecture seule).',
    },
    {
      name: 'count',
      type: 'number | null',
      default: 'null',
      description: 'Nombre d’avis (lecture seule).',
    },
    { name: 'name', type: 'string', description: 'Attribut name des radios.' },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Formatage des nombres.' },
    {
      name: 'labels',
      type: 'Partial<GestioRatingLabels>',
      default: '{}',
      description: 'Libellés.',
    },
  ];

  protected readonly reviewApi: ApiRow[] = [
    {
      name: 'author',
      type: 'string',
      description: 'Auteur (obligatoire) ; initiales sans avatar.',
    },
    { name: 'rating', type: 'number', description: 'Note (obligatoire).' },
    { name: 'date', type: 'Date | string | null', default: 'null', description: 'Date de l’avis.' },
    { name: 'heading', type: 'string', description: 'Titre de l’avis.' },
    { name: 'headingLevel', type: 'number', default: '3', description: 'Niveau du titre.' },
    { name: 'avatar', type: 'string', description: 'URL de la photo.' },
    {
      name: 'verified',
      type: 'boolean',
      default: 'false',
      description: 'Mention « Achat vérifié ».',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Formatage de la date.' },
    {
      name: 'labels',
      type: 'Partial<GestioReviewLabels>',
      default: '{}',
      description: 'Libellés.',
    },
  ];
}
