import { Component, inject, signal } from '@angular/core';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { GestioRadio, GestioRadioGroup } from '@gestiolabs336/ui/radio';
import {
  GESTIO_DRAWER_DATA,
  GESTIO_DRAWER_IMPORTS,
  GestioDrawerPosition,
  GestioDrawerRef,
  GestioDrawerService,
  GestioDrawerSize,
} from '@gestiolabs336/ui/drawer';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface InvoiceFilters {
  status: 'all' | 'paid' | 'pending' | 'late';
  onlyMine: boolean;
}

/** Contenu ouvert par le service : filtres de la liste des factures. */
@Component({
  selector: 'sc-invoice-filters-drawer',
  imports: [GESTIO_DRAWER_IMPORTS, GestioButton, GestioCheckbox, GestioRadioGroup, GestioRadio],
  template: `
    <gestio-drawer-content
      heading="Filtrer les factures"
      description="Appliqués à la liste courante."
    >
      <gestio-radio-group label="Statut" [(value)]="status">
        @for (option of statuses; track option.value) {
          <gestio-radio [value]="option.value" [label]="option.label" />
        }
      </gestio-radio-group>
      <div style="margin-top: var(--gestio-space-5)">
        <gestio-checkbox label="Uniquement mes dossiers" [(checked)]="onlyMine" />
      </div>
      <div gestioDrawerFooter>
        <button gestioButton variant="outline" (click)="ref.close()">Annuler</button>
        <button gestioButton (click)="apply()">Appliquer</button>
      </div>
    </gestio-drawer-content>
  `,
})
class InvoiceFiltersDrawer {
  protected readonly ref = inject<GestioDrawerRef<InvoiceFilters>>(GestioDrawerRef);
  private readonly data = inject<InvoiceFilters>(GESTIO_DRAWER_DATA);
  protected readonly status = signal<InvoiceFilters['status'] | null>(this.data.status);
  protected readonly onlyMine = signal(this.data.onlyMine);
  protected readonly statuses: { value: InvoiceFilters['status']; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'paid', label: 'Payées' },
    { value: 'pending', label: 'En attente' },
    { value: 'late', label: 'En retard' },
  ];

  protected apply(): void {
    this.ref.close({ status: this.status() ?? 'all', onlyMine: this.onlyMine() });
  }
}

