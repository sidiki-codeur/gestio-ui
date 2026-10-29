import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { GestioBreadcrumb } from './breadcrumb';
import { GestioBreadcrumbEntry, GestioBreadcrumbLink } from './breadcrumb-item';

@Component({
  imports: [GestioBreadcrumb, GestioBreadcrumbEntry, GestioBreadcrumbLink, RouterLink],
  template: `
    <gestio-breadcrumb
      [maxItems]="maxItems()"
      [itemsAfterCollapse]="after()"
      [separator]="separator()"
      [labels]="{ showHidden: 'Show {count} hidden levels' }"
    >
      <gestio-breadcrumb-entry
        ><a gestioBreadcrumbLink routerLink="/">Accueil</a></gestio-breadcrumb-entry
      >
      <gestio-breadcrumb-entry
        ><a gestioBreadcrumbLink routerLink="/ventes">Ventes</a></gestio-breadcrumb-entry
      >
      <gestio-breadcrumb-entry
        ><a gestioBreadcrumbLink href="/ventes/clients">Clients</a></gestio-breadcrumb-entry
      >
      <gestio-breadcrumb-entry
        ><a gestioBreadcrumbLink routerLink="/ventes/factures">Factures</a></gestio-breadcrumb-entry
      >
      @if (withLast()) {
        <gestio-breadcrumb-entry>F-2026-0142</gestio-breadcrumb-entry>
      }
    </gestio-breadcrumb>
  `,
})
class Host {
  readonly maxItems = signal(8);
  readonly after = signal(1);
  readonly separator = signal<'chevron' | 'slash'>('chevron');
  readonly withLast = signal(true);
}

describe('GestioBreadcrumb', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const items = () => Array.from(element.querySelectorAll('li')) as HTMLLIElement[];
    return { fixture, host: fixture.componentInstance, element, items };
  }

  it('rend une navigation nommée contenant une liste ordonnée', async () => {
    const { element, items } = await setup();
    const nav = element.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Fil d’Ariane');
    expect(nav.querySelector('ol')).not.toBeNull();
    expect(items()).toHaveLength(5);
    expect(items().map((li) => li.textContent?.trim())).toEqual([
      'Accueil',
      'Ventes',
      'Clients',
      'Factures',
      'F-2026-0142',
    ]);
  });

  it('compatible routerLink : génère les href', async () => {
    const { element } = await setup();
    const links = Array.from(element.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/',
      '/ventes',
      '/ventes/clients',
      '/ventes/factures',
    ]);
    expect(links[0].classList).toContain('gestio-breadcrumb-link');
  });

  it('marque le dernier élément avec aria-current="page" (texte ou lien)', async () => {
    const { fixture, host, element } = await setup();
    const current = element.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe('F-2026-0142');

    host.withLast.set(false);
    await fixture.whenStable();
    const link = element.querySelector('[aria-current="page"]')!;
    expect(link.tagName).toBe('A');
    expect(link.textContent).toBe('Factures');
    expect(element.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('affiche des séparateurs décoratifs entre les éléments', async () => {
    const { fixture, host, items } = await setup();
    expect(items()[0].querySelector('.gestio-breadcrumb__separator')).toBeNull();
    const separator = items()[1].querySelector('.gestio-breadcrumb__separator')!;
    expect(separator.getAttribute('aria-hidden')).toBe('true');

    host.separator.set('slash');
    await fixture.whenStable();
    expect(items()[1].querySelector('.gestio-breadcrumb__separator')?.textContent).toBe('/');
  });

  it('replie les éléments du milieu au-delà de maxItems et les déplie au clic', async () => {
    const { fixture, host, element, items } = await setup();
    host.maxItems.set(3);
    await fixture.whenStable();
    expect(items()).toHaveLength(3);
    const button = element.querySelector('button.gestio-breadcrumb__ellipsis') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Show 3 hidden levels');
    expect(items()[2].textContent?.trim()).toBe('F-2026-0142');

    button.focus();
    button.click();
    await fixture.whenStable();
    expect(items()).toHaveLength(5);
    expect(element.querySelector('.gestio-breadcrumb__ellipsis')).toBeNull();
    expect(document.activeElement?.textContent).toBe('Ventes');
  });

  it('ne remplace jamais un seul élément par une ellipse', async () => {
    const { fixture, host, element, items } = await setup();
    host.maxItems.set(4);
    host.after.set(3);
    await fixture.whenStable();
    expect(items()).toHaveLength(5);
    expect(element.querySelector('.gestio-breadcrumb__ellipsis')).toBeNull();
  });
});
