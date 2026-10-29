import { Component, signal } from '@angular/core';
import { GestioCommand, GestioCommandPalette } from '@gestiolabs336/ui/blocks/command-palette';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-command-palette-page',
  imports: [GestioCommandPalette, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Palette de commandes" eyebrow="Blocs">
      <code>gestio-command-palette</code> ouvre une recherche de commandes au clavier
      (<kbd>Ctrl</kbd>+<kbd>K</kbd> ou <kbd>⌘</kbd>+<kbd>K</kbd>) : recherche floue insensible aux
      accents, groupes, navigation aux flèches et exécution avec <kbd>Entrée</kbd>. Le champ suit le
      motif ARIA « combobox » relié à une liste par <code>aria-activedescendant</code>.
    </sc-page-header>

    <sc-example
      heading="Commandes d’un logiciel de gestion"
      description="Ouvrez avec le bouton ou Ctrl+K, puis tapez « fact », « parametres » ou « devis »."
      [code]="basicCode"
    >
      <button gestioButton variant="outline" (click)="open.set(true)">
        Rechercher une commande
        <kbd class="sc-kbd-hint" aria-hidden="true">Ctrl K</kbd>
      </button>
      <gestio-command-palette
        [(open)]="open"
        [commands]="commands"
        (run)="lastRun.set($event.label)"
      />
      <p class="sc-result" aria-live="polite">
        Dernière commande : <strong>{{ lastRun() ?? 'aucune' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Libellés et raccourci personnalisés"
      description="Raccourci global Alt+Maj+P, textes adaptés ; la palette reste ouverte après exécution."
      [code]="customCode"
    >
      <button gestioButton variant="secondary" (click)="quickOpen.set(true)">
        Actions rapides (Alt+Maj+P)
      </button>
      <gestio-command-palette
        [(open)]="quickOpen"
        [commands]="quickCommands"
        hotkey="alt+shift+p"
        [closeOnRun]="false"
        [labels]="quickLabels"
        (run)="addQuickRun($event)"
      />
      <p class="sc-result" aria-live="polite">
        Actions exécutées : <strong>{{ quickRun() ?? 'aucune' }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-command-palette" [rows]="api" />
      <sc-api-table caption="Champs de GestioCommand" [rows]="commandApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          La palette est une modale (<code>&#64;gestiolabs336/ui/dialog</code>) : le focus va au
          champ à l’ouverture et revient au déclencheur à la fermeture. Le raccourci global est
          écouté sur le document uniquement dans le navigateur ; <code>hotkey="mod+k"</code> accepte
          <kbd>Ctrl</kbd> ou <kbd>⌘</kbd>. Une seule palette par raccourci. Le champ
          <code>shortcut</code> d’une commande est purement indicatif : branchez vous-même le
          raccourci correspondant. La fonction <code>gestioFilterCommands()</code> expose la
          recherche pour d’autres usages.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-kbd-hint {
      margin-inline-start: var(--gestio-space-2);
      padding: 0 var(--gestio-space-1);
      border: var(--gestio-border-width) solid var(--gestio-color-border);
      border-radius: var(--gestio-radius-sm);
      color: var(--gestio-color-text-muted);
      font-family: var(--gestio-font-mono);
      font-size: var(--gestio-font-size-xs);
    }
  `,
})
export class CommandPalettePage {
  protected readonly open = signal(false);
  protected readonly lastRun = signal<string | null>(null);
  protected readonly quickOpen = signal(false);
  protected readonly quickRun = signal<string | null>(null);

  protected addQuickRun(command: GestioCommand): void {
    this.quickRun.update((list) => (list ? `${list}, ${command.label}` : command.label));
  }

  protected readonly commands: readonly GestioCommand[] = [
    {
      id: 'new-invoice',
      label: 'Créer une facture',
      group: 'Créer',
      shortcut: 'Ctrl+Alt+F',
      icon: '🧾',
    },
    {
      id: 'new-quote',
      label: 'Créer un devis',
      group: 'Créer',
      keywords: ['proposition', 'estimation'],
      icon: '📝',
    },
    {
      id: 'new-client',
      label: 'Ajouter un client',
      group: 'Créer',
      keywords: ['contact', 'société'],
      icon: '👤',
    },
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      group: 'Navigation',
      keywords: ['accueil'],
      icon: '📊',
    },
    { id: 'invoices', label: 'Factures', group: 'Navigation', icon: '📄' },
    { id: 'clients', label: 'Clients', group: 'Navigation', icon: '🏢' },
    {
      id: 'settings',
      label: 'Paramètres de l’entreprise',
      group: 'Navigation',
      keywords: ['réglages', 'configuration'],
      icon: '⚙️',
    },
    {
      id: 'export',
      label: 'Exporter la comptabilité (FEC)',
      group: 'Actions',
      keywords: ['expert-comptable'],
      disabled: true,
      icon: '⬇️',
    },
    {
      id: 'theme',
      label: 'Basculer le thème sombre',
      group: 'Actions',
      keywords: ['mode nuit', 'apparence'],
      icon: '🌓',
    },
    { id: 'logout', label: 'Se déconnecter', group: 'Compte', icon: '🚪' },
  ];

  protected readonly quickCommands: readonly GestioCommand[] = [
    { id: 'remind', label: 'Relancer les factures en retard', group: 'Facturation', shortcut: 'R' },
    { id: 'reconcile', label: 'Rapprocher les paiements reçus', group: 'Facturation' },
    {
      id: 'stock',
      label: 'Inventaire du stock',
      group: 'Stock',
      keywords: ['articles', 'quantités'],
    },
    { id: 'order', label: 'Commander chez un fournisseur', group: 'Stock' },
  ];

  protected readonly quickLabels = {
    dialog: 'Actions rapides',
    input: 'Rechercher une action',
    placeholder: 'Que voulez-vous faire ?',
    list: 'Actions',
    empty: 'Aucune action ne correspond à « {query} ».',
    results: '{count} actions trouvées',
    oneResult: '1 action trouvée',
    noResults: 'Aucune action trouvée',
  };

  protected readonly basicCode = `<button gestioButton variant="outline" (click)="open.set(true)">Rechercher une commande</button>

<gestio-command-palette [(open)]="open" [commands]="commands" (run)="execute($event)" />

// Composant
commands: readonly GestioCommand[] = [
  { id: 'new-invoice', label: 'Créer une facture', group: 'Créer', shortcut: 'Ctrl+Alt+F', icon: '🧾' },
  { id: 'new-quote', label: 'Créer un devis', group: 'Créer', keywords: ['proposition'] },
  { id: 'settings', label: 'Paramètres de l’entreprise', group: 'Navigation' },
  { id: 'export', label: 'Exporter la comptabilité (FEC)', group: 'Actions', disabled: true },
];

execute(command: GestioCommand) {
  switch (command.id) {
    case 'new-invoice': this.router.navigate(['/factures/nouvelle']); break;
    // …
  }
}`;

  protected readonly customCode = `<gestio-command-palette
  [(open)]="open"
  [commands]="commands"
  hotkey="alt+shift+p"
  [closeOnRun]="false"
  [labels]="{ dialog: 'Actions rapides', placeholder: 'Que voulez-vous faire ?', empty: 'Aucune action ne correspond à « {query} ».' }"
  (run)="execute($event)"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'open',
      type: 'boolean (model)',
      default: 'false',
      description: 'Ouverture, [(open)].',
    },
    {
      name: 'commands',
      type: 'readonly GestioCommand[]',
      default: '[]',
      description: 'Commandes proposées.',
    },
    {
      name: 'hotkey',
      type: 'string | null',
      default: `'mod+k'`,
      description:
        'Raccourci global (mod = Ctrl ou ⌘ ; ctrl, meta, alt, shift). null le désactive.',
    },
    { name: 'closeOnRun', type: 'boolean', default: 'true', description: 'Ferme après exécution.' },
    {
      name: 'labels',
      type: 'Partial<GestioCommandPaletteLabels>',
      default: '{}',
      description: 'Textes (dialogue, champ, état vide, annonces, aides du pied).',
    },
    { name: '(run)', type: 'GestioCommand', description: 'Commande choisie (clic ou Entrée).' },
  ];

  protected readonly commandApi: ApiRow[] = [
    { name: 'id', type: 'string', description: 'Identifiant unique.' },
    { name: 'label', type: 'string', description: 'Libellé affiché et recherché.' },
    {
      name: 'group',
      type: 'string',
      description: 'Groupe d’affichage (ordre de première apparition).',
    },
    {
      name: 'keywords',
      type: 'readonly string[]',
      description: 'Synonymes recherchés, non affichés.',
    },
    { name: 'shortcut', type: 'string', description: 'Raccourci affiché à titre indicatif.' },
    { name: 'icon', type: 'string', description: 'Caractère ou emoji décoratif.' },
    { name: 'disabled', type: 'boolean', description: 'Affichée mais non exécutable.' },
  ];
}
