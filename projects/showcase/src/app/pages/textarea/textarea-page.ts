import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GestioTextarea } from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-textarea-page',
  imports: [GestioTextarea, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Zone de texte" eyebrow="Composants">
      <code>gestio-textarea</code> pour les saisies longues : notes internes, motifs, commentaires.
      Redimensionnable verticalement.
    </sc-page-header>

    <sc-example heading="Avec compteur" [code]="counterCode" stacked>
      <gestio-textarea
        label="Note interne"
        placeholder="Visible uniquement par votre équipe"
        hint="Ne saisissez pas de données bancaires."
        [maxlength]="280"
        showCount
        [formControl]="note"
      />
    </sc-example>

    <sc-example heading="Lignes, erreur et états" [code]="statesCode">
      <div class="sc-grid sc-grid--2">
        <gestio-textarea
          label="Motif du refus"
          [rows]="3"
          required
          [formControl]="reason"
          [error]="reason.touched && reason.invalid ? 'Précisez le motif du refus.' : null"
        />
        <gestio-textarea label="Conditions générales" [rows]="3" readonly [formControl]="terms" />
        <gestio-textarea label="Commentaire" [rows]="3" disabled placeholder="Désactivé" />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de la zone de texte" [rows]="api" />
    </section>
  `,
})
export class TextareaPage {
  protected readonly note = new FormControl('Client à relancer avant la fin du mois.', {
    nonNullable: true,
  });
  protected readonly reason = new FormControl('', { validators: [Validators.required] });
  protected readonly terms = new FormControl(
    'Paiement à 30 jours fin de mois. Pénalités de retard : trois fois le taux d’intérêt légal.',
  );

  protected readonly counterCode = `<gestio-textarea
  label="Note interne"
  hint="Ne saisissez pas de données bancaires."
  [maxlength]="280"
  showCount
  formControlName="note"
/>`;

  protected readonly statesCode = `<gestio-textarea
  label="Motif du refus"
  [rows]="3"
  required
  [formControl]="reason"
  [error]="reason.touched && reason.invalid ? 'Précisez le motif du refus.' : null"
/>
<gestio-textarea label="Conditions générales" readonly [formControl]="terms" />
<gestio-textarea label="Commentaire" disabled />`;

  protected readonly api: ApiRow[] = [
    { name: 'label, ariaLabel', type: 'string', description: 'Libellé visible ou nom accessible.' },
    { name: 'placeholder, hint', type: 'string', description: 'Texte indicatif et aide.' },
    { name: 'error', type: 'string | null', description: 'Message d’erreur.' },
    { name: 'rows', type: 'number', default: '4', description: 'Nombre de lignes visibles.' },
    { name: 'maxlength', type: 'number', description: 'Longueur maximale (attribut natif).' },
    {
      name: 'showCount',
      type: 'boolean',
      default: 'false',
      description: 'Affiche le compteur, relié par aria-describedby.',
    },
    {
      name: 'required, disabled, readonly',
      type: 'boolean',
      default: 'false',
      description: 'États natifs.',
    },
    { name: 'textareaId, name', type: 'string', description: 'Identifiant et nom natifs.' },
  ];
}
