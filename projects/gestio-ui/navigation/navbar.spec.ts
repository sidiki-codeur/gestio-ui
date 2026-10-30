import { Component, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioBreakpoints } from '@gestiolabs336/ui/layout';
import { GestioNavbar, GestioNavbarTone } from './navbar';
import { GESTIO_NAVMENU_IMPORTS } from './navmenu';

/** Largeur d'écran simulée. */
function fakeBreakpoints(width: number): Record<string, WritableSignal<boolean>> {
  return {
    sm: signal(width >= 640),
    md: signal(width >= 768),
    lg: signal(width >= 1024),
    xl: signal(width >= 1280),
  };
}

@Component({
  imports: [GestioNavbar, GESTIO_NAVMENU_IMPORTS],
  template: `
    <gestio-navbar [tone]="tone()">
      <a gestioNavbarBrand href="/">Mon ERP</a>
      <nav gestioNavmenu gestioNavbarMenu aria-label="Navigation principale">
        <a gestioNavItem href="/projets">Projets</a>
        <a gestioNavItem href="/equipe">Équipe</a>
      </nav>
      <input class="search" aria-label="Rechercher" />
      <div gestioNavbarEnd class="end">Profil</div>
    </gestio-navbar>
  `,
})
class Host {
  readonly tone = signal<GestioNavbarTone>('surface');
}

describe('GestioNavbar', () => {
  async function setup(width: number) {
    const screen = fakeBreakpoints(width);
    TestBed.configureTestingModule({
      providers: [{ provide: GestioBreakpoints, useValue: screen }],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, screen, nav: el.querySelector('nav')! };
  }

  it('grand écran : zones projetées et menu horizontal sans bouton', async () => {
    const { el, nav } = await setup(1280);
    expect(el.querySelector('.gestio-navbar__brand a')).not.toBeNull();
    expect(el.querySelector('.gestio-navbar__menu nav')).not.toBeNull();
    expect(el.querySelector('.gestio-navbar__content .search')).not.toBeNull();
    expect(el.querySelector('.gestio-navbar__end .end')).not.toBeNull();
    expect(nav.classList).toContain('gestio-navmenu--horizontal');
    expect(el.querySelector('.gestio-navbar__icon-button')).toBeNull();
  });

  it('petit écran : menu replié derrière un bouton (aria-expanded, Échap)', async () => {
    const { fixture, el, nav, screen } = await setup(500);
    const toggle = el.querySelector<HTMLButtonElement>('.gestio-navbar__icon-button')!;
    const menu = el.querySelector<HTMLElement>('.gestio-navbar__menu')!;
    expect(nav.classList).toContain('gestio-navmenu--vertical');
    expect(menu.classList).toContain('is-compact');
    expect(toggle.getAttribute('aria-controls')).toBe(menu.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('Menu');

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(menu.classList).toContain('is-open');

    nav.querySelector<HTMLElement>('a')!.focus();
    nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(menu.classList).not.toContain('is-open');
    expect(document.activeElement).toBe(toggle);

    // Un lien activé ferme le panneau.
    toggle.click();
    await fixture.whenStable();
    const link = nav.querySelector<HTMLElement>('a')!;
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    await fixture.whenStable();
    expect(menu.classList).not.toContain('is-open');

    // Retour en grand écran : panneau refermé, menu en ligne.
    toggle.click();
    screen['md'].set(true);
    await fixture.whenStable();
    expect(menu.classList).not.toContain('is-compact');
    expect(el.querySelector('.gestio-navbar__icon-button')).toBeNull();
  });

  it('ton inverse : tokens du thème sombre pour la barre', async () => {
    const { fixture, el } = await setup(1280);
    const bar = el.querySelector('.gestio-navbar__bar')!;
    expect(bar.hasAttribute('data-gestio-theme')).toBe(false);
    fixture.componentInstance.tone.set('inverse');
    await fixture.whenStable();
    expect(bar.getAttribute('data-gestio-theme')).toBe('dark');
  });
});
