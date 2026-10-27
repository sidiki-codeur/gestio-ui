import { Component, computed, signal } from '@angular/core';
import { FormField, form, max, min, required } from '@angular/forms/signals';
import { GestioQuantityInput } from '@gestiolabs336/ui/blocks/quantity-input';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-quantity-input-page',
  imports: [GestioQuantityInput, FormField, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Sélecteur de quantité" eyebrow="Blocs">
      <code>gestio-quantity-input</code> encadre un champ numérique natif de boutons − et +. Les
      flèches <kbd>↑</kbd> <kbd>↓</kbd> fonctionnent dans le champ, la valeur est ramenée dans les
      bornes à la sortie du champ et chaque clic est annoncé aux lecteurs d’écran.
    </sc-page-header>

    <sc-example heading="Bornes et pas" [code]="basicCode" stacked>
      <div class="sc-row">
        <gestio-quantity-input label="Quantité" [min]="1" [max]="12" [(value)]="quantity" />
        <gestio-quantity-input
          label="Ramettes (par 5)"
          hint="Vendues par lot de 5"
          [min]="5"
          [step]="5"
          [(value)]="reams"
        />
      </div>
      <p class="sc-result" aria-live="polite">
        quantity : <strong>{{ quantity() }}</strong> · reams : <strong>{{ reams() }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Tailles et état désactivé" [code]="sizesCode">
      <gestio-quantity-input ariaLabel="Quantité (petit)" size="sm" [value]="1" />
      <gestio-quantity-input ariaLabel="Quantité (moyen)" [value]="2" />
      <gestio-quantity-input ariaLabel="Quantité (grand)" size="lg" [value]="3" />
      <gestio-quantity-input ariaLabel="Quantité (désactivé)" disabled [value]="4" />
    </sc-example>

    <sc-example heading="Signal Forms et validation" [code]="formCode" stacked>
      <gestio-quantity-input
        label="Licences utilisateurs"
        [error]="seatsError()"
        [formField]="f.seats"
      />
      <p class="sc-result" aria-live="polite">
        Total : <strong>{{ total() }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-quantity-input" [rows]="api" />
    </section>
  `,
})
export class QuantityInputPage {
  protected readonly quantity = signal<number | null>(1);
  protected readonly reams = signal<number | null>(10);

  protected readonly model = signal({ seats: 3 });
  protected readonly f = form(this.model, (path) => {
    required(path.seats, { message: 'Indiquez un nombre de licences' });
    min(path.seats, 1, { message: 'Au moins une licence' });
    max(path.seats, 50, { message: '50 licences maximum' });
  });
  protected readonly seatsError = computed(() => this.f.seats().errors()[0]?.message ?? null);
  protected readonly total = computed(() =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
      (this.model().seats ?? 0) * 12,
    ),
  );

  protected readonly basicCode = `<gestio-quantity-input label="Quantité" [min]="1" [max]="12" [(value)]="quantity" />
<gestio-quantity-input label="Ramettes (par 5)" [min]="5" [step]="5" [(value)]="reams" />`;

  protected readonly sizesCode = `<gestio-quantity-input ariaLabel="Quantité" size="sm" [value]="1" />
<gestio-quantity-input ariaLabel="Quantité" disabled [value]="4" />`;

  protected readonly formCode = `// imports: [GestioQuantityInput, FormField]
model = signal({ seats: 3 });
f = form(this.model, (path) => {
  min(path.seats, 1, { message: 'Au moins une licence' });
  max(path.seats, 50, { message: '50 licences maximum' });
});

<!-- min / max viennent du schéma : ne pas les lier en plus de [formField]. -->
<gestio-quantity-input label="Licences utilisateurs"
  [error]="seatsError()" [formField]="f.seats" />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'value',
      type: 'model<number | null>',
      default: 'null',
      description: 'Quantité ; [(value)] ou formulaire.',
    },
    { name: 'min', type: 'number', default: '0', description: 'Borne basse.' },
    { name: 'max', type: 'number | null', default: 'null', description: 'Borne haute.' },
    { name: 'step', type: 'number', default: '1', description: 'Pas des boutons.' },
    { name: 'label', type: 'string', description: 'Libellé visible.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans libellé visible.' },
    { name: 'hint', type: 'string', description: 'Texte d’aide.' },
    { name: 'error', type: 'string | null', description: 'Message d’erreur.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Taille.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive.' },
    { name: 'inputId', type: 'string', description: 'id du champ natif.' },
    { name: 'name', type: 'string', description: 'Attribut name.' },
    {
      name: 'labels',
      type: 'Partial<GestioQuantityInputLabels>',
      default: '{}',
      description: 'Libellés des boutons et de l’annonce.',
    },
  ];
}
