import { Component, computed, signal } from '@angular/core';
import { GestioCalendar, GestioDateRange } from '@gestiolabs336/ui/blocks/calendar';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

@Component({
  selector: 'sc-calendar-page',
  imports: [GestioCalendar, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Calendrier" eyebrow="Blocs">
      <code>gestio-calendar</code> affiche une grille mensuelle pour choisir une date ou une
      période. Il suit le motif ARIA « Date Picker » : un seul arrêt de tabulation, flèches pour
      changer de jour ou de semaine, <kbd>Page préc.</kbd> / <kbd>Page suiv.</kbd> pour changer de
      mois (avec <kbd>Maj</kbd> : d’année).
    </sc-page-header>

    <sc-example
      heading="Date d’échéance"
      description="Week-ends indisponibles, aucune date passée."
      [code]="singleCode"
      stacked
    >
      <gestio-calendar
        [(value)]="dueDate"
        [min]="today"
        [dateDisabled]="isWeekend"
        ariaLabel="Date d’échéance"
      />
      <p class="sc-result" aria-live="polite">
        Échéance : <strong>{{ dueDateText() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Période de congés"
      description="Premier clic : début ; second clic : fin."
      [code]="rangeCode"
      stacked
    >
      <gestio-calendar mode="range" [(range)]="leave" ariaLabel="Période de congés" />
      <p class="sc-result" aria-live="polite">
        Période : <strong>{{ leaveText() }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Semaine anglo-saxonne" [code]="localeCode" stacked>
      <gestio-calendar locale="en-US" [firstDayOfWeek]="0" [labels]="englishLabels" />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-calendar" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          En mode <code>single</code>, le calendrier est un champ de formulaire :
          <code>[formField]</code>, <code>formControlName</code> et <code>ngModel</code> sont pris
          en charge. Les dates sont comparées au jour près, en heure locale.
        </p>
      </div>
    </section>
  `,
})
export class CalendarPage {
  protected readonly today = new Date();
  protected readonly dueDate = signal<Date | null>(null);
  protected readonly leave = signal<GestioDateRange>({ start: null, end: null });
  protected readonly isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
  protected readonly englishLabels = { previousMonth: 'Previous month', nextMonth: 'Next month' };

  protected readonly dueDateText = computed(() => {
    const date = this.dueDate();
    return date ? dateFormat.format(date) : 'aucune';
  });

  protected readonly leaveText = computed(() => {
    const { start, end } = this.leave();
    if (!start) return 'aucune';
    return end
      ? `du ${dateFormat.format(start)} au ${dateFormat.format(end)}`
      : `à partir du ${dateFormat.format(start)}…`;
  });

  protected readonly singleCode = `<gestio-calendar
  [(value)]="dueDate"
  [min]="today"
  [dateDisabled]="isWeekend"
  ariaLabel="Date d’échéance"
/>

readonly dueDate = signal<Date | null>(null);
readonly isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;`;

  protected readonly rangeCode = `<gestio-calendar mode="range" [(range)]="leave" ariaLabel="Période de congés" />

readonly leave = signal<GestioDateRange>({ start: null, end: null });`;

  protected readonly localeCode = `<gestio-calendar
  locale="en-US"
  [firstDayOfWeek]="0"
  [labels]="{ previousMonth: 'Previous month', nextMonth: 'Next month' }"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'mode',
      type: `'single' | 'range'`,
      default: `'single'`,
      description: 'Une date ou une plage.',
    },
    { name: 'value', type: 'model<Date | null>', default: 'null', description: '[(value)].' },
    {
      name: 'range',
      type: 'model<GestioDateRange>',
      default: '{ start: null, end: null }',
      description: '[(range)] en mode plage.',
    },
    {
      name: 'month',
      type: 'model<Date | null>',
      default: 'null',
      description: 'Mois affiché ; par défaut celui de la sélection ou du jour.',
    },
    { name: 'min / max', type: 'Date | null', description: 'Bornes sélectionnables.' },
    {
      name: 'dateDisabled',
      type: '(date: Date) => boolean',
      description: 'Dates indisponibles.',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Noms via Intl.' },
    {
      name: 'firstDayOfWeek',
      type: '0 … 6',
      default: '1',
      description: 'Premier jour (0 = dimanche).',
    },
    { name: 'today', type: 'Date', default: 'maintenant', description: 'Jour mis en évidence.' },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive le calendrier.',
    },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible de la grille.' },
    {
      name: 'labels',
      type: 'Partial<GestioCalendarLabels>',
      default: '{}',
      description: 'Libellés traduits.',
    },
  ];
}
