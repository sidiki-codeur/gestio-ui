import { Component, computed, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { GESTIO_FORM_FIELD_IMPORTS } from '@gestiolabs336/ui/form-field';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-form-field-page',
  imports: [GESTIO_FORM_FIELD_IMPORTS, FormField, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Champ de formulaire" eyebrow="Composants">
      Enveloppe un contrôle natif sans équivalent Gestio (date, heure, couleur, liste multiple…) :
      libellé, aide, erreur et astérisque, reliés automatiquement par <code>id</code>,
      <code>aria-describedby</code> et <code>aria-invalid</code>.
    </sc-page-header>

    <sc-example
      heading="Date et heure natives"
      description="Avec Signal Forms : [formField] pose required, le champ affiche l’erreur après le premier passage."
      [code]="dateCode"
      stacked
    >
      <div class="sc-grid">
        <gestio-form-field
          label="Date d’échéance"
          hint="Au plus tard dans 60 jours."
          required
          [error]="dueError()"
        >
          <input gestioFieldControl type="date" [formField]="invoice.due" />
        </gestio-form-field>
        <gestio-form-field label="Heure de relance">
          <input gestioFieldControl type="time" value="09:30" />
        </gestio-form-field>
      </div>
    </sc-example>

    <sc-example heading="Liste et zone de texte natives" [code]="nativeCode" stacked>
      <div class="sc-grid">
        <gestio-form-field label="Devise" size="sm">
          <select gestioFieldControl>
            <option>EUR — Euro</option>
            <option>XOF — Franc CFA</option>
            <option>USD — Dollar</option>
          </select>
        </gestio-form-field>
        <gestio-form-field label="Notes internes" hint="Non visibles par le client.">
          <textarea gestioFieldControl rows="3"></textarea>
        </gestio-form-field>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-form-field" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Inutile autour de <code>gestio-input</code>, <code>gestio-select</code> ou
          <code>gestio-radio-group</code> : ils ont déjà libellé, aide et erreur.
        </p>
      </div>
    </section>
  `,
})
export class FormFieldPage {
  private readonly model = signal({ due: '' });
  protected readonly invoice = form(this.model, (path) => {
    required(path.due, { message: 'Choisissez une date.' });
  });
  protected readonly dueError = computed(() => {
    const due = this.invoice.due();
    return due.touched() ? (due.errors()[0]?.message ?? null) : null;
  });

  protected readonly dateCode = `<gestio-form-field label="Date d’échéance" hint="Au plus tard dans 60 jours."
  required [error]="dueError()">
  <input gestioFieldControl type="date" [formField]="invoice.due" />
</gestio-form-field>

// imports: [GESTIO_FORM_FIELD_IMPORTS, FormField]
invoice = form(signal({ due: '' }), (path) => {
  required(path.due, { message: 'Choisissez une date.' });
});
dueError = computed(() => {
  const due = this.invoice.due();
  return due.touched() ? (due.errors()[0]?.message ?? null) : null;
});`;

  protected readonly nativeCode = `<gestio-form-field label="Devise" size="sm">
  <select gestioFieldControl>…</select>
</gestio-form-field>

// imports: [GESTIO_FORM_FIELD_IMPORTS]`;

  protected readonly api: ApiRow[] = [
    { name: 'label', type: 'string', description: 'Libellé relié au contrôle.' },
    { name: 'hint', type: 'string', description: 'Aide reliée par aria-describedby.' },
    {
      name: 'error',
      type: 'string | null',
      description: 'Message d’erreur ; pose aria-invalid sur le contrôle.',
    },
    { name: 'required', type: 'boolean', default: 'false', description: 'Affiche l’astérisque.' },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Hauteur du contrôle.',
    },
  ];
}
