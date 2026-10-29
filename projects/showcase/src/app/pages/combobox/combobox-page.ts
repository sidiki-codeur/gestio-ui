import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { GestioCombobox, GestioComboboxOption } from '@gestiolabs336/ui/combobox';
import { GestioFormField } from '@gestiolabs336/ui/form-field';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Client {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly archived?: boolean;
}

const CLIENTS: Client[] = [
  { id: 101, name: 'Atelier Moreau SARL', city: 'Lyon' },
  { id: 102, name: 'Études Durand & Associés', city: 'Nantes' },
  { id: 103, name: 'Boulangerie Petit', city: 'Lille', archived: true },
  { id: 104, name: 'Cabinet Étienne Lefèvre', city: 'Paris' },
  { id: 105, name: 'Garage Hélène Roux', city: 'Bordeaux' },
  { id: 106, name: 'Menuiserie Gaël Martin', city: 'Rennes' },
  { id: 107, name: 'Pharmacie de l’Écluse', city: 'Annecy' },
];

const ARTICLES: GestioComboboxOption<string>[] = [
  { label: 'Clavier sans fil AZERTY', value: 'KB-210', description: 'Réf. KB-210 · 34 en stock' },
  { label: 'Souris ergonomique', value: 'MS-118', description: 'Réf. MS-118 · 12 en stock' },
  { label: 'Écran 27 pouces', value: 'SC-270', description: 'Réf. SC-270 · 4 en stock' },
  { label: 'Station d’accueil USB-C', value: 'DK-400', description: 'Réf. DK-400 · 9 en stock' },
  { label: 'Casque à réduction de bruit', value: 'HS-090', description: 'Réf. HS-090 · épuisé' },
  { label: 'Câble HDMI 2 m', value: 'CB-002', description: 'Réf. CB-002 · 120 en stock' },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

@Component({
  selector: 'sc-combobox-page',
  imports: [
    GestioCombobox,
    GestioFormField,
    FormField,
    ReactiveFormsModule,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Liste avec recherche" eyebrow="Composants">
      <code>gestio-combobox</code> suit le motif ARIA « Combobox » : le focus reste dans le champ,
      les flèches parcourent les suggestions (<code>aria-activedescendant</code>),
      <kbd>Entrée</kbd> choisit, <kbd>Échap</kbd> ferme. Le filtrage ignore la casse et les accents
      : « etienne » trouve « Cabinet Étienne ».
    </sc-page-header>

    <sc-example
      heading="Affecter un client"
      description="Objets métier : displayWith pour le libellé, valueKey pour la valeur (un number), descriptionWith pour la ville. Les clients archivés ne sont pas sélectionnables."
      [code]="clientCode"
    >
      <div class="sc-grid sc-grid--2">
        <gestio-combobox
          label="Client"
          placeholder="Rechercher un client"
          hint="Saisissez une partie du nom."
          clearable
          valueKey="id"
          [options]="clients"
          [displayWith]="clientName"
          [descriptionWith]="clientCity"
          [disabledWith]="isArchived"
          [formControl]="client"
        />
        <p class="sc-result" aria-live="polite">
          Valeur : <strong>{{ clientValue() ?? 'null' }}</strong>
        </p>
      </div>
    </sc-example>

    <sc-example
      heading="Assigner plusieurs techniciens"
      description="multiple : les valeurs choisies deviennent des puces ; Retour arrière dans le champ vide retire la dernière."
      [code]="multipleCode"
    >
      <div class="sc-grid sc-grid--2">
        <gestio-combobox
          label="Techniciens"
          placeholder="Ajouter un technicien"
          multiple
          [options]="technicians"
          [formControl]="assignees"
        />
        <p class="sc-result" aria-live="polite">
          Valeur : <strong>{{ assigneesJson() }}</strong>
        </p>
      </div>
    </sc-example>

    <sc-example
      heading="Recherche côté serveur"
      description="filter=false : les options viennent d’une requête déclenchée par (search), temporisée de 300 ms, avec l’état loading."
      [code]="serverCode"
    >
      <div class="sc-grid sc-grid--2">
        <gestio-combobox
          label="Article"
          placeholder="Rechercher dans le catalogue"
          valueKey="value"
          [filter]="false"
          [loading]="loading()"
          [options]="articles()"
          [formControl]="article"
          (search)="searchArticles($event)"
        />
        <p class="sc-result" aria-live="polite">
          Valeur : <strong>{{ articleValue() ?? 'null' }}</strong>
        </p>
      </div>
    </sc-example>

    <sc-example
      heading="Dans un gestio-form-field, avec Signal Forms"
      description="Le libellé, l’aide et l’erreur du gestio-form-field sont reliés au champ interne."
      [code]="signalCode"
    >
      <div class="sc-grid sc-grid--2">
        <gestio-form-field
          label="Responsable du compte"
          hint="Commercial référent du client."
          required
          [error]="ownerError()"
        >
          <gestio-combobox placeholder="Choisir" [options]="technicians" [formField]="f.owner" />
        </gestio-form-field>
        <p class="sc-result" aria-live="polite">
          Valeur : <strong>{{ model().owner ?? 'null' }}</strong>
        </p>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-combobox" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Avec une recherche serveur, la valeur écrite par le formulaire doit correspondre à une
          option présente dans <code>options</code> pour afficher son libellé ; les options choisies
          par l’utilisateur restent connues même quand la liste change. Début et Fin parcourent la
          liste quand une option est active, sinon ils déplacent le curseur.
        </p>
      </div>
    </section>
  `,
})
export class ComboboxPage {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clients = CLIENTS;
  protected readonly clientName = (client: Client) => client.name;
  protected readonly clientCity = (client: Client) => client.city;
  protected readonly isArchived = (client: Client) => client.archived === true;
  protected readonly client = new FormControl<number | null>(104);
  protected readonly clientValue = toSignal(this.client.valueChanges, {
    initialValue: this.client.value,
  });

  protected readonly technicians = [
    'Claire Moreau',
    'Julien Bernard',
    'Inès Lefèvre',
    'Théo Garnier',
    'Zoé Lambert',
    'Noël Petit',
  ];
  protected readonly assignees = new FormControl<string[]>(['Inès Lefèvre'], {
    nonNullable: true,
  });
  private readonly assigneesValue = toSignal(this.assignees.valueChanges, {
    initialValue: this.assignees.value,
  });
  protected readonly assigneesJson = computed(() => JSON.stringify(this.assigneesValue()));

  protected readonly articles = signal<GestioComboboxOption<string>[]>(ARTICLES.slice(0, 4));
  protected readonly loading = signal(false);
  protected readonly article = new FormControl<string | null>(null);
  protected readonly articleValue = toSignal(this.article.valueChanges, { initialValue: null });
  private requestTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly model = signal({ owner: null as string | null });
  protected readonly f = form(this.model, (path) => {
    required(path.owner, { message: 'Choisissez un responsable.' });
  });
  protected readonly ownerError = computed(() => {
    const field = this.f.owner();
    return field.touched() && field.invalid() ? (field.errors()[0]?.message ?? null) : null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.requestTimer));
  }

  /** Simule un appel HTTP de 600 ms. */
  protected searchArticles(query: string): void {
    clearTimeout(this.requestTimer);
    this.loading.set(true);
    this.requestTimer = setTimeout(() => {
      const needle = normalize(query.trim());
      this.articles.set(
        ARTICLES.filter(
          (a) => normalize(a.label).includes(needle) || normalize(a.value).includes(needle),
        ),
      );
      this.loading.set(false);
    }, 600);
  }

  protected readonly clientCode = `// imports: [GestioCombobox, ReactiveFormsModule]
clientName = (client: Client) => client.name;
clientCity = (client: Client) => client.city;
isArchived = (client: Client) => client.archived === true;
client = new FormControl<number | null>(104);

<gestio-combobox
  label="Client"
  placeholder="Rechercher un client"
  clearable
  valueKey="id"
  [options]="clients"
  [displayWith]="clientName"
  [descriptionWith]="clientCity"
  [disabledWith]="isArchived"
  [formControl]="client"
/>`;

  protected readonly multipleCode = `// imports: [GestioCombobox, ReactiveFormsModule]
assignees = new FormControl<string[]>(['Inès Lefèvre'], { nonNullable: true });

<gestio-combobox
  label="Techniciens"
  placeholder="Ajouter un technicien"
  multiple
  [options]="technicians"
  [formControl]="assignees"
/>`;

  protected readonly serverCode = `// imports: [GestioCombobox, ReactiveFormsModule]
<gestio-combobox
  label="Article"
  placeholder="Rechercher dans le catalogue"
  valueKey="value"
  [filter]="false"
  [loading]="loading()"
  [options]="articles()"
  [formControl]="article"
  (search)="searchArticles($event)"
/>`;

  protected readonly signalCode = `// imports: [GestioCombobox, GestioFormField, FormField]
model = signal({ owner: null as string | null });
f = form(this.model, (path) => required(path.owner, { message: 'Choisissez un responsable.' }));

<gestio-form-field label="Responsable du compte" required [error]="ownerError()">
  <gestio-combobox placeholder="Choisir" [options]="technicians" [formField]="f.owner" />
</gestio-form-field>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'options',
      type: 'readonly T[]',
      default: '[]',
      description: 'Options : chaînes, { label, value, description?, disabled? } ou objets métier.',
    },
    {
      name: 'displayWith',
      type: '(option: T) => string',
      default: 'option.label ?? String(option)',
      description: 'Libellé affiché et filtré.',
    },
    {
      name: 'valueKey',
      type: 'keyof T | null',
      default: 'null',
      description: 'Propriété portant la valeur ; null : l’option elle-même.',
    },
    {
      name: 'descriptionWith',
      type: '(option: T) => string | null',
      default: 'option.description',
      description: 'Texte secondaire.',
    },
    {
      name: 'disabledWith',
      type: '(option: T) => boolean',
      default: 'option.disabled === true',
      description: 'Option non sélectionnable.',
    },
    {
      name: 'multiple',
      type: 'boolean',
      default: 'false',
      description: 'Valeur tableau, valeurs affichées en puces.',
    },
    {
      name: 'filter',
      type: 'boolean',
      default: 'true',
      description: 'Filtrage local (casse et accents ignorés) ; false pour une recherche serveur.',
    },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Affiche « Chargement… ».' },
    {
      name: 'searchDebounce',
      type: 'number',
      default: '300',
      description: 'Délai (ms) avant (search).',
    },
    {
      name: 'clearable',
      type: 'boolean',
      default: 'false',
      description: 'Bouton d’effacement ; Échap efface aussi (liste fermée).',
    },
    { name: 'label, ariaLabel', type: 'string', description: 'Libellé visible ou nom accessible.' },
    { name: 'placeholder, hint', type: 'string', description: 'Indication et aide.' },
    { name: 'error', type: 'string | null', description: 'Message d’erreur.' },
    {
      name: 'invalid, touched',
      type: 'boolean',
      default: 'false',
      description: 'États liés automatiquement par [formField].',
    },
    {
      name: 'disabled, required',
      type: 'boolean',
      default: 'false',
      description: 'États du champ.',
    },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Hauteur.' },
    { name: 'inputId', type: 'string', description: 'id du champ natif.' },
    {
      name: 'labels',
      type: 'Partial<GestioComboboxLabels>',
      default: '{}',
      description: 'Textes : aucun résultat, chargement, effacer, annonces…',
    },
    { name: '(search)', type: 'string', description: 'Texte saisi, temporisé.' },
    { name: '(touch)', type: 'void', description: 'Le focus quitte le composant.' },
  ];
}
