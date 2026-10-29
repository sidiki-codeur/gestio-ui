import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form } from '@angular/forms/signals';
import { GestioSlider, GestioSliderValue } from '@gestiolabs336/ui/slider';
import { GestioSwitch } from '@gestiolabs336/ui/switch';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

const euros: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
};

@Component({
  selector: 'sc-slider-page',
  imports: [
    GestioSlider,
    GestioSwitch,
    ReactiveFormsModule,
    FormsModule,
    FormField,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Curseur" eyebrow="Composants">
      <code>gestio-slider</code> choisit une valeur ou une plage dans un intervalle. Chaque poignée
      est un <code>&lt;input type="range"&gt;</code> natif : flèches, <kbd>Début</kbd>,
      <kbd>Fin</kbd> et <kbd>Page préc.</kbd>/<kbd>Page suiv.</kbd> au clavier, clic sur la piste ou
      glisser à la souris et au doigt.
    </sc-page-header>

    <sc-example
      heading="Valeur simple avec Reactive Forms"
      description="Graduations à chaque pas et valeur formatée en pourcentage."
      [code]="singleCode"
      stacked
    >
      <gestio-slider
        label="Remise commerciale"
        hint="Au-delà de 30 %, la validation d’un responsable est requise."
        [min]="0"
        [max]="50"
        [step]="5"
        showTicks
        [formatOptions]="percent"
        [formControl]="discount"
      />
      <p class="sc-result" aria-live="polite">
        Valeur du contrôle : <strong>{{ discountValue() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Plage de montants"
      description="Avec range, la valeur devient [début, fin] ; les poignées ne se croisent pas."
      [code]="rangeCode"
      stacked
    >
      <gestio-slider
        label="Montant des factures"
        range
        [min]="0"
        [max]="10000"
        [step]="100"
        [formatOptions]="euros"
        [(ngModel)]="amounts"
      />
      <p class="sc-result" aria-live="polite">
        Filtre : <strong>{{ amountsText() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Avec Signal Forms"
      description="Le formulaire pilote la valeur et l’état désactivé."
      [code]="signalCode"
      stacked
    >
      <gestio-switch label="Verrouiller le seuil" [(ngModel)]="locked" />
      <gestio-slider
        label="Seuil d’alerte de stock"
        [min]="0"
        [max]="200"
        [step]="10"
        [formatOptions]="units"
        [formField]="stockForm.threshold"
      />
      <p class="sc-result" aria-live="polite">
        Seuil : <strong>{{ stockModel().threshold }} unités</strong>
      </p>
    </sc-example>

    <sc-example heading="Désactivé et sans valeur affichée" [code]="disabledCode" stacked>
      <gestio-slider label="Délai de paiement (jours)" [min]="0" [max]="90" [step]="15" disabled />
      <gestio-slider ariaLabel="Volume des notifications" [showValue]="false" />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-slider" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Avec <code>[formField]</code>, ne posez pas d’attribut statique <code>disabled</code> ou
          <code>name</code> : ces états viennent du formulaire. <code>min</code>,
          <code>max</code> et <code>step</code> restent des entrées du composant.
        </p>
      </div>
    </section>
  `,
})
export class SliderPage {
  protected readonly euros = euros;
  protected readonly percent: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent' };
  protected readonly units: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

  protected readonly discount = new FormControl(10, { nonNullable: true });
  protected readonly discountValue = signal(this.discount.value);

  protected readonly amounts = signal<GestioSliderValue>([1500, 6000]);
  private readonly euroFormat = new Intl.NumberFormat('fr-FR', euros);
  protected readonly amountsText = computed(() => {
    const value = this.amounts();
    const [start, end] = typeof value === 'number' ? [value, value] : value;
    return `de ${this.euroFormat.format(start)} à ${this.euroFormat.format(end)}`;
  });

  protected readonly locked = signal(false);
  protected readonly stockModel = signal({ threshold: 40 });
  protected readonly stockForm = form(this.stockModel, (path) => {
    disabled(path.threshold, () => this.locked());
  });

  constructor() {
    this.discount.valueChanges.subscribe((value) => this.discountValue.set(value));
  }

  protected readonly singleCode = `<gestio-slider
  label="Remise commerciale"
  hint="Au-delà de 30 %, la validation d’un responsable est requise."
  [min]="0"
  [max]="50"
  [step]="5"
  showTicks
  [formatOptions]="{ style: 'unit', unit: 'percent' }"
  [formControl]="discount"
/>`;

  protected readonly rangeCode = `<gestio-slider
  label="Montant des factures"
  range
  [min]="0"
  [max]="10000"
  [step]="100"
  [formatOptions]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
  [(ngModel)]="amounts"
/>

// amounts = signal<GestioSliderValue>([1500, 6000]);`;

  protected readonly signalCode = `readonly model = signal({ threshold: 40 });
readonly stockForm = form(this.model, (path) => {
  disabled(path.threshold, () => this.locked());
});

<gestio-slider
  label="Seuil d’alerte de stock"
  [min]="0"
  [max]="200"
  [step]="10"
  [formField]="stockForm.threshold"
/>`;

  protected readonly disabledCode = `<gestio-slider label="Délai de paiement (jours)" [min]="0" [max]="90" [step]="15" disabled />
<gestio-slider ariaLabel="Volume des notifications" [showValue]="false" />`;

  protected readonly api: ApiRow[] = [
    { name: 'label', type: 'string', description: 'Libellé visible et nom accessible.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans libellé visible.' },
    { name: 'hint', type: 'string', description: 'Aide sous le curseur (aria-describedby).' },
    { name: 'min', type: 'number', default: '0', description: 'Borne basse.' },
    { name: 'max', type: 'number', default: '100', description: 'Borne haute.' },
    { name: 'step', type: 'number', default: '1', description: 'Pas entre deux valeurs.' },
    {
      name: 'range',
      type: 'boolean',
      default: 'false',
      description: 'Deux poignées ; valeur [début, fin].',
    },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive le curseur.' },
    {
      name: 'showTicks',
      type: 'boolean',
      default: 'false',
      description: 'Graduations (au plus 50) et bornes sous la piste.',
    },
    {
      name: 'showValue',
      type: 'boolean',
      default: 'true',
      description: 'Affiche la valeur à côté du libellé.',
    },
    {
      name: 'formatOptions',
      type: 'Intl.NumberFormatOptions',
      default: '{}',
      description: 'Format de la valeur affichée et annoncée (aria-valuetext).',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Locale Intl.' },
    { name: 'name', type: 'string', description: 'Attribut name des champs natifs.' },
    {
      name: 'labels',
      type: 'Partial<GestioSliderLabels>',
      default: '{}',
      description: 'Noms des poignées en mode plage, format de la plage.',
    },
  ];
}
