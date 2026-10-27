import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GESTIO_ACTIVITY_FEED_IMPORTS,
  GestioActivityFeed,
  GestioActivityItem,
} from './activity-feed';

const NOW = new Date(2026, 9, 26, 14, 0, 0);

const ITEMS: GestioActivityItem[] = [
  {
    id: 1,
    actor: 'Claire Moreau',
    action: 'a validé la facture',
    target: 'F-2026-0142',
    date: new Date(2026, 9, 26, 13, 55),
    variant: 'success',
  },
  {
    id: 2,
    actor: 'Système',
    action: 'a envoyé une relance à',
    target: 'Atelier Moreau',
    date: new Date(2026, 9, 26, 9, 0).toISOString(),
    description: 'Deuxième relance automatique.',
  },
  {
    id: 3,
    actor: 'Hugo Martin',
    action: 'a créé le client',
    target: 'Boulangerie Petit',
    date: new Date(2026, 9, 25, 16, 30).getTime(),
  },
  {
    id: 4,
    actor: 'Hugo Martin',
    action: 'a archivé le devis',
    date: new Date(2026, 9, 12, 10, 0),
  },
];

@Component({
  imports: [GestioActivityFeed],
  template: `
    <gestio-activity-feed
      [items]="items()"
      [now]="now"
      [groupByDay]="grouped()"
      [hasMore]="hasMore()"
      (loadMore)="loads = loads + 1"
    />
  `,
})
class Host {
  readonly items = signal<GestioActivityItem[]>(ITEMS);
  readonly grouped = signal(false);
  readonly hasMore = signal(false);
  readonly now = NOW;
  loads = 0;
}

@Component({
  imports: [GESTIO_ACTIVITY_FEED_IMPORTS],
  template: `
    <gestio-activity-feed [items]="items" [now]="now">
      <ng-template gestioActivityItem let-item let-relative="relative">
        <span class="custom">{{ item.actor }} — {{ relative }}</span>
      </ng-template>
    </gestio-activity-feed>
  `,
})
class CustomHost {
  readonly items = ITEMS.slice(0, 1);
  readonly now = NOW;
}

describe('GestioActivityFeed', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('rend une liste ordonnée nommée avec des dates <time>', async () => {
    const { el } = await setup();
    const list = el.querySelector('ol')!;
    expect(list.getAttribute('aria-label')).toBe('Activité récente');
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toContain('Claire Moreau');
    expect(items[0].querySelector('.gestio-activity-feed__target')!.textContent).toBe(
      'F-2026-0142',
    );
    const time = items[0].querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe(new Date(2026, 9, 26, 13, 55).toISOString());
    expect(time.textContent!.trim()).toBe('il y a 5 minutes');
    expect(items[1].querySelector('time')!.textContent!.trim()).toBe('il y a 5 heures');
    expect(items[1].textContent).toContain('Deuxième relance automatique.');
    expect(items[2].querySelector('time')!.textContent!.trim()).toBe('il y a 21 heures');
    expect(items[3].querySelector('time')!.textContent!.trim()).toBe('il y a 2 semaines');
  });

  it('marque les repères selon la variante, masqués aux lecteurs d’écran', async () => {
    const { el } = await setup();
    const markers = el.querySelectorAll('.gestio-activity-feed__marker');
    expect(markers[0].classList).toContain('gestio-activity-feed__marker--success');
    expect(markers[1].classList).toContain('gestio-activity-feed__marker--neutral');
    expect(markers[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('regroupe les événements consécutifs par jour', async () => {
    const { fixture, host, el } = await setup();
    host.grouped.set(true);
    await fixture.whenStable();
    const days = [...el.querySelectorAll('.gestio-activity-feed__day')];
    expect(days.map((d) => d.textContent!.trim())).toEqual([
      'Aujourd’hui',
      'Hier',
      'lundi 12 octobre 2026',
    ]);
    const firstList = el.querySelector(`ol[aria-labelledby="${days[0].id}"]`)!;
    expect(firstList.querySelectorAll('li')).toHaveLength(2);
  });

  it('affiche un état vide', async () => {
    const { fixture, host, el } = await setup();
    host.items.set([]);
    await fixture.whenStable();
    expect(el.querySelector('ol')).toBeNull();
    expect(el.textContent).toContain('Aucune activité pour le moment.');
  });

  it('émet loadMore depuis le bouton « Voir plus »', async () => {
    const { fixture, host, el } = await setup();
    expect(el.querySelector('button')).toBeNull();
    host.hasMore.set(true);
    await fixture.whenStable();
    const button = el.querySelector('button')!;
    expect(button.textContent!.trim()).toBe('Voir plus');
    button.click();
    expect(host.loads).toBe(1);
  });

  it('utilise un modèle personnalisé', async () => {
    const fixture = TestBed.createComponent(CustomHost);
    await fixture.whenStable();
    const custom = fixture.nativeElement.querySelector('.custom') as HTMLElement;
    expect(custom.textContent).toBe('Claire Moreau — il y a 5 minutes');
    expect(fixture.nativeElement.querySelector('time')).not.toBeNull();
  });
});
