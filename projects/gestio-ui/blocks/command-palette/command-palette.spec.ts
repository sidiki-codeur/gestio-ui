import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioCommandPalette } from './command-palette';
import { GestioCommand, gestioFilterCommands } from './command-search';

const COMMANDS: readonly GestioCommand[] = [
  { id: 'new-invoice', label: 'Créer une facture', group: 'Créer', shortcut: 'Ctrl+N', icon: '＋' },
  { id: 'new-quote', label: 'Créer un devis', group: 'Créer', keywords: ['proposition'] },
  { id: 'clients', label: 'Aller aux clients', group: 'Navigation' },
  { id: 'export', label: 'Exporter la comptabilité', group: 'Navigation', disabled: true },
  { id: 'settings', label: 'Paramètres de l’entreprise', group: 'Navigation' },
  { id: 'logout', label: 'Se déconnecter' },
];

@Component({
  imports: [GestioCommandPalette],
  template: `
    <button id="trigger" type="button">Ouvrir</button>
    <gestio-command-palette
      [(open)]="open"
      [commands]="commands"
      [hotkey]="hotkey()"
      [labels]="{ placeholder: 'Que voulez-vous faire ?' }"
      (run)="ran.set($event.id)"
    />
  `,
})
class Host {
  readonly open = signal(false);
  readonly hotkey = signal<string | null>('mod+k');
  readonly commands = COMMANDS;
  readonly ran = signal<string | null>(null);
}

async function settle(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

function container(): HTMLElement | null {
  return document.querySelector('.cdk-dialog-container');
}

function searchInput(): HTMLInputElement {
  return container()!.querySelector('input') as HTMLInputElement;
}

function options(): HTMLElement[] {
  return Array.from(container()!.querySelectorAll<HTMLElement>('[role="option"]'));
}

function key(target: EventTarget, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

async function type(value: string): Promise<void> {
  const input = searchInput();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
}

describe('gestioFilterCommands', () => {
  it('retourne toutes les commandes pour une recherche vide', () => {
    expect(gestioFilterCommands(COMMANDS, '  ').map((c) => c.id)).toEqual(
      COMMANDS.map((c) => c.id),
    );
  });

  it('ignore les accents et la casse, et trie par pertinence', () => {
    expect(gestioFilterCommands(COMMANDS, 'PARAMETRES').map((c) => c.id)).toEqual(['settings']);
    expect(gestioFilterCommands(COMMANDS, 'creer').map((c) => c.id)).toEqual([
      'new-invoice',
      'new-quote',
    ]);
  });

  it('cherche les mots-clés, le groupe et les lettres dans l’ordre', () => {
    expect(gestioFilterCommands(COMMANDS, 'proposition').map((c) => c.id)).toEqual(['new-quote']);
    expect(gestioFilterCommands(COMMANDS, 'navigation').length).toBe(3);
    expect(gestioFilterCommands(COMMANDS, 'cfac').map((c) => c.id)).toEqual(['new-invoice']);
    expect(gestioFilterCommands(COMMANDS, 'devis creer').map((c) => c.id)).toEqual(['new-quote']);
    expect(gestioFilterCommands(COMMANDS, 'zzz')).toEqual([]);
  });
});

describe('GestioCommandPalette', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance };
  }

  async function openPalette(fixture: { whenStable(): Promise<unknown> }, host: Host) {
    host.open.set(true);
    await fixture.whenStable();
    await settle();
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.replaceChildren());
  });

  it('ouvre un dialogue modal nommé avec un combobox focalisé', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);

    const dialog = container()!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Palette de commandes');

    const input = searchInput();
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('placeholder')).toBe('Que voulez-vous faire ?');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const list = document.getElementById(input.getAttribute('aria-controls')!)!;
    expect(list.getAttribute('role')).toBe('listbox');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('regroupe les commandes dans des groupes nommés', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);

    const groups = Array.from(container()!.querySelectorAll('[role="group"]'));
    expect(groups.length).toBe(2);
    const name = document.getElementById(groups[0].getAttribute('aria-labelledby')!);
    expect(name?.textContent?.trim()).toBe('Créer');
    expect(options().length).toBe(6);
    expect(options()[3].getAttribute('aria-disabled')).toBe('true');
  });

  it('navigue avec les flèches en sautant les commandes désactivées et en bouclant', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);
    const input = searchInput();

    for (let i = 0; i < 3; i++) key(input, { key: 'ArrowDown' });
    await settle();
    // Index 3 (Exporter) est désactivé : on passe directement à 4.
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[4].id);

    key(input, { key: 'ArrowDown' });
    key(input, { key: 'ArrowDown' });
    await settle();
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);

    key(input, { key: 'ArrowUp' });
    await settle();
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[5].id);
  });

  it('filtre, annonce les résultats et exécute avec Entrée', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);

    await type('devis');
    expect(options().map((o) => o.textContent?.trim())).toEqual(['Créer un devis']);
    expect(container()!.querySelector('[role="status"]')?.textContent).toContain(
      '1 commande trouvée',
    );

    key(searchInput(), { key: 'Enter' });
    await fixture.whenStable();
    await settle();
    expect(host.ran()).toBe('new-quote');
    expect(host.open()).toBe(false);
    expect(container()).toBeNull();
  });

  it('affiche un état vide sans listbox', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);

    await type('zzz');
    expect(container()!.querySelector('[role="listbox"]')).toBeNull();
    expect(searchInput().getAttribute('aria-expanded')).toBe('false');
    expect(searchInput().hasAttribute('aria-controls')).toBe(false);
    expect(container()!.textContent).toContain('Aucune commande ne correspond à « zzz ».');
  });

  it('exécute au clic, mais jamais une commande désactivée', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);

    options()[3].click();
    await settle();
    expect(host.ran()).toBeNull();
    expect(host.open()).toBe(true);

    options()[2].click();
    await fixture.whenStable();
    await settle();
    expect(host.ran()).toBe('clients');
  });

  it('se ferme avec Échap', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);

    key(searchInput(), { key: 'Escape' });
    await settle();
    expect(host.open()).toBe(false);
    expect(container()).toBeNull();
  });

  it('s’ouvre et se ferme avec le raccourci global Ctrl+K ou ⌘K', async () => {
    const { fixture, host } = await setup();

    const event = key(document, { key: 'k', ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    await fixture.whenStable();
    await settle();
    expect(host.open()).toBe(true);
    expect(container()).not.toBeNull();

    key(document, { key: 'K', metaKey: true });
    await fixture.whenStable();
    await settle();
    expect(host.open()).toBe(false);

    key(document, { key: 'k' });
    key(document, { key: 'k', ctrlKey: true, shiftKey: true });
    await settle();
    expect(host.open()).toBe(false);
  });

  it('ignore le raccourci quand hotkey est null', async () => {
    const { fixture, host } = await setup();
    host.hotkey.set(null);
    await fixture.whenStable();

    key(document, { key: 'k', ctrlKey: true });
    await settle();
    expect(host.open()).toBe(false);
  });

  it('réinitialise la recherche à chaque ouverture', async () => {
    const { fixture, host } = await setup();
    await openPalette(fixture, host);
    await type('devis');
    host.open.set(false);
    await fixture.whenStable();
    await settle();

    await openPalette(fixture, host);
    expect(searchInput().value).toBe('');
    expect(options().length).toBe(6);
  });
});
