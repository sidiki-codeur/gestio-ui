import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GESTIO_NAVMENU_IMPORTS, GestioNavmenuOrientation } from './navmenu';

@Component({
  imports: [GESTIO_NAVMENU_IMPORTS],
  template: `
    <nav
      gestioNavmenu
      aria-label="Navigation principale"
      [orientation]="orientation()"
      [collapsed]="collapsed()"
    >
      <a gestioNavItem href="/accueil" aria-current="page">
        <svg gestioNavIcon viewBox="0 0 20 20"></svg>
        Accueil
        <span gestioNavBadge class="badge">3</span>
      </a>
      <gestio-nav-group label="Gestion">
        <a gestioNavItem href="/projets">Projets</a>
        <gestio-nav-submenu label="Rapports">
          <a
            gestioNavItem
            href="/rapports/ventes"
            [attr.aria-current]="salesCurrent() ? 'page' : null"
            >Ventes</a
          >
          <a gestioNavItem href="/rapports/depenses">Dépenses</a>
        </gestio-nav-submenu>
      </gestio-nav-group>
      <button gestioNavItem>Aide</button>
    </nav>
    <p class="outside">Ailleurs</p>
  `,
})
class Host {
  readonly orientation = signal<GestioNavmenuOrientation | undefined>(undefined);
  readonly collapsed = signal<boolean | undefined>(undefined);
  readonly salesCurrent = signal(false);
}

describe('GestioNavmenu', () => {
  async function setup(init?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    init?.(fixture.componentInstance);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const nav = el.querySelector('nav')!;
    const trigger = el.querySelector<HTMLButtonElement>('.gestio-nav-submenu__trigger')!;
    const panel = el.querySelector<HTMLElement>('.gestio-nav-submenu__panel')!;
    return { fixture, host: fixture.componentInstance, el, nav, trigger, panel };
  }

  it('vertical par défaut : liens, icône, compteur et groupe nommé', async () => {
    const { el, nav } = await setup();
    expect(nav.classList).toContain('gestio-navmenu--vertical');
    const items = Array.from(el.querySelectorAll<HTMLElement>('.gestio-nav-item'));
    const [home, help] = [items[0], items.at(-1)!];
    expect(home.querySelector('.gestio-nav-item__icon svg')).not.toBeNull();
    expect(home.querySelector('.gestio-nav-item__label')!.textContent!.trim()).toBe('Accueil');
    expect(home.querySelector('.gestio-nav-item__badge .badge')).not.toBeNull();
    expect(home.hasAttribute('type')).toBe(false);
    expect(help.getAttribute('type')).toBe('button');

    const group = el.querySelector('gestio-nav-group')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(el.querySelector('#' + group.getAttribute('aria-labelledby'))!.textContent).toBe(
      'Gestion',
    );
  });

  it('sous-menu en accordéon : aria-expanded, aria-controls et panneau masqué', async () => {
    const { fixture, trigger, panel } = await setup();
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);
    expect(panel.classList).toContain('gestio-nav-submenu__panel--inline');

    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);

    // Échap ne ferme pas un accordéon.
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(false);
  });

  it('ouvre d’office le sous-menu qui contient la page courante', async () => {
    const { trigger, panel } = await setup((host) => host.salesCurrent.set(true));
    await new Promise((resolve) => setTimeout(resolve));
    expect(panel.hidden).toBe(false);
    expect(trigger.classList).toContain('has-active');
  });

  it('horizontal : liste déroulante fermée par Échap, clic extérieur ou lien', async () => {
    const { fixture, el, nav, trigger, panel } = await setup((host) =>
      host.orientation.set('horizontal'),
    );
    expect(nav.classList).toContain('gestio-navmenu--horizontal');
    expect(panel.classList).toContain('gestio-nav-submenu__panel--dropdown');

    trigger.click();
    await fixture.whenStable();
    const link = panel.querySelector<HTMLElement>('a')!;
    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await fixture.whenStable();
    el.querySelector<HTMLElement>('.outside')!.click();
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);

    trigger.click();
    await fixture.whenStable();
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
  });

  it('rail : icônes seules, bulle du libellé, sous-menu en panneau latéral', async () => {
    const { fixture, el, nav, trigger, panel } = await setup((host) => host.collapsed.set(true));
    expect(nav.classList).toContain('gestio-navmenu--collapsed');
    const home = el.querySelector<HTMLElement>('.gestio-nav-item')!;
    expect(home.classList).toContain('gestio-nav-item--icon-only');
    // Les liens d'un sous-menu gardent leur libellé.
    expect(panel.querySelector('.gestio-nav-item')!.classList).not.toContain(
      'gestio-nav-item--icon-only',
    );

    home.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    const label = home.querySelector<HTMLElement>('.gestio-nav-item__label')!;
    expect(label.classList).toContain('is-tip');
    home.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(label.classList).not.toContain('is-tip');

    trigger.click();
    await fixture.whenStable();
    expect(panel.classList).toContain('gestio-nav-submenu__panel--flyout');
    expect(panel.querySelector('.gestio-nav-submenu__title')!.textContent).toBe('Rapports');
    expect(panel.style.left).not.toBe('');
  });

  it('pas de rail ni de bulle en orientation horizontale', async () => {
    const { nav, el, fixture } = await setup((host) => {
      host.orientation.set('horizontal');
      host.collapsed.set(true);
    });
    expect(nav.classList).not.toContain('gestio-navmenu--collapsed');
    const home = el.querySelector<HTMLElement>('.gestio-nav-item')!;
    home.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(home.querySelector('.is-tip')).toBeNull();
  });
});
