import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioAppShell } from './app-shell';
import { GestioContainer } from './container';
import { GestioGrid, GestioGridItem } from './grid';
import { GestioBreakpoints } from './responsive';
import { resolveResponsive } from './responsive-utils';
import { GestioStack } from './stack';

describe('resolveResponsive', () => {
  it('fait hériter chaque point de rupture du précédent', () => {
    expect(resolveResponsive({ base: 1, md: 3 }, 1)).toEqual({
      base: 1,
      sm: 1,
      md: 3,
      lg: 3,
      xl: 3,
    });
    expect(resolveResponsive(2, 1)).toEqual({ base: 2, sm: 2, md: 2, lg: 2, xl: 2 });
    expect(resolveResponsive({ lg: 'row' }, 'column')).toEqual({
      base: 'column',
      sm: 'column',
      md: 'column',
      lg: 'row',
      xl: 'row',
    });
  });
});

@Component({
  imports: [GestioContainer, GestioStack, GestioGrid, GestioGridItem],
  template: `
    <gestio-container size="md">
      <gestio-stack
        [direction]="{ base: 'column', md: 'row' }"
        [gap]="{ base: 2, lg: 6 }"
        justify="between"
      >
        <span>A</span><span>B</span>
      </gestio-stack>
      <gestio-grid [columns]="{ base: 1, sm: 2, xl: 4 }" [gap]="3">
        <div>1</div>
        <div [gestioGridSpan]="{ base: 'full', md: 2 }">2</div>
      </gestio-grid>
      <gestio-grid class="auto" minItemWidth="12rem"><div>x</div></gestio-grid>
    </gestio-container>
  `,
})
class LayoutHost {}

describe('Layouts', () => {
  it('container, stack et grid exposent leurs valeurs par point de rupture', async () => {
    const fixture = TestBed.createComponent(LayoutHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const style = (selector: string) => (el.querySelector(selector) as HTMLElement).style;

    expect(style('gestio-container').getPropertyValue('--_max')).toBe('48rem');

    const stack = style('gestio-stack');
    expect(stack.getPropertyValue('--_dir-base')).toBe('column');
    expect(stack.getPropertyValue('--_dir-sm')).toBe('column');
    expect(stack.getPropertyValue('--_dir-md')).toBe('row');
    expect(stack.getPropertyValue('--_dir-xl')).toBe('row');
    expect(stack.getPropertyValue('--_gap-md')).toBe('var(--gestio-space-2)');
    expect(stack.getPropertyValue('--_gap-lg')).toBe('var(--gestio-space-6)');
    expect(stack.getPropertyValue('--_justify')).toBe('space-between');

    const grid = style('gestio-grid');
    expect(
      ['base', 'sm', 'md', 'lg', 'xl'].map((bp) =>
        grid.getPropertyValue(`--gestio-grid-cols-${bp}`),
      ),
    ).toEqual(['1', '2', '2', '2', '4']);
    expect(grid.getPropertyValue('--gestio-grid-gap-xl')).toBe('var(--gestio-space-3)');

    const item = el.querySelector('[class~="gestio-grid-item"]') as HTMLElement;
    expect(item.style.getPropertyValue('--gestio-grid-span-base')).toBe('1 / -1');
    expect(item.style.getPropertyValue('--gestio-grid-span-md')).toBe('span 2');

    const auto = el.querySelector('gestio-grid.auto') as HTMLElement;
    expect(auto.classList).toContain('gestio-grid--auto');
    expect(auto.style.getPropertyValue('--gestio-grid-min')).toBe('12rem');
  });
});

@Component({
  imports: [GestioAppShell],
  template: `
    <gestio-app-shell [(sidebarOpen)]="open">
      <div gestioShellHeader>Gestio</div>
      <nav gestioShellSidebar aria-label="Navigation">
        <a href="#clients">Clients</a>
        <a href="#factures">Factures</a>
      </nav>
      <h1>Tableau de bord</h1>
    </gestio-app-shell>
  `,
})
class ShellHost {
  readonly open = signal(false);
}

describe('GestioAppShell', () => {
  const desktop = signal(false);

  beforeEach(() => {
    desktop.set(false);
    TestBed.configureTestingModule({
      providers: [{ provide: GestioBreakpoints, useValue: { lg: desktop } }],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(ShellHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    const toggle = el.querySelector('.gestio-shell__toggle') as HTMLButtonElement;
    const main = el.querySelector('main') as HTMLElement & { inert: boolean };
    const sidebar = el.querySelector('.gestio-shell__sidebar') as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, toggle, main, sidebar };
  }

  it('fournit les repères header/main, le lien d’évitement et le bouton de menu', async () => {
    const { el, toggle, main, sidebar } = await setup();
    expect(el.querySelector('header')).not.toBeNull();
    expect(
      (el.querySelector('.gestio-shell__skip') as HTMLAnchorElement).getAttribute('href'),
    ).toBe(`#${main.id}`);
    expect(toggle.getAttribute('aria-controls')).toBe(sidebar.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('Menu de navigation');
  });

  it('ouvre le tiroir, déplace le focus et rend le contenu inerte', async () => {
    const { fixture, host, el, toggle, main } = await setup();
    toggle.click();
    await fixture.whenStable();

    expect(host.open()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(main.inert).toBe(true);
    expect(el.querySelector('.gestio-shell__backdrop')).not.toBeNull();
    expect(document.activeElement?.textContent).toBe('Clients');
  });

  it('se ferme avec Échap et rend le focus au bouton de menu', async () => {
    const { fixture, host, toggle, main } = await setup();
    toggle.click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(host.open()).toBe(false);
    expect(main.inert).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('se ferme au clic sur un lien ou sur le fond', async () => {
    const { fixture, host, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();
    (el.querySelector('nav a') as HTMLAnchorElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(host.open()).toBe(false);

    toggle.click();
    await fixture.whenStable();
    (el.querySelector('.gestio-shell__backdrop') as HTMLElement).click();
    await fixture.whenStable();
    expect(host.open()).toBe(false);
  });

  it('referme le tiroir en passant en grand écran', async () => {
    const { fixture, host, toggle, main } = await setup();
    toggle.click();
    await fixture.whenStable();

    desktop.set(true);
    await fixture.whenStable();
    expect(host.open()).toBe(false);
    expect(main.inert).toBe(false);
  });
});
