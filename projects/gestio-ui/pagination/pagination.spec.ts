import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioPagination, GestioPaginationMode } from './pagination';

@Component({
  imports: [GestioPagination],
  template: `
    <gestio-pagination [total]="total()" [mode]="mode()" [(page)]="page" [(pageSize)]="pageSize" />
  `,
})
class Host {
  readonly total = signal(200);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly mode = signal<GestioPaginationMode>('pages');
}

describe('GestioPagination', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const settle = () => fixture.whenStable();
    const labels = () =>
      Array.from(el.querySelectorAll('.gestio-pagination__list li')).map((li) =>
        li.textContent!.trim(),
      );
    const pageButton = (n: number) =>
      el.querySelector(`[aria-label="Page ${n}"]`) as HTMLButtonElement;
    return { fixture, host: fixture.componentInstance, el, settle, labels, pageButton };
  }

  it('affiche les pages avec ellipses dans une navigation nommée', async () => {
    const { el, labels, pageButton } = await setup();
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    expect(labels()).toEqual(['', '1', '2', '3', '4', '5', '…', '20', '']);
    expect(pageButton(1).getAttribute('aria-current')).toBe('page');
    expect(el.querySelector('.gestio-pagination__range')?.textContent).toContain('1–10 sur 200');
  });

  it('change de page, recentre la fenêtre et annonce la page', async () => {
    const { host, el, settle, labels, pageButton } = await setup();
    pageButton(5).click();
    await settle();
    expect(host.page()).toBe(4);
    expect(labels()).toEqual(['', '1', '…', '4', '5', '6', '…', '20', '']);
    expect(pageButton(5).getAttribute('aria-current')).toBe('page');
    await Promise.resolve();
    await settle();
    expect(el.querySelector('[aria-live]')?.textContent).toContain('Page 5 sur 20');
  });

  it('borne les boutons précédent et suivant', async () => {
    const { host, el, settle } = await setup();
    const [prev, next] = [
      el.querySelector('[aria-label="Page précédente"]') as HTMLButtonElement,
      el.querySelector('[aria-label="Page suivante"]') as HTMLButtonElement,
    ];
    expect(prev.disabled).toBe(true);
    host.page.set(19);
    await settle();
    expect(next.disabled).toBe(true);
    prev.click();
    expect(host.page()).toBe(18);
  });

  it('revient à la première page quand la taille change', async () => {
    const { host, el, settle } = await setup();
    host.page.set(3);
    await settle();
    const select = el.querySelector('select') as HTMLSelectElement;
    expect((el.querySelector('label') as HTMLLabelElement).htmlFor).toBe(select.id);
    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(host.pageSize()).toBe(50);
    expect(host.page()).toBe(0);
  });

  it('accepte un nom de navigation dédié', async () => {
    const fixture = TestBed.createComponent(GestioPagination);
    fixture.componentRef.setInput('total', 30);
    fixture.componentRef.setInput('ariaLabel', 'Pages des clients');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe(
      'Pages des clients',
    );
  });

  it('mode compact et page hors limites', async () => {
    const { host, settle, labels } = await setup();
    host.mode.set('compact');
    host.page.set(99);
    await settle();
    expect(labels()).toEqual(['', '20 / 20', '']);
  });
});
