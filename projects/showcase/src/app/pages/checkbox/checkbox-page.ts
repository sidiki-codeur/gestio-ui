import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioCheckbox } from '@gestiolabs336/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-checkbox-page',
  imports: [GestioCheckbox, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Case à cocher" eyebrow="Composants">
      Repose sur un <code>&lt;input type="checkbox"&gt;</code> natif : clic sur le libellé, barre
      d’espace et lecteurs d’écran fonctionnent sans code supplémentaire.
    </sc-page-header>

    <sc-example heading="Avec Reactive Forms" [code]="formCode" stacked>
      <gestio-checkbox
        label="Envoyer les factures par e-mail"
        description="Un PDF est joint à chaque facture validée."
        [formControl]="emailInvoices"
      />
      <p class="sc-result" aria-live="polite">
        Valeur du contrôle : <strong>{{ emailInvoices.value }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="État indéterminé"
      description="La case parente reflète une sélection partielle."
      [code]="indeterminateCode"
      stacked
    >
      <gestio-checkbox
        label="Toutes les notifications"
        [checked]="allChecked()"
        [indeterminate]="someChecked()"
        (checkedChange)="toggleAll($event)"
      />
      <div class="sc-stack" style="padding-left: 1.75rem; gap: var(--gestio-space-2)">
        @for (item of channels(); track item.id; let i = $index) {
          <gestio-checkbox
            [label]="item.label"
            [checked]="item.checked"
            (checkedChange)="toggle(i, $event)"
          />
        }
      </div>
    </sc-example>

    <sc-example heading="États" [code]="statesCode" stacked>
      <gestio-checkbox label="Option désactivée" disabled />
      <gestio-checkbox label="Option cochée désactivée" [checked]="true" disabled />
      <gestio-checkbox
        label="J’accepte les conditions générales de vente"
        required
        error="Vous devez accepter les conditions pour continuer."
      />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de la case à cocher" [rows]="api" />
    </section>
  `,
})
export class CheckboxPage {
  protected readonly emailInvoices = new FormControl(true, { nonNullable: true });

  protected readonly channels = signal([
    { id: 'email', label: 'E-mail', checked: true },
    { id: 'sms', label: 'SMS', checked: false },
    { id: 'app', label: 'Application mobile', checked: true },
  ]);
  protected readonly allChecked = computed(() => this.channels().every((item) => item.checked));
  protected readonly someChecked = computed(
    () => !this.allChecked() && this.channels().some((item) => item.checked),
  );

  protected toggleAll(checked: boolean): void {
    this.channels.update((items) => items.map((item) => ({ ...item, checked })));
  }

  protected toggle(index: number, checked: boolean): void {
    this.channels.update((items) =>
      items.map((item, i) => (i === index ? { ...item, checked } : item)),
    );
  }

  protected readonly formCode = `<gestio-checkbox
  label="Envoyer les factures par e-mail"
  description="Un PDF est joint à chaque facture validée."
  formControlName="emailInvoices"
/>`;

  protected readonly indeterminateCode = `<gestio-checkbox
  label="Toutes les notifications"
  [checked]="allChecked()"
  [indeterminate]="someChecked()"
  (checkedChange)="toggleAll($event)"
/>`;

  protected readonly statesCode = `<gestio-checkbox label="Option désactivée" disabled />
<gestio-checkbox
  label="J’accepte les conditions générales de vente"
  required
  error="Vous devez accepter les conditions pour continuer."
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'label',
      type: 'string',
      description: 'Libellé ; le contenu projeté est ajouté au libellé.',
    },
    {
      name: 'description',
      type: 'string',
      description: 'Texte secondaire relié par aria-describedby.',
    },
    { name: 'error', type: 'string | null', description: 'Message d’erreur.' },
    {
      name: 'checked',
      type: 'model<boolean>',
      default: 'false',
      description: 'État coché ; [(checked)] ou checkedChange hors formulaire.',
    },
    {
      name: 'indeterminate',
      type: 'model<boolean>',
      default: 'false',
      description: 'État mixte, remis à false à la première interaction.',
    },
    { name: 'disabled, required', type: 'boolean', default: 'false', description: 'États natifs.' },
    { name: 'checkboxId, name, value', type: 'string', description: 'Attributs natifs.' },
  ];
}
