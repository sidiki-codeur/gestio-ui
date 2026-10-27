import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GESTIO_EMPTY_STATE_IMPORTS,
  GestioEmptyStateHeadingLevel,
  GestioEmptyStateSize,
  GestioEmptyStateVariant,
} from './empty-state';

@Component({
  imports: [GESTIO_EMPTY_STATE_IMPORTS],
  template: `
    <gestio-empty-state
      heading="Aucun client"
      [description]="description()"
      [variant]="variant()"
      [size]="size()"
      [headingLevel]="level()"
      [bordered]="bordered()"
    >
      @if (withActions()) {
        <div gestioEmptyStateActions>
          <button type="button" (click)="clicks.set(clicks() + 1)">Ajouter un client</button>
        </div>
      }
    </gestio-empty-state>

    <gestio-empty-state id="custom" heading="Projet créé" headingLevel="3">
      <img gestioEmptyStateIcon src="data:," alt="Illustration de dossier" />
      <p>Invitez votre équipe pour commencer.</p>
    </gestio-empty-state>
  `,
})
class Host {
  readonly description = signal<string | undefined>('Créez votre premier client.');
  readonly variant = signal<GestioEmptyStateVariant>('empty');
  readonly size = signal<GestioEmptyStateSize>('md');
  readonly level = signal<GestioEmptyStateHeadingLevel>(2);
  readonly bordered = signal(false);
  readonly withActions = signal(true);
  readonly clicks = signal(0);
}

describe('GestioEmptyState', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const block = el.querySelector('gestio-empty-state') as HTMLElement;
    const custom = el.querySelector('#custom') as HTMLElement;
    return { fixture, host: fixture.componentInstance, block, custom };
  }

  it('affiche titre, description et icône décorative par défaut', async () => {
    const { block } = await setup();
    expect(block.querySelector('h2')?.textContent?.trim()).toBe('Aucun client');
    expect(block.querySelector('.gestio-empty-state__description')?.textContent).toContain(
      'Créez votre premier client.',
    );
    const svg = block.querySelector('svg.gestio-empty-state__icon');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(block.classList).toContain('gestio-empty-state--empty');
    expect(block.classList).toContain('gestio-empty-state--md');
  });

  it('applique variante, taille et bordure', async () => {
    const { fixture, host, block } = await setup();
    host.variant.set('error');
    host.size.set('lg');
    host.bordered.set(true);
    await fixture.whenStable();

    expect(block.classList).toContain('gestio-empty-state--error');
    expect(block.classList).toContain('gestio-empty-state--lg');
    expect(block.classList).toContain('gestio-empty-state--bordered');
    expect(block.classList).not.toContain('gestio-empty-state--empty');
  });

  it('change le niveau du titre et le borne entre 2 et 6', async () => {
    const { fixture, host, block, custom } = await setup();
    expect(custom.querySelector('h3')?.textContent?.trim()).toBe('Projet créé');

    host.level.set(5);
    await fixture.whenStable();
    expect(block.querySelector('h5')).not.toBeNull();
    expect(block.querySelector('h2')).toBeNull();

    host.level.set(9 as GestioEmptyStateHeadingLevel);
    await fixture.whenStable();
    expect(block.querySelector('h6')).not.toBeNull();
  });

  it('masque la description vide et projette les actions', async () => {
    const { fixture, host, block } = await setup();
    host.description.set(undefined);
    await fixture.whenStable();
    expect(block.querySelector('.gestio-empty-state__description')).toBeNull();

    const action = block.querySelector('.gestio-empty-state-actions button') as HTMLButtonElement;
    action.click();
    expect(host.clicks()).toBe(1);
  });

  it('remplace l’icône par défaut par l’icône projetée et affiche le contenu', async () => {
    const { custom } = await setup();
    expect(custom.querySelector('svg.gestio-empty-state__icon')).toBeNull();
    expect(custom.querySelector('img')?.getAttribute('alt')).toBe('Illustration de dossier');
    expect(custom.querySelector('.gestio-empty-state__body')?.textContent).toContain(
      'Invitez votre équipe',
    );
  });
});
