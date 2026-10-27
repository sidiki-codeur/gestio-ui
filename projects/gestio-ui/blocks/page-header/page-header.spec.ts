import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GESTIO_PAGE_HEADER_IMPORTS,
  GestioBreadcrumbClick,
  GestioBreadcrumbItem,
  GestioPageHeaderLabels,
} from './page-header';

@Component({
  imports: [GESTIO_PAGE_HEADER_IMPORTS],
  template: `
    <gestio-page-header
      heading="Atelier Moreau SARL"
      [subheading]="subheading()"
      [breadcrumbs]="breadcrumbs()"
      [backHref]="backHref()"
      [showBack]="showBack()"
      [backLabel]="backLabel()"
      [labels]="labels()"
      (back)="backs.set(backs() + 1)"
      (breadcrumbClick)="onCrumb($event)"
    >
      <span gestioPageHeaderStatus class="status">Actif</span>
      <div gestioPageHeaderActions>
        <button type="button">Modifier</button>
      </div>
      <div gestioPageHeaderFooter class="tabs">Onglets</div>
    </gestio-page-header>
  `,
})
class Host {
  readonly subheading = signal<string | undefined>('Client depuis mars 2021');
  readonly breadcrumbs = signal<GestioBreadcrumbItem[]>([
    { label: 'Accueil', href: '/' },
    { label: 'Clients', href: '/clients' },
    { label: 'Archives' },
    { label: 'Atelier Moreau SARL', href: '/clients/42' },
  ]);
  readonly backHref = signal<string | undefined>(undefined);
  readonly showBack = signal(false);
  readonly backLabel = signal<string | undefined>(undefined);
  readonly labels = signal<Partial<GestioPageHeaderLabels>>({});
  readonly backs = signal(0);
  readonly crumbs: GestioBreadcrumbClick[] = [];

  onCrumb(click: GestioBreadcrumbClick): void {
    click.event.preventDefault();
    this.crumbs.push(click);
  }
}

describe('GestioPageHeader', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const header = fixture.nativeElement.querySelector('gestio-page-header') as HTMLElement;
    return { fixture, host: fixture.componentInstance, header };
  }

  it('rend un h1, le sous-titre et les zones projetées', async () => {
    const { header } = await setup();
    expect(header.querySelector('h1')?.textContent?.trim()).toBe('Atelier Moreau SARL');
    expect(header.querySelector('.gestio-page-header__subheading')?.textContent).toContain(
      'Client depuis mars 2021',
    );
    expect(header.querySelector('.gestio-page-header__status .status')).not.toBeNull();
    expect(header.querySelector('.gestio-page-header__actions button')).not.toBeNull();
    expect(header.querySelector('.gestio-page-header-actions')).not.toBeNull();
    expect(header.querySelector('.gestio-page-header__footer .tabs')).not.toBeNull();
  });

  it('structure le fil d’Ariane : nav nommée, liste, page courante', async () => {
    const { header } = await setup();
    const nav = header.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe("Fil d'Ariane");
    const items = nav.querySelectorAll('ol > li');
    expect(items.length).toBe(4);

    const links = nav.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[1].getAttribute('href')).toBe('/clients');

    const current = items[3].querySelector('[aria-current="page"]') as HTMLElement;
    expect(current.tagName).toBe('SPAN');
    expect(current.textContent?.trim()).toBe('Atelier Moreau SARL');
    expect(nav.querySelectorAll('[aria-current]').length).toBe(1);
    expect(nav.querySelectorAll('.gestio-page-header__separator').length).toBe(3);
    expect(
      [...nav.querySelectorAll('.gestio-page-header__separator')].every(
        (svg) => svg.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true);
  });

  it('émet breadcrumbClick avec l’élément et son index', async () => {
    const { host, header } = await setup();
    const link = header.querySelectorAll('nav a')[1] as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(host.crumbs.length).toBe(1);
    expect(host.crumbs[0].index).toBe(1);
    expect(host.crumbs[0].item.label).toBe('Clients');
    expect(host.crumbs[0].event.defaultPrevented).toBe(true);
  });

  it('masque fil d’Ariane et retour quand ils sont absents', async () => {
    const { fixture, host, header } = await setup();
    host.breadcrumbs.set([]);
    host.subheading.set(undefined);
    await fixture.whenStable();
    expect(header.querySelector('.gestio-page-header__top')).toBeNull();
    expect(header.querySelector('.gestio-page-header__subheading')).toBeNull();
  });

  it('affiche un lien de retour avec backHref', async () => {
    const { fixture, host, header } = await setup();
    host.backHref.set('/clients');
    await fixture.whenStable();
    const back = header.querySelector('a.gestio-page-header__back') as HTMLAnchorElement;
    expect(back.getAttribute('href')).toBe('/clients');
    expect(back.textContent?.trim()).toBe('Retour');
    expect(back.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('affiche un bouton de retour qui émet back sans adresse', async () => {
    const { fixture, host, header } = await setup();
    host.showBack.set(true);
    host.labels.set({ back: 'Back', breadcrumb: 'Breadcrumb' });
    await fixture.whenStable();

    const back = header.querySelector('button.gestio-page-header__back') as HTMLButtonElement;
    expect(back.getAttribute('type')).toBe('button');
    expect(back.textContent?.trim()).toBe('Back');
    expect(header.querySelector('nav')?.getAttribute('aria-label')).toBe('Breadcrumb');
    back.click();
    expect(host.backs()).toBe(1);

    host.backLabel.set('Retour aux clients');
    await fixture.whenStable();
    expect(back.textContent?.trim()).toBe('Retour aux clients');
  });
});
