import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GESTIO_ERROR_PAGE_IMPORTS,
  GestioErrorPageCode,
  GestioErrorPageLabels,
  GestioErrorPageVariant,
} from './error-page';

@Component({
  imports: [GESTIO_ERROR_PAGE_IMPORTS],
  template: `
    <gestio-error-page
      [code]="code()"
      [heading]="heading()"
      [message]="message()"
      [headingLevel]="level()"
      [variant]="variant()"
      [labels]="labels()"
    >
      <p class="ref">Référence : INC-2048</p>
      <div gestioErrorPageActions>
        <a href="/">Retour à l’accueil</a>
      </div>
    </gestio-error-page>
    <gestio-error-page class="static" code="403" headingLevel="2" />
  `,
})
class Host {
  readonly code = signal<GestioErrorPageCode>(404);
  readonly heading = signal<string | undefined>(undefined);
  readonly message = signal<string | undefined>(undefined);
  readonly level = signal<number>(1);
  readonly variant = signal<GestioErrorPageVariant>('fullscreen');
  readonly labels = signal<Partial<GestioErrorPageLabels>>({});
}

describe('GestioErrorPage', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const page = root.querySelector('gestio-error-page') as HTMLElement;
    const text = (selector: string) => page.querySelector(selector)?.textContent?.trim();
    return { fixture, host: fixture.componentInstance, root, page, text };
  }

  it('affiche les textes par défaut d’une 404 avec un h1', async () => {
    const { page, text } = await setup();
    expect(page.classList).toContain('gestio-error-page');
    expect(page.classList).toContain('gestio-error-page--not-found');
    expect(page.classList).toContain('gestio-error-page--fullscreen');
    expect(text('.gestio-error-page__eyebrow')).toBe('Erreur 404');
    expect(text('h1')).toBe('Page introuvable');
    expect(text('.gestio-error-page__message')).toContain('n’existe pas');
  });

  it('adapte les textes et l’illustration au code', async () => {
    const { fixture, host, page, text } = await setup();
    const cases: [GestioErrorPageCode, string, string, string][] = [
      [403, 'forbidden', 'Erreur 403', 'Accès refusé'],
      [500, 'server-error', 'Erreur 500', 'Une erreur est survenue'],
      ['maintenance', 'maintenance', 'Maintenance', 'Maintenance en cours'],
      ['offline', 'offline', 'Hors ligne', 'Vous êtes hors ligne'],
    ];
    for (const [code, kind, eyebrow, heading] of cases) {
      host.code.set(code);
      await fixture.whenStable();
      expect(page.classList).toContain(`gestio-error-page--${kind}`);
      expect(text('.gestio-error-page__eyebrow')).toBe(eyebrow);
      expect(text('h1')).toBe(heading);
    }
  });

  it('accepte un code en attribut statique et borne le niveau de titre', async () => {
    const { fixture, host, root, page } = await setup();
    const fixed = root.querySelector('gestio-error-page.static') as HTMLElement;
    expect(fixed.classList).toContain('gestio-error-page--forbidden');
    expect(fixed.querySelector('h2')?.textContent?.trim()).toBe('Accès refusé');

    host.level.set(9);
    await fixture.whenStable();
    expect(page.querySelector('h6')).not.toBeNull();
    host.level.set(3);
    await fixture.whenStable();
    expect(page.querySelector('h3')).not.toBeNull();
    expect(page.querySelector('h1')).toBeNull();
  });

  it('remplace titre et message, et surcharge les libellés', async () => {
    const { fixture, host, text } = await setup();
    host.labels.set({ codeEyebrow: 'Error {code}', notFoundHeading: 'Page not found' });
    await fixture.whenStable();
    expect(text('.gestio-error-page__eyebrow')).toBe('Error 404');
    expect(text('h1')).toBe('Page not found');

    host.heading.set('Client introuvable');
    host.message.set('Ce client a peut-être été supprimé.');
    await fixture.whenStable();
    expect(text('h1')).toBe('Client introuvable');
    expect(text('.gestio-error-page__message')).toBe('Ce client a peut-être été supprimé.');
  });

  it('projette le contenu et les actions ; illustration décorative', async () => {
    const { fixture, host, page, text } = await setup();
    expect(text('.gestio-error-page__body .ref')).toBe('Référence : INC-2048');
    const actions = page.querySelector('.gestio-error-page__actions [gestioErrorPageActions]');
    expect(actions?.classList).toContain('gestio-error-page-actions');
    expect(actions?.querySelector('a')?.getAttribute('href')).toBe('/');
    const svg = page.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');

    host.variant.set('inline');
    await fixture.whenStable();
    expect(page.classList).toContain('gestio-error-page--inline');
    expect(page.classList).not.toContain('gestio-error-page--fullscreen');
  });
});
