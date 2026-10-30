import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GESTIO_NAVMENU_IMPORTS, GestioNavbar } from '@gestiolabs336/ui/navigation';
import { GestioRailLayout, GestioSidebarLayout, GestioTopnavLayout } from './nav-layouts';
import { GestioBreakpoints } from './responsive';

function fakeBreakpoints(width: number) {
  return {
    sm: signal(width >= 640),
    md: signal(width >= 768),
    lg: signal(width >= 1024),
    xl: signal(width >= 1280),
  };
}

@Component({
  imports: [GestioSidebarLayout, GestioNavbar, GESTIO_NAVMENU_IMPORTS],
  template: `
    <gestio-sidebar-layout [(collapsed)]="collapsed" [(menuOpen)]="open">
      <a gestioLayoutBrand href="/" class="brand">Mon ERP</a>
      <nav gestioNavmenu gestioLayoutNav aria-label="Navigation principale">
        <a gestioNavItem href="/accueil">Accueil</a>
        <a gestioNavItem href="/projets" aria-current="page">Projets</a>
      </nav>
      <p gestioLayoutSidebarFooter class="side-footer">v1.0</p>
      @if (withNavbar()) {
        <gestio-navbar gestioLayoutHeader><span>Barre</span></gestio-navbar>
      }
      <h1>Contenu</h1>
      <footer gestioLayoutFooter class="page-footer">Pied</footer>
    </gestio-sidebar-layout>
  `,
})
class SidebarHost {
  readonly collapsed = signal(false);
  readonly open = signal(false);
  readonly withNavbar = signal(true);
}

@Component({
  imports: [GestioRailLayout, GESTIO_NAVMENU_IMPORTS],
  template: `
    <gestio-rail-layout>
      <nav gestioNavmenu gestioLayoutNav aria-label="Navigation principale">
        <a gestioNavItem href="/accueil">Accueil</a>
      </nav>
      <h1>Contenu</h1>
    </gestio-rail-layout>
  `,
})
class RailHost {}

async function create<T>(type: new () => T, width: number) {
  TestBed.configureTestingModule({
    providers: [{ provide: GestioBreakpoints, useValue: fakeBreakpoints(width) }],
  });
  const fixture = TestBed.createComponent(type);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('GestioSidebarLayout', () => {
  it('grand écran : zones, repères et menu réductible en rail', async () => {
    const { fixture, el } = await create(SidebarHost, 1280);
    const layout = el.querySelector('gestio-sidebar-layout')!;
    const side = el.querySelector('aside')!;
    expect(side.getAttribute('aria-label')).toBe('Menu de navigation');
    expect(side.querySelector('.gestio-nav-layout__brand .brand')).not.toBeNull();
    expect(side.querySelector('.gestio-nav-layout__nav nav')).not.toBeNull();
    expect(side.querySelector('.gestio-nav-layout__side-footer .side-footer')).not.toBeNull();
    expect(el.querySelector('header gestio-navbar')).not.toBeNull();
    expect(el.querySelector('main h1')).not.toBeNull();
    expect(el.querySelector('.gestio-nav-layout__body > .page-footer')).not.toBeNull();
    expect(layout.classList).toContain('gestio-nav-layout--bp-lg');
    // Pas de bouton de tiroir sur grand écran.
    expect(el.querySelector('header button')).toBeNull();

    const nav = el.querySelector('nav')!;
    expect(nav.classList).toContain('gestio-navmenu--vertical');
    expect(nav.classList).not.toContain('gestio-navmenu--collapsed');

    const collapse = el.querySelector<HTMLButtonElement>('.gestio-nav-layout__collapse')!;
    expect(collapse.textContent).toContain('Réduire le menu');
    collapse.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.collapsed()).toBe(true);
    expect(layout.classList).toContain('gestio-nav-layout--collapsed');
    expect(nav.classList).toContain('gestio-navmenu--collapsed');
    expect(collapse.getAttribute('aria-label')).toBe('Déplier le menu');
  });

  it('petit écran : la navbar ouvre le tiroir ; focus, contenu inerte, Échap', async () => {
    const { fixture, el } = await create(SidebarHost, 500);
    fixture.componentInstance.collapsed.set(true);
    await fixture.whenStable();
    const layout = el.querySelector('gestio-sidebar-layout')!;
    const side = el.querySelector('aside')!;
    const main = el.querySelector('main')!;
    // Le rail ne s'applique pas au tiroir.
    expect(el.querySelector('nav')!.classList).not.toContain('gestio-navmenu--collapsed');
    expect(el.querySelector('.gestio-nav-layout__collapse')).toBeNull();

    const buttons = el.querySelectorAll<HTMLButtonElement>('header button[aria-controls]');
    expect(buttons.length).toBe(1);
    const toggle = buttons[0];
    expect(toggle.closest('gestio-navbar')).not.toBeNull();
    expect(toggle.getAttribute('aria-controls')).toBe(side.id);
    expect(toggle.textContent).toContain('Menu de navigation');

    toggle.focus();
    toggle.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    expect(layout.classList).toContain('gestio-nav-layout--drawer-open');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(main.inert).toBe(true);
    expect(document.activeElement?.textContent?.trim()).toBe('Projets');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(layout.classList).not.toContain('gestio-nav-layout--drawer-open');
    expect(main.inert).toBe(false);
    expect(document.activeElement).toBe(toggle);

    // Un lien du tiroir le ferme.
    toggle.click();
    await fixture.whenStable();
    const link = side.querySelector<HTMLAnchorElement>('a[href="/accueil"]')!;
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('sans navbar : le layout affiche son propre bouton de tiroir', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: GestioBreakpoints, useValue: fakeBreakpoints(500) }],
    });
    const fixture = TestBed.createComponent(SidebarHost);
    fixture.componentInstance.withNavbar.set(false);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      '.gestio-nav-layout__toggle',
    );
    expect(toggle).not.toBeNull();
    expect(toggle!.getAttribute('aria-expanded')).toBe('false');
  });

  it('le lien d’évitement place le focus sur le contenu sans naviguer', async () => {
    const { el } = await create(SidebarHost, 1280);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('.gestio-nav-layout__skip')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('main'));
  });
});

describe('GestioRailLayout', () => {
  it('rail sur grand écran, menu complet dans le tiroir', async () => {
    const desktop = await create(RailHost, 1280);
    expect(desktop.el.querySelector('nav')!.classList).toContain('gestio-navmenu--collapsed');
    expect(desktop.el.querySelector('.gestio-nav-layout__collapse')).toBeNull();
    TestBed.resetTestingModule();

    const mobile = await create(RailHost, 500);
    expect(mobile.el.querySelector('nav')!.classList).not.toContain('gestio-navmenu--collapsed');
    expect(mobile.el.querySelector('.gestio-nav-layout__toggle')).not.toBeNull();
  });
});

describe('GestioTopnavLayout', () => {
  it('en-tête collant, contenu principal et lien d’évitement', async () => {
    const fixture = TestBed.createComponent(GestioTopnavLayout);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const main = el.querySelector('main')!;
    expect(el.querySelector('header')!.classList).toContain('is-sticky');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('.gestio-nav-layout__skip')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(main);

    fixture.componentRef.setInput('sticky', false);
    await fixture.whenStable();
    expect(el.querySelector('header')!.classList).not.toContain('is-sticky');
  });
});
