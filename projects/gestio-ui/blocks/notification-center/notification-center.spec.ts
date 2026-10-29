import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GestioNotification,
  GestioNotificationCenter,
  GestioNotificationFilter,
} from './notification-center';

const NOW = new Date(2026, 9, 28, 14, 0);

function build(): GestioNotification[] {
  return [
    {
      id: 1,
      title: 'Facture F-2026-0142 payée',
      body: 'Atelier Moreau a réglé 1 250,00 €.',
      date: new Date(2026, 9, 28, 13, 55),
      read: false,
      tone: 'success',
    },
    {
      id: 2,
      title: 'Stock bas : cartouches A4',
      date: new Date(2026, 9, 28, 9, 0),
      read: false,
      tone: 'warning',
      href: '#stock',
    },
    {
      id: 3,
      title: 'Nouveau client',
      date: new Date(2026, 9, 26, 10, 0),
      read: false,
    },
    {
      id: 4,
      title: 'Export terminé',
      date: new Date(2026, 9, 20, 10, 0),
      read: true,
      tone: 'info',
    },
  ];
}

@Component({
  imports: [GestioNotificationCenter],
  template: `
    <button type="button" class="outside">Ailleurs</button>
    <gestio-notification-center
      [notifications]="notifications()"
      [now]="now"
      [loading]="loading()"
      [(open)]="open"
      [(filter)]="filter"
      (markRead)="onMarkRead($event)"
      (markAllRead)="onMarkAllRead()"
      (select)="selected.set($event)"
    />
  `,
})
class Host {
  readonly now = NOW;
  readonly notifications = signal<GestioNotification[]>(build());
  readonly loading = signal(false);
  readonly open = signal(false);
  readonly filter = signal<GestioNotificationFilter>('all');
  readonly selected = signal<GestioNotification | null>(null);
  readonly marked: (string | number)[] = [];
  allRead = 0;

