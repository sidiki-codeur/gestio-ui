import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioLoginForm, GestioLoginFormValue } from './login-form';

@Component({
  imports: [GestioLoginForm],
  template: `
    <gestio-login-form
      subheading="Accédez à votre espace"
      [loading]="loading()"
      [error]="error()"
      [forgotPasswordHref]="forgotHref()"
      (submitted)="values.push($event)"
      (forgotPassword)="forgotClicks = forgotClicks + 1"
    >
      <button gestioAuthSocial type="button" class="social">Google</button>
      <p gestioAuthFooter>Pas de compte ? <a href="/inscription">S'inscrire</a></p>
    </gestio-login-form>
  `,
})
class Host {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly forgotHref = signal<string | undefined>(undefined);
  readonly values: GestioLoginFormValue[] = [];
  forgotClicks = 0;
}

describe('GestioLoginForm', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const inputs = () => el.querySelectorAll<HTMLInputElement>('gestio-input input');
    const type = async (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, el, inputs, type, submit };
  }

  it('affiche titre, sous-titre, champs avec autocomplete et projections', async () => {
    const { el, inputs } = await setup();
    const heading = el.querySelector('h1')!;
    expect(heading.textContent).toContain('Connexion');
    expect(el.querySelector('form')!.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(el.textContent).toContain('Accédez à votre espace');
    const [email, password] = Array.from(inputs());
    expect(email.type).toBe('email');
    expect(email.getAttribute('autocomplete')).toBe('username');
    expect(password.type).toBe('password');
    expect(password.getAttribute('autocomplete')).toBe('current-password');
    expect(el.querySelector('.gestio-auth__social .social')).not.toBeNull();
    expect(el.querySelector('.gestio-auth__footer a')!.getAttribute('href')).toBe('/inscription');
  });

  it('bloque la soumission invalide, affiche les erreurs et focalise le premier champ', async () => {
    const { host, el, inputs, submit } = await setup();
    await submit();

    expect(host.values).toEqual([]);
    const [email, password] = Array.from(inputs());
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(el.textContent).toContain('Saisissez votre adresse e-mail.');
    expect(document.activeElement).toBe(email);
  });

  it('signale un e-mail mal formé', async () => {
    const { el, inputs, type } = await setup();
    await type(inputs()[0], 'claire.moreau');
    expect(el.textContent).toContain('Saisissez une adresse e-mail valide');
  });

  it('émet la valeur quand le formulaire est valide', async () => {
    const { host, el, inputs, type, submit } = await setup();
    await type(inputs()[0], 'claire@atelier-moreau.fr');
    await type(inputs()[1], 's3cret!');
    el.querySelector<HTMLInputElement>('gestio-checkbox input')!.click();
    await submit();

    expect(host.values).toEqual([
      { email: 'claire@atelier-moreau.fr', password: 's3cret!', remember: true },
    ]);
  });

  it('ne soumet pas pendant le chargement', async () => {
    const { fixture, host, inputs, type, submit } = await setup();
    await type(inputs()[0], 'claire@atelier-moreau.fr');
    await type(inputs()[1], 's3cret!');
    host.loading.set(true);
    await fixture.whenStable();
    await submit();
    expect(host.values).toEqual([]);
  });

  it('annonce et focalise l’erreur serveur', async () => {
    const { fixture, host, el } = await setup();
    host.error.set('Identifiants incorrects.');
    await fixture.whenStable();

    const region = el.querySelector<HTMLElement>('.gestio-auth__error')!;
    expect(region.querySelector('[role="alert"]')!.textContent).toContain(
      'Identifiants incorrects.',
    );
    expect(document.activeElement).toBe(region);
  });

  it('« Mot de passe oublié ? » : bouton qui émet, ou lien si une URL est fournie', async () => {
    const { fixture, host, el } = await setup();
    const button = el.querySelector<HTMLButtonElement>('button.gestio-auth__link')!;
    button.click();
    expect(host.forgotClicks).toBe(1);

    host.forgotHref.set('/mot-de-passe-oublie');
    await fixture.whenStable();
    expect(el.querySelector('button.gestio-auth__link')).toBeNull();
    expect(el.querySelector('a.gestio-auth__link')!.getAttribute('href')).toBe(
      '/mot-de-passe-oublie',
    );
  });
});