@Component({
  selector: 'sc-drawer-page',
  imports: [
    GESTIO_DRAWER_IMPORTS,
    GestioBadge,
    GestioButton,
    GestioCheckbox,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Panneau latéral" eyebrow="Composants">
      <code>gestio-drawer</code> ouvre un panneau modal contre un bord de l’écran (« drawer », «
      sheet ») : rôle <code>dialog</code> nommé par son titre, piège et restauration du focus,
      fermeture par <kbd>Échap</kbd> et par le fond, défilement de la page bloqué. Même socle que la
      modale (<code>&#64;angular/cdk/dialog</code>).
    </sc-page-header>

    <sc-example
      heading="Détail d’une facture"
      description="Usage déclaratif avec [(open)] : en-tête, corps défilant et pied d’actions."
      [code]="detailCode"
    >
      <button gestioButton (click)="detailOpen.set(true)">Voir la facture F-2024-0042</button>
      <gestio-drawer
        [(open)]="detailOpen"
        heading="Facture F-2024-0042"
        description="Atelier Moreau SARL — émise le 12 mars"
      >
        <gestio-badge gestioDrawerHeader variant="warning">En attente de règlement</gestio-badge>
        <dl class="sc-drawer-details">
          <dt>Montant HT</dt>
          <dd>1 041,67 €</dd>
          <dt>TVA (20 %)</dt>
          <dd>208,33 €</dd>
          <dt>Montant TTC</dt>
          <dd><strong>1 250,00 €</strong></dd>
          <dt>Échéance</dt>
          <dd>11 avril (dans 9 jours)</dd>
          <dt>Contact</dt>
          <dd>Claire Moreau — claire.moreau&#64;atelier-moreau.fr</dd>
        </dl>
        <div gestioDrawerFooter>
          <button gestioButton variant="outline" (click)="detailOpen.set(false)">Fermer</button>
          <button gestioButton (click)="markPaid()">Marquer comme payée</button>
        </div>
      </gestio-drawer>
      <p class="sc-result" aria-live="polite">
        Statut : <strong>{{ paid() ? 'payée' : 'en attente' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Positions, tailles et fermeture"
      description="start et end suivent le sens de lecture ; bottom ouvre une feuille en bas de l’écran."
      [code]="positionCode"
      stacked
    >
      <div class="sc-row">
        <gestio-checkbox label="Fermer au clic sur le fond" [(checked)]="closeOnBackdrop" />
      </div>
      <div class="sc-row">
        @for (size of sizes; track size) {
          <button
            gestioButton
            size="sm"
            [variant]="demoSize() === size ? 'primary' : 'outline'"
            [attr.aria-pressed]="demoSize() === size"
            (click)="demoSize.set(size)"
          >
            Taille {{ size }}
          </button>
        }
      </div>
      <div class="sc-row">
        @for (position of positions; track position.value) {
          <button gestioButton variant="secondary" (click)="openDemo(position.value)">
            {{ position.label }}
          </button>
        }
      </div>
      <gestio-drawer
        [(open)]="demoOpen"
        [position]="demoPosition()"
        [size]="demoSize()"
        [closeOnBackdropClick]="closeOnBackdrop()"
        [heading]="'Panneau ' + demoPosition() + ' (' + demoSize() + ')'"
      >
        <p style="margin: 0">
          Le focus est piégé dans le panneau et sera rendu au bouton d’ouverture à la fermeture.
        </p>
        <div gestioDrawerFooter>
          <button gestioButton (click)="demoOpen.set(false)">Compris</button>
        </div>
      </gestio-drawer>
    </sc-example>

    <sc-example
      heading="Ouverture par le service"
      description="GestioDrawerService.open() affiche un composant et retourne un résultat, comme la modale."
      [code]="serviceCode"
    >
      <button gestioButton variant="outline" (click)="openFilters()">Filtres</button>
      <p class="sc-result" aria-live="polite">
        Filtres : <strong>{{ filtersSummary() }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-drawer" [rows]="api" />
      <sc-api-table caption="Options de GestioDrawerConfig (service)" [rows]="configApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Le contenu n’est rendu que lorsque le panneau est ouvert. Importez
          <code>GESTIO_DRAWER_IMPORTS</code> pour la zone <code>[gestioDrawerFooter]</code>. Avec le
          service, utilisez <code>&lt;gestio-drawer-content heading="…"&gt;</code> dans le composant
          ouvert (ou passez <code>ariaLabel</code>). Le rayon du bord intérieur se règle avec
          <code>--gestio-drawer-radius</code>.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-drawer-details {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--gestio-space-2) var(--gestio-space-4);
      margin: 0;

      dt {
        color: var(--gestio-color-text-muted);
      }

      dd {
        margin: 0;
      }
    }
  `,
})
export class DrawerPage {
  private readonly drawers = inject(GestioDrawerService);

  protected readonly detailOpen = signal(false);
  protected readonly paid = signal(false);

  protected readonly demoOpen = signal(false);
  protected readonly demoPosition = signal<GestioDrawerPosition>('end');
  protected readonly demoSize = signal<GestioDrawerSize>('md');
  protected readonly closeOnBackdrop = signal(true);
  protected readonly sizes: GestioDrawerSize[] = ['sm', 'md', 'lg'];
  protected readonly positions: { value: GestioDrawerPosition; label: string }[] = [
    { value: 'start', label: 'Ouvrir au début (start)' },
    { value: 'end', label: 'Ouvrir à la fin (end)' },
    { value: 'bottom', label: 'Ouvrir en bas (bottom)' },
  ];

  private readonly filters = signal<InvoiceFilters>({ status: 'all', onlyMine: false });
  protected readonly filtersSummary = signal('toutes les factures');

  protected markPaid(): void {
    this.paid.set(true);
    this.detailOpen.set(false);
  }

  protected openDemo(position: GestioDrawerPosition): void {
    this.demoPosition.set(position);
    this.demoOpen.set(true);
  }

  protected openFilters(): void {
    this.drawers
      .open<InvoiceFilters, InvoiceFilters>(InvoiceFiltersDrawer, {
        data: this.filters(),
        position: 'start',
        size: 'sm',
      })
      .closed.subscribe((result) => {
        if (!result) return;
        this.filters.set(result);
        const labels = { all: 'toutes', paid: 'payées', pending: 'en attente', late: 'en retard' };
        this.filtersSummary.set(
          `${labels[result.status]}${result.onlyMine ? ', mes dossiers uniquement' : ''}`,
        );
      });
  }

  protected readonly detailCode = `<button gestioButton (click)="detailOpen.set(true)">Voir la facture</button>

<gestio-drawer
  [(open)]="detailOpen"
  heading="Facture F-2024-0042"
  description="Atelier Moreau SARL — émise le 12 mars"
>
  <gestio-badge gestioDrawerHeader variant="warning">En attente de règlement</gestio-badge>
  <dl>…</dl>
  <div gestioDrawerFooter>
    <button gestioButton variant="outline" (click)="detailOpen.set(false)">Fermer</button>
    <button gestioButton (click)="markPaid()">Marquer comme payée</button>
  </div>
</gestio-drawer>`;

  protected readonly positionCode = `<gestio-drawer
  [(open)]="open"
  position="bottom"
  size="lg"
  [closeOnBackdropClick]="false"
  heading="Panneau"
>…</gestio-drawer>`;

  protected readonly serviceCode = `@Component({
  imports: [GESTIO_DRAWER_IMPORTS, GestioButton],
  template: \`
    <gestio-drawer-content heading="Filtrer les factures">
      …
      <div gestioDrawerFooter>
        <button gestioButton variant="outline" (click)="ref.close()">Annuler</button>
        <button gestioButton (click)="apply()">Appliquer</button>
      </div>
    </gestio-drawer-content>
  \`,
})
class InvoiceFiltersDrawer {
  ref = inject<GestioDrawerRef<InvoiceFilters>>(GestioDrawerRef);
  data = inject<InvoiceFilters>(GESTIO_DRAWER_DATA);
  apply() { this.ref.close({ … }); }
}

// Appelant
this.drawers
  .open<InvoiceFilters, InvoiceFilters>(InvoiceFiltersDrawer, { data: filters, position: 'start', size: 'sm' })
  .closed.subscribe((result) => { if (result) this.filters.set(result); });`;

  protected readonly api: ApiRow[] = [
    {
      name: 'open',
      type: 'boolean (model)',
      default: 'false',
      description: 'Ouverture, [(open)].',
    },
    {
      name: 'position',
      type: `'end' | 'start' | 'bottom'`,
      default: `'end'`,
      description: 'Bord d’ouverture (start/end suivent le sens de lecture).',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Largeur 320/420/640 px (côtés) ou hauteur max. 40/60/85 % (bas).',
    },
    { name: 'heading', type: 'string', description: 'Titre (obligatoire), nom accessible.' },
    { name: 'description', type: 'string', description: 'Description (aria-describedby).' },
    { name: 'showClose', type: 'boolean', default: 'true', description: 'Bouton de fermeture.' },
    {
      name: 'closeOnEscape',
      type: 'boolean',
      default: 'true',
      description: 'Fermeture par Échap.',
    },
    {
      name: 'closeOnBackdropClick',
      type: 'boolean',
      default: 'true',
      description: 'Fermeture au clic sur le fond.',
    },
    {
      name: 'restoreFocus',
      type: 'boolean',
      default: 'true',
      description: 'Rend le focus au déclencheur.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioDrawerLabels>',
      default: '{}',
      description: 'Libellé du bouton de fermeture (« Fermer le panneau »).',
    },
  ];

  protected readonly configApi: ApiRow[] = [
    { name: 'data', type: 'D', description: 'Données injectées via GESTIO_DRAWER_DATA.' },
    {
      name: 'position, size',
      type: 'GestioDrawerPosition, GestioDrawerSize',
      default: `'end', 'md'`,
      description: 'Comme les entrées du composant.',
    },
    {
      name: 'closeOnEscape, closeOnBackdropClick',
      type: 'boolean',
      default: 'true',
      description: 'Options de fermeture.',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      description: 'Nom accessible si <gestio-drawer-content> n’est pas utilisé.',
    },
    {
      name: 'autoFocus',
      type: `'first-tabbable' | 'dialog' | 'first-heading' | string`,
      default: `'first-tabbable'`,
      description: 'Cible du focus initial.',
    },
    {
      name: 'restoreFocus',
      type: 'boolean',
      default: 'true',
      description: 'Rend le focus au déclencheur.',
    },
    {
      name: 'id, panelClass, injector, viewContainerRef',
      type: '…',
      description: 'Identifiant, classes du panneau, contexte d’injection.',
    },
  ];
}