  onMarkRead(item: GestioNotification): void {
    this.marked.push(item.id);
    this.notifications.update((list) =>
      list.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
  }

  onMarkAllRead(): void {
    this.allRead++;
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }
}

describe('GestioNotificationCenter', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector('.gestio-notification-center__trigger') as HTMLButtonElement;
    const settle = () => fixture.whenStable();
    const panel = () => document.querySelector('[role="dialog"]') as HTMLElement | null;
    const actions = () =>
      Array.from(document.querySelectorAll('.gestio-notification-center__action')) as HTMLElement[];
    const openPanel = async () => {
      trigger.click();
      await settle();
      await settle();
    };
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      trigger,
      settle,
      panel,
      actions,
      openPanel,
    };
  }

  afterEach(() => document.querySelector('.cdk-overlay-container')?.replaceChildren());

  it('nomme la cloche avec le nombre de non lues et affiche le badge', async () => {
    const { fixture, host, trigger } = await setup();
    expect(trigger.getAttribute('aria-label')).toBe('Notifications, 3 non lues');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    const badge = trigger.querySelector('.gestio-notification-center__badge')!;
    expect(badge.textContent?.trim()).toBe('3');
    expect(badge.getAttribute('aria-hidden')).toBe('true');

    host.notifications.update((list) => list.map((n) => ({ ...n, read: n.id !== 1 })));
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-label')).toBe('Notifications, 1 non lue');

    host.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-label')).toBe('Notifications');
    expect(trigger.querySelector('.gestio-notification-center__badge')).toBeNull();
  });

  it('ouvre un dialogue nommé, focalisé, relié à la cloche', async () => {
    const { host, trigger, panel, openPanel } = await setup();
    await openPanel();
    const dialog = panel()!;
    expect(host.open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    expect(title?.textContent?.trim()).toBe('Notifications');
    expect(document.activeElement).toBe(dialog);
  });

  it('groupe en « Aujourd’hui » et « Plus tôt » avec dates relatives', async () => {
    const { panel, openPanel } = await setup();
    await openPanel();
    const headings = Array.from(panel()!.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Aujourd’hui', 'Plus tôt']);
    const times = Array.from(panel()!.querySelectorAll('time'));
    expect(times[0].textContent?.trim()).toBe('il y a 5 minutes');
    expect(times[0].getAttribute('datetime')).toBe(new Date(2026, 9, 28, 13, 55).toISOString());
    expect(times[2].textContent?.trim()).toBe('avant-hier');
    const sections = panel()!.querySelectorAll('section');
    expect(sections[0].querySelectorAll('li')).toHaveLength(2);
    expect(sections[1].querySelectorAll('li')).toHaveLength(2);
  });

  it('signale les non lues aux lecteurs d’écran et rend un lien quand href est fourni', async () => {
    const { actions, openPanel } = await setup();
    await openPanel();
    const [first, second, , last] = actions();
    expect(first.tagName).toBe('BUTTON');
    expect(first.textContent).toContain('Non lue');
    expect(second.tagName).toBe('A');
    expect(second.getAttribute('href')).toBe('#stock');
    expect(last.textContent).not.toContain('Non lue');
  });

  it('filtre les non lues (aria-pressed) et affiche un état vide', async () => {
    const { host, settle, panel, actions, openPanel } = await setup();
    await openPanel();
    const filters = Array.from(
      panel()!.querySelectorAll('.gestio-notification-center__filter'),
    ) as HTMLButtonElement[];
    expect(filters[0].getAttribute('aria-pressed')).toBe('true');
    filters[1].click();
    await settle();
    expect(host.filter()).toBe('unread');
    expect(filters[1].getAttribute('aria-pressed')).toBe('true');
    expect(actions()).toHaveLength(3);

    host.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    await settle();
    expect(panel()!.querySelector('gestio-empty-state')?.textContent).toContain(
      'Aucune notification non lue',
    );
  });

  it('marque une notification comme lue en gardant le focus dans le panneau', async () => {
    const { host, settle, panel, actions, openPanel } = await setup();
    await openPanel();
    const mark = panel()!.querySelector('.gestio-notification-center__mark') as HTMLButtonElement;
    expect(mark.getAttribute('aria-label')).toBe('Marquer « Facture F-2026-0142 payée » comme lue');
    mark.focus();
    mark.click();
    await settle();
    expect(host.marked).toEqual([1]);
    expect(document.activeElement).toBe(actions()[0]);
  });

  it('marque tout comme lu', async () => {
    const { host, settle, panel, openPanel } = await setup();
    await openPanel();
    const markAll = Array.from(panel()!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tout marquer comme lu'),
    )!;
    markAll.click();
    await settle();
    expect(host.allRead).toBe(1);
    expect(document.activeElement).toBe(panel());
    expect(panel()!.querySelector('.gestio-notification-center__mark')).toBeNull();
  });

  it('émet select (et markRead pour une non lue), ferme et rend le focus', async () => {
    const { host, trigger, settle, panel, actions, openPanel } = await setup();
    await openPanel();
    actions()[0].focus();
    actions()[0].click();
    await settle();
    expect(host.selected()?.id).toBe(1);
    expect(host.marked).toEqual([1]);
    expect(host.open()).toBe(false);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('ferme avec Échap et rend le focus à la cloche', async () => {
    const { host, trigger, settle, panel, openPanel } = await setup();
    await openPanel();
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
      } as KeyboardEventInit),
    );
    await settle();
    expect(host.open()).toBe(false);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('piège le focus dans le panneau', async () => {
    const { panel, openPanel } = await setup();
    await openPanel();
    expect(panel()!.parentElement?.querySelectorAll('.cdk-focus-trap-anchor')).toHaveLength(2);
  });

  it('affiche un indicateur de chargement', async () => {
    const { host, settle, panel, openPanel } = await setup();
    host.loading.set(true);
    await openPanel();
    await settle();
    const body = panel()!.querySelector('.gestio-notification-center__body')!;
    expect(body.getAttribute('aria-busy')).toBe('true');
    expect(body.querySelector('gestio-spinner')?.textContent).toContain(
      'Chargement des notifications',
    );
    expect(body.querySelector('li')).toBeNull();
  });
});
