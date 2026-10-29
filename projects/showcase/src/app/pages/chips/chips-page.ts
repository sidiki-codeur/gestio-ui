import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioChip, GestioChipInput } from '@gestiolabs336/ui/chips';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface StatusFilter {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

@Component({
  selector: 'sc-chips-page',
  imports: [GestioChip, GestioChipInput, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Puces" eyebrow="Composants">
      <code>gestio-chip</code> affiche un mot-clé, un filtre actif ou un destinataire.
      <code>gestio-chip-input</code> permet de saisir plusieurs mots-clés dans un seul champ :
      <kbd>Entrée</kbd> ou la virgule ajoute, <kbd>Retour arrière</kbd> retire la dernière puce.
    </sc-page-header>

    <sc-example
      heading="Étiqueter un ticket"
      description="Doublons refusés (casse ignorée), cinq étiquettes au maximum, ajouts et suppressions annoncés aux lecteurs d’écran."
      [code]="inputCode"
      stacked
    >
      <gestio-chip-input
        label="Étiquettes du ticket #4821"
        placeholder="Ajouter une étiquette"
        hint="Cinq étiquettes au maximum. Collez « a, b, c » pour en ajouter plusieurs."
        variant="primary"
        [maxChips]="5"
        [formControl]="tags"
      />
      <p class="sc-result" aria-live="polite">
        Valeur : <strong>{{ tagsJson() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Filtres de la file de tickets"
      description="Puces de filtre : boutons bascule (aria-pressed)."
      [code]="filterCode"
      stacked
    >
      <div class="sc-row" role="group" aria-label="Filtrer par statut">
        @for (status of statuses; track status.id) {
          <gestio-chip
            [selected]="activeStatuses().includes(status.id)"
            (selectedChange)="toggleStatus(status.id, $event)"
            >{{ status.label }} ({{ status.count }})</gestio-chip
          >
        }
      </div>
      <p class="sc-result" aria-live="polite">
        <strong>{{ visibleCount() }}</strong> ticket(s) affiché(s)
      </p>
    </sc-example>

    <sc-example
      heading="Filtres actifs retirables"
      description="Chaque bouton de suppression est nommé « Retirer … »."
      [code]="removableCode"
      stacked
    >
      @if (activeFilters().length) {
        <ul
          class="sc-row"
          style="list-style: none; margin: 0; padding: 0"
          aria-label="Filtres actifs"
        >
          @for (filter of activeFilters(); track filter) {
            <li>
              <gestio-chip removable (removed)="removeFilter(filter)">{{ filter }}</gestio-chip>
            </li>
          }
        </ul>
      } @else {
        <p class="sc-muted" style="margin: 0">Aucun filtre actif.</p>
      }
      <div class="sc-row">
        <gestio-chip variant="success">Résolu</gestio-chip>
        <gestio-chip variant="warning">En attente client</gestio-chip>
        <gestio-chip variant="danger">Priorité haute</gestio-chip>
        <gestio-chip variant="info">Facturation</gestio-chip>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-chip et gestio-chip-input" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          <code>gestio-chip-input</code> est un ControlValueAccessor sur <code>string[]</code> :
          Reactive Forms, <code>ngModel</code> et Signal Forms (<code>[formField]</code>). Placé
          dans un <code>gestio-form-field</code>, il en reprend le libellé, l’aide et l’erreur.
          Après la suppression d’une puce isolée (<code>(removed)</code>), déplacez vous-même le
          focus vers un élément voisin.
        </p>
      </div>
    </section>
  `,
})
export class ChipsPage {
  protected readonly tags = new FormControl<string[]>(['Facturation', 'Litige'], {
    nonNullable: true,
  });
  private readonly tagsValue = toSignal(this.tags.valueChanges, { initialValue: this.tags.value });
  protected readonly tagsJson = computed(() => JSON.stringify(this.tagsValue()));

  protected readonly statuses: StatusFilter[] = [
    { id: 'open', label: 'Ouverts', count: 12 },
    { id: 'pending', label: 'En attente', count: 5 },
    { id: 'late', label: 'En retard', count: 3 },
    { id: 'closed', label: 'Clos', count: 41 },
  ];
  protected readonly activeStatuses = signal<string[]>(['open']);
  protected readonly visibleCount = computed(() => {
    const active = this.activeStatuses();
    const shown = active.length
      ? this.statuses.filter((s) => active.includes(s.id))
      : this.statuses;
    return shown.reduce((total, s) => total + s.count, 0);
  });

  protected readonly activeFilters = signal([
    'Client : Atelier Moreau',
    'Priorité haute',
    'Ce mois-ci',
  ]);

  protected toggleStatus(id: string, selected: boolean | undefined): void {
    this.activeStatuses.update((ids) =>
      selected ? [...ids, id] : ids.filter((current) => current !== id),
    );
  }

  protected removeFilter(filter: string): void {
    this.activeFilters.update((filters) => filters.filter((f) => f !== filter));
  }

  protected readonly inputCode = `// imports: [GestioChipInput, ReactiveFormsModule]
tags = new FormControl<string[]>(['Facturation', 'Litige'], { nonNullable: true });

<gestio-chip-input
  label="Étiquettes du ticket #4821"
  placeholder="Ajouter une étiquette"
  hint="Cinq étiquettes au maximum."
  variant="primary"
  [maxChips]="5"
  [formControl]="tags"
/>`;

  protected readonly filterCode = `<div role="group" aria-label="Filtrer par statut">
  @for (status of statuses; track status.id) {
    <gestio-chip
      [selected]="active().includes(status.id)"
      (selectedChange)="toggle(status.id, $event)"
    >{{ status.label }} ({{ status.count }})</gestio-chip>
  }
</div>`;

  protected readonly removableCode = `<ul aria-label="Filtres actifs">
  @for (filter of filters(); track filter) {
    <li><gestio-chip removable (removed)="remove(filter)">{{ filter }}</gestio-chip></li>
  }
</ul>

<gestio-chip variant="success">Résolu</gestio-chip>
<gestio-chip variant="warning">En attente client</gestio-chip>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'gestio-chip · variant',
      type: `'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'`,
      default: `'neutral'`,
      description: 'Couleur sémantique.',
    },
    {
      name: 'gestio-chip · removable',
      type: 'boolean',
      default: 'false',
      description: 'Bouton « Retirer X » ; émet (removed).',
    },
    {
      name: 'gestio-chip · selected',
      type: 'model<boolean | undefined>',
      default: 'undefined',
      description: 'Lié (true/false) : puce de filtre bascule avec aria-pressed.',
    },
    {
      name: 'gestio-chip · disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive la bascule et la suppression.',
    },
    {
      name: 'gestio-chip · (removed)',
      type: 'void',
      description:
        'Clic sur le bouton de suppression, ou Suppr / Retour arrière sur une puce de filtre.',
    },
    {
      name: 'gestio-chip-input · label, ariaLabel',
      type: 'string',
      description: 'Libellé visible ou nom accessible.',
    },
    {
      name: 'gestio-chip-input · placeholder, hint',
      type: 'string',
      description: 'Indication et aide.',
    },
    {
      name: 'gestio-chip-input · error',
      type: 'string | null',
      description: 'Message d’erreur ; active l’état invalide.',
    },
    {
      name: 'gestio-chip-input · maxChips',
      type: 'number',
      description: 'Nombre maximal de puces (refus annoncé).',
    },
    {
      name: 'gestio-chip-input · variant, size',
      type: 'GestioChipVariant, GestioSize',
      default: `'neutral', 'md'`,
      description: 'Couleur des puces, hauteur du champ.',
    },
    {
      name: 'gestio-chip-input · invalid, touched',
      type: 'boolean',
      default: 'false',
      description: 'États liés automatiquement par [formField].',
    },
    {
      name: 'gestio-chip-input · disabled, required',
      type: 'boolean',
      default: 'false',
      description: 'États du champ.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioChipLabels> | Partial<GestioChipInputLabels>',
      default: '{}',
      description: 'Textes : consigne, « Retirer {label} », annonces ({label}, {max}).',
    },
    {
      name: 'gestio-chip-input · (added), (removed)',
      type: 'string',
      description: 'Puce ajoutée ou retirée.',
    },
  ];
}
