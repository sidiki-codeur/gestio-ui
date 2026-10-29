import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GestioDatePicker, GestioDateRange } from '@gestiolabs336/ui/date-picker';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

@Component({
  selector: 'sc-date-picker-page',
  imports: [GestioDatePicker, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Sélecteur de date" eyebrow="Composants">
      <code>gestio-date-picker</code> associe un champ texte, où la date se tape au format local
      (<code>jj/mm/aaaa</code>), à un bouton qui ouvre le calendrier dans une fenêtre surgissante
      modale. La saisie est tolérante : <code>5/11</code>, <code>05.11.26</code>,
      <code>05112026</code> ou <code>5 nov. 2026</code> sont compris.
    </sc-page-header>

    <sc-example
      heading="Échéance d’une facture"
      description="Reactive Forms, date minimale aujourd’hui et week-ends exclus. Ouvrez le calendrier avec le bouton ou Alt + flèche bas."
      [code]="formCode"
      stacked
    >
      <div class="sc-grid sc-grid--2">
        <gestio-date-picker
          label="Date d’échéance"
          hint="Jour ouvré, à partir d’aujourd’hui."
          required
          [min]="today"
          [dateDisabled]="isWeekend"
          [error]="dueError()"
          [formControl]="due"
        />
      </div>
      <p class="sc-result" aria-live="polite">
        Valeur : <strong>{{ describe(dueValue()) }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Période de facturation"
      description="Mode range : saisissez « 01/10/2026 – 31/10/2026 » ou choisissez deux dates dans le calendrier."
      [code]="rangeCode"
      stacked
    >
      <div class="sc-grid sc-grid--2">
        <gestio-date-picker label="Période" mode="range" [(range)]="period" />
      </div>
      <p class="sc-result" aria-live="polite">
        Du <strong>{{ describe(period().start) }}</strong> au
        <strong>{{ describe(period().end) }}</strong>
      </p>
    </sc-example>

    <sc-example heading="États et tailles" [code]="statesCode">
      <div class="sc-grid">
        <gestio-date-picker label="Petite taille" size="sm" [(value)]="small" />
        <gestio-date-picker label="Date de création" readonly [value]="created" />
        <gestio-date-picker label="Date de clôture" disabled />
        <gestio-date-picker label="Date de relance" error="La relance doit suivre l’échéance." />
      </div>
    </sc-example>

    <sc-example
      heading="Autre locale"
      description="Le format suit locale ; les libellés se traduisent avec labels."
      [code]="localeCode"
    >
      <div class="sc-grid sc-grid--2">
        <gestio-date-picker
          label="Delivery date"
          locale="en-US"
          [firstDayOfWeek]="0"
          [labels]="englishLabels"
          [calendarLabels]="englishCalendarLabels"
          [(value)]="delivery"
        />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-date-picker" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Valeur : <code>Date | null</code> (mode <code>single</code>) ou
          <code>{{ '{' }} start, end {{ '}' }}</code> (mode <code>range</code>). Une saisie non
          reconnue, indisponible ou une plage inversée donne <code>null</code> (ou une plage vide)
          et l’erreur de formulaire <code>gestioDate</code>, avec un message affiché sous le champ.
          Le calendrier est le bloc <code>gestio-calendar</code> : mêmes règles <code>min</code>,
          <code>max</code> et <code>dateDisabled</code>.
        </p>
      </div>
    </section>
  `,
})
export class DatePickerPage {
  protected readonly today = startOfToday();
  protected readonly isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  protected readonly due = new FormControl<Date | null>(null, Validators.required);
  private readonly dueState = signal(0);
  protected readonly dueValue = signal<Date | null>(null);
  protected readonly dueError = computed(() => {
    this.dueState();
    if (!this.due.touched) return null;
    return this.due.hasError('required') && !this.due.hasError('gestioDate')
      ? 'La date d’échéance est obligatoire.'
      : null;
  });

  protected readonly period = signal<GestioDateRange>({ start: null, end: null });
  protected readonly small = signal<Date | null>(null);
  protected readonly created = new Date(2026, 0, 12);
  protected readonly delivery = signal<Date | null>(null);

  protected readonly englishLabels = {
    openCalendar: 'Choose date',
    openRangeCalendar: 'Choose period',
    selected: 'selected: {date}',
    dialog: 'Choose date',
    rangeDialog: 'Choose period',
    day: 'dd',
    month: 'mm',
    year: 'yyyy',
    invalidDate: 'Unrecognized date. Expected format: {format}.',
    unavailableDate: 'This date is not available.',
    invalidRange: 'The end date is before the start date.',
  };

  protected readonly englishCalendarLabels = {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    unavailable: 'unavailable',
    today: 'today',
    rangeStart: 'start of period',
    rangeEnd: 'end of period',
  };

  constructor() {
    this.due.events.subscribe(() => {
      this.dueValue.set(this.due.value);
      this.dueState.update((n) => n + 1);
    });
  }

  protected describe(value: Date | null): string {
    return value ? dateFormat.format(value) : 'aucune';
  }

  protected readonly formCode = `<gestio-date-picker
  label="Date d’échéance"
  hint="Jour ouvré, à partir d’aujourd’hui."
  required
  [min]="today"
  [dateDisabled]="isWeekend"
  [error]="dueError()"
  formControlName="due"
/>`;

  protected readonly rangeCode = `<gestio-date-picker label="Période" mode="range" [(range)]="period" />`;

  protected readonly statesCode = `<gestio-date-picker label="Petite taille" size="sm" [(value)]="small" />
<gestio-date-picker label="Date de création" readonly [value]="created" />
<gestio-date-picker label="Date de clôture" disabled />
<gestio-date-picker label="Date de relance" error="La relance doit suivre l’échéance." />`;

  protected readonly localeCode = `<gestio-date-picker
  label="Delivery date"
  locale="en-US"
  [firstDayOfWeek]="0"
  [labels]="{ openCalendar: 'Choose date', dialog: 'Choose date', day: 'dd', month: 'mm', year: 'yyyy', … }"
  [calendarLabels]="{ previousMonth: 'Previous month', nextMonth: 'Next month', … }"
  [(value)]="delivery"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'mode',
      type: `'single' | 'range'`,
      default: `'single'`,
      description: 'Une date ou une plage.',
    },
    { name: 'value', type: 'model<Date | null>', description: 'Date (mode single) ; [(value)].' },
    {
      name: 'range',
      type: 'model<GestioDateRange>',
      description: 'Plage { start, end } (mode range) ; [(range)].',
    },
    { name: 'min', type: 'Date | null', description: 'Première date acceptée.' },
    { name: 'max', type: 'Date | null', description: 'Dernière date acceptée.' },
    {
      name: 'dateDisabled',
      type: '(date: Date) => boolean',
      description: 'Dates refusées (fériés, week-ends…).',
    },
    {
      name: 'locale',
      type: 'string',
      default: `'fr-FR'`,
      description: 'Format de saisie et calendrier.',
    },
    {
      name: 'firstDayOfWeek',
      type: '0 … 6',
      default: '1',
      description: 'Premier jour de la semaine du calendrier.',
    },
    {
      name: 'today',
      type: 'Date',
      description: 'Jour courant (mis en évidence, année par défaut de la saisie).',
    },
    { name: 'label', type: 'string', description: 'Libellé visible.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans libellé visible.' },
    {
      name: 'placeholder',
      type: 'string',
      default: 'gabarit de la locale',
      description: 'Texte indicatif (jj/mm/aaaa par défaut).',
    },
    { name: 'hint', type: 'string', description: 'Aide sous le champ.' },
    {
      name: 'error',
      type: 'string | null',
      description: 'Message d’erreur, active l’état invalide.',
    },
    {
      name: 'invalid',
      type: 'boolean',
      default: 'false',
      description: 'État invalide sans message (posé par Signal Forms).',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Astérisque et aria-required.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive champ et bouton.',
    },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Lecture seule.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Hauteur.' },
    { name: 'inputId', type: 'string', description: 'id du champ texte (généré sinon).' },
    { name: 'name', type: 'string', description: 'Attribut name du champ texte.' },
    {
      name: 'labels',
      type: 'Partial<GestioDatePickerLabels>',
      description: 'Libellés (bouton, fenêtre, gabarit, erreurs).',
    },
    {
      name: 'calendarLabels',
      type: 'Partial<GestioCalendarLabels>',
      description: 'Libellés du calendrier.',
    },
  ];
}
