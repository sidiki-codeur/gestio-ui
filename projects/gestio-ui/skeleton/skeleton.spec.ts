import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioSpinner } from '@gestiolabs336/ui/spinner';
import { GestioSkeleton } from './skeleton';

@Component({
  imports: [GestioSkeleton, GestioSpinner],
  template: `
    <gestio-skeleton class="text" [lines]="3" width="20rem" />
    <gestio-skeleton class="circle" shape="circle" width="3rem" [lines]="4" />
    <gestio-spinner class="announced" label="Chargement des factures" />
    <gestio-spinner class="decorative" decorative />
  `,
})
class Host {}

describe('GestioSkeleton et GestioSpinner', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('rend des blocs masqués aux technologies d’assistance', async () => {
    const el = await setup();
    const text = el.querySelector('.text') as HTMLElement;
    expect(text.getAttribute('aria-hidden')).toBe('true');
    expect(text.querySelectorAll('.gestio-skeleton__bone')).toHaveLength(3);
    expect(text.querySelectorAll('.is-last')).toHaveLength(1);
    expect(text.style.getPropertyValue('--_width')).toBe('20rem');
    // `lines` ne s'applique qu'à la forme texte.
    expect(el.querySelectorAll('.circle .gestio-skeleton__bone')).toHaveLength(1);
  });

  it('annonce le spinner, sauf s’il est décoratif', async () => {
    const el = await setup();
    const announced = el.querySelector('.announced') as HTMLElement;
    expect(announced.getAttribute('role')).toBe('status');
    expect(announced.textContent).toContain('Chargement des factures');

    const decorative = el.querySelector('.decorative') as HTMLElement;
    expect(decorative.hasAttribute('role')).toBe(false);
    expect(decorative.getAttribute('aria-hidden')).toBe('true');
  });
});
