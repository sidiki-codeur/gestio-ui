import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioAvatar, GestioAvatarStatus, gestioAvatarInitials } from './avatar';
import { GestioAvatarGroup } from './avatar-group';

@Component({
  imports: [GestioAvatar, GestioAvatarGroup],
  template: `
    <gestio-avatar
      id="single"
      [name]="name()"
      [src]="src()"
      [status]="status()"
      size="lg"
      shape="square"
    />
    <gestio-avatar id="anonymous" />
    <gestio-avatar-group [max]="max()" [total]="total()" size="sm" ariaLabel="Équipe projet">
      @for (member of team; track member) {
        <gestio-avatar [name]="member" />
      }
    </gestio-avatar-group>
  `,
})
class Host {
  readonly name = signal<string | undefined>('Claire Moreau');
  readonly src = signal<string | null>(null);
  readonly status = signal<GestioAvatarStatus | undefined>(undefined);
  readonly max = signal<number | undefined>(3);
  readonly total = signal<number | undefined>(undefined);
  readonly team = [
    'Claire Moreau',
    'Jean-Pierre Martin',
    'Inès Benali',
    'Hugo Lefèvre',
    'Zoé Petit',
  ];
}

describe('gestioAvatarInitials', () => {
  it('calcule les initiales du premier et du dernier mot', () => {
    expect(gestioAvatarInitials('Claire Moreau')).toBe('CM');
    expect(gestioAvatarInitials('Jean-Pierre Martin')).toBe('JM');
    expect(gestioAvatarInitials('  élodie  ')).toBe('É');
    expect(gestioAvatarInitials('Atelier Moreau SARL')).toBe('AS');
    expect(gestioAvatarInitials('')).toBe('');
    expect(gestioAvatarInitials(undefined)).toBe('');
  });
});

describe('GestioAvatar', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const single = element.querySelector('#single') as HTMLElement;
    return { fixture, host: fixture.componentInstance, element, single };
  }

  it('affiche les initiales avec un nom accessible et applique taille et forme', async () => {
    const { single } = await setup();
    const initials = single.querySelector('[role="img"]')!;
    expect(initials.getAttribute('aria-label')).toBe('Claire Moreau');
    expect(initials.textContent?.trim()).toBe('CM');
    expect(single.classList).toContain('gestio-avatar--lg');
    expect(single.classList).toContain('gestio-avatar--square');
  });

  it('choisit une teinte déterministe à partir du nom', async () => {
    const { fixture, host, single } = await setup();
    const tone = () =>
      Array.from(single.classList).find((c) =>
        /--(primary|info|success|warning|danger|neutral)$/.test(c),
      );
    const first = tone();
    expect(first).toBeDefined();
    host.name.set('Jean-Pierre Martin');
    await fixture.whenStable();
    host.name.set('Claire Moreau');
    await fixture.whenStable();
    expect(tone()).toBe(first);
  });

  it('affiche l’image avec alt = nom et revient aux initiales en cas d’erreur', async () => {
    const { fixture, host, single } = await setup();
    host.src.set('https://exemple.test/claire.jpg');
    await fixture.whenStable();
    const img = single.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('Claire Moreau');
    expect(img.getAttribute('src')).toBe('https://exemple.test/claire.jpg');

    img.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(single.querySelector('img')).toBeNull();
    expect(single.querySelector('[role="img"]')?.textContent?.trim()).toBe('CM');

    // Une nouvelle URL est retentée.
    host.src.set('https://exemple.test/claire-2.jpg');
    await fixture.whenStable();
    expect(single.querySelector('img')).not.toBeNull();
  });

  it('affiche une icône : nommée avec un nom, décorative sans nom', async () => {
    const { fixture, host, element, single } = await setup();
    const anonymous = element.querySelector('#anonymous')!;
    const icon = anonymous.querySelector('svg')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('role')).toBeNull();

    host.name.set('…');
    await fixture.whenStable();
    const named = single.querySelector('svg')!;
    expect(named.getAttribute('role')).toBe('img');
    expect(named.getAttribute('aria-label')).toBe('…');
  });

  it('expose le statut par une pastille et un texte accessible', async () => {
    const { fixture, host, single } = await setup();
    expect(single.querySelector('.gestio-avatar__status')).toBeNull();
    host.status.set('busy');
    await fixture.whenStable();
    const dot = single.querySelector('.gestio-avatar__status')!;
    expect(dot.classList).toContain('gestio-avatar__status--busy');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(single.querySelector('.gestio-avatar__sr-only')?.textContent).toBe('Occupé');
  });
});

describe('GestioAvatarGroup', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const group = (fixture.nativeElement as HTMLElement).querySelector(
      'gestio-avatar-group',
    ) as HTMLElement;
    const avatars = Array.from(group.querySelectorAll('gestio-avatar')) as HTMLElement[];
    return { fixture, host: fixture.componentInstance, group, avatars };
  }

  it('masque les avatars au-delà de max et affiche « +N » avec un libellé accessible', async () => {
    const { group, avatars } = await setup();
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Équipe projet');
    expect(avatars.map((a) => a.hidden)).toEqual([false, false, false, true, true]);
    const more = group.querySelector('.gestio-avatar-group__more')!;
    expect(more.querySelector('[aria-hidden="true"]')?.textContent).toBe('+2');
    expect(more.textContent).toContain('Et 2 autres personnes');
  });

  it('impose sa taille et tient compte de total', async () => {
    const { fixture, host, group, avatars } = await setup();
    expect(avatars[0].classList).toContain('gestio-avatar--sm');
    expect(avatars[0].classList).toContain('gestio-avatar--grouped');
    host.total.set(42);
    await fixture.whenStable();
    expect(
      group.querySelector('.gestio-avatar-group__more [aria-hidden="true"]')?.textContent,
    ).toBe('+39');
    host.total.set(undefined);
    host.max.set(4);
    await fixture.whenStable();
    expect(group.querySelector('.gestio-avatar-group__more')?.textContent).toContain(
      'Et 1 autre personne',
    );
    host.max.set(undefined);
    await fixture.whenStable();
    expect(group.querySelector('.gestio-avatar-group__more')).toBeNull();
    expect(avatars.every((a) => !a.hidden)).toBe(true);
  });
});
