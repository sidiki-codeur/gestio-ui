import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioSignupForm, GestioSignupFormValue, gestioPasswordStrength } from './signup-form';

@Component({
  imports: [GestioSignupForm],
  template: `
    <gestio-signup-form
      termsHref="/cgu"
      [headingLevel]="2"
      [showTerms]="showTerms()"
      [error]="error()"
      (submitted)="values.push($event)"
    />
  `,
})
class Host {
  readonly showTerms = signal(true);
  readonly error = signal<string | null>(null);
  readonly values: GestioSignupFormValue[] = [];
}

describe('gestioPasswordStrength', () => {
  it('note de 0 à 4', () => {
    expect(gestioPasswordStrength('')).toBe(0);
    expect(gestioPasswordStrength('abc')).toBe(1);
    expect(gestioPasswordStrength('Abc12345')).toBe(2);
    expect(gestioPasswordStrength('Abcdef123456')).toBe(3);
    expect(gestioPasswordStrength('Abcdef12345!')).toBe(4);
  });
});

describe('GestioSignupForm', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const fields = () => Array.from(el.querySelectorAll<HTMLInputElement>('gestio-input input'));
    const type = async (index: number, value: string) => {
      const input = fields()[index];
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, el, fields, type, submit };
  }

  it('utilise les bons autocomplete et le niveau de titre demandé', async () => {
    const { el, fields } = await setup();
    expect(el.querySelector('h2')!.textContent).toContain('Créer un compte');
    expect(fields().map((f) => f.getAttribute('autocomplete'))).toEqual([
      'name',
      'email',
      'new-password',
      'new-password',
    ]);
    const terms = el.querySelector<HTMLAnchorElement>('a[href="/cgu"]')!;
    expect(terms.target).toBe('_blank');
    expect(terms.textContent).toContain('(nouvel onglet)');
  });

  it('annonce la force du mot de passe', async () => {
    const { el, type } = await setup();
    const live = el.querySelector('[aria-live="polite"]')!;
    expect(live.textContent!.trim()).toBe('');
    await type(2, 'Abcdef12345!');
    expect(live.textContent).toContain('Force du mot de passe : très bonne');
  });

  it('vérifie la longueur et la correspondance des mots de passe', async () => {
    const { el, type } = await setup();
    await type(2, 'court');
    expect(el.textContent).toContain('au moins 8 caractères');
    await type(2, 'Abcdef12345!');
    await type(3, 'Abcdef12345?');
    expect(el.textContent).toContain('Les deux mots de passe ne correspondent pas.');
  });

  it('exige les conditions et focalise le premier champ invalide', async () => {
    const { host, el, fields, type, submit } = await setup();
    await type(0, 'Claire Moreau');
    await type(1, 'claire@atelier-moreau.fr');
    await type(2, 'Abcdef12345!');
    await type(3, 'Abcdef12345!');
    await submit();

    expect(host.values).toEqual([]);
    expect(el.textContent).toContain('Vous devez accepter les conditions');
    expect(document.activeElement).toBe(el.querySelector('gestio-checkbox input'));
    expect(fields()[0].getAttribute('aria-invalid')).toBeNull();
  });

  it('émet la valeur sans la confirmation', async () => {
    const { host, el, type, submit } = await setup();
    await type(0, ' Claire Moreau ');
    await type(1, 'claire@atelier-moreau.fr');
    await type(2, 'Abcdef12345!');
    await type(3, 'Abcdef12345!');
    el.querySelector<HTMLInputElement>('gestio-checkbox input')!.click();
    await submit();

    expect(host.values).toEqual([
      {
        name: 'Claire Moreau',
        email: 'claire@atelier-moreau.fr',
        password: 'Abcdef12345!',
        acceptTerms: true,
      },
    ]);
  });

  it('n’exige pas les conditions quand elles sont masquées', async () => {
    const { fixture, host, el, type, submit } = await setup();
    host.showTerms.set(false);
    await fixture.whenStable();
    expect(el.querySelector('gestio-checkbox')).toBeNull();
    await type(0, 'Claire Moreau');
    await type(1, 'claire@atelier-moreau.fr');
    await type(2, 'Abcdef12345!');
    await type(3, 'Abcdef12345!');
    await submit();
    expect(host.values.length).toBe(1);
  });

  it('annonce et focalise l’erreur serveur', async () => {
    const { fixture, host, el } = await setup();
    host.error.set('Cette adresse est déjà utilisée.');
    await fixture.whenStable();
    const region = el.querySelector<HTMLElement>('.gestio-auth__error')!;
    expect(region.querySelector('[role="alert"]')).not.toBeNull();
    expect(document.activeElement).toBe(region);
  });
});
