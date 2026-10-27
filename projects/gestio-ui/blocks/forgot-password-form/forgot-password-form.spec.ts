import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioForgotPasswordForm, GestioForgotPasswordFormValue } from './forgot-password-form';

@Component({
  imports: [GestioForgotPasswordForm],
  template: `
    <gestio-forgot-password-form
      initialEmail="claire@atelier-moreau.fr"
      [sent]="sent()"
      [loginHref]="loginHref()"
      (submitted)="submits.push($event)"
      (resend)="resends.push($event)"
      (backToLogin)="backs = backs + 1"
    />
  `,
})
class Host {
  readonly sent = signal(false);
  readonly loginHref = signal<string | undefined>(undefined);
  readonly submits: GestioForgotPasswordFormValue[] = [];
  readonly resends: GestioForgotPasswordFormValue[] = [];
  backs = 0;
}

describe('GestioForgotPasswordForm', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const emailInput = () => el.querySelector<HTMLInputElement>('gestio-input input')!;
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, el, emailInput, submit };
  }

  it('préremplit l’e-mail et émet à la soumission', async () => {
    const { host, emailInput, submit } = await setup();
    expect(emailInput().value).toBe('claire@atelier-moreau.fr');
    expect(emailInput().getAttribute('autocomplete')).toBe('email');
    await submit();
    expect(host.submits).toEqual([{ email: 'claire@atelier-moreau.fr' }]);
  });

  it('refuse un e-mail invalide et focalise le champ', async () => {
    const { fixture, host, el, emailInput, submit } = await setup();
    emailInput().value = 'claire';
    emailInput().dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await submit();
    expect(host.submits).toEqual([]);
    expect(el.textContent).toContain('Saisissez une adresse e-mail valide');
    expect(document.activeElement).toBe(emailInput());
  });

  it('état envoyé : confirmation focalisée, renvoi possible', async () => {
    const { fixture, host, el } = await setup();
    host.sent.set(true);
    await fixture.whenStable();

    expect(el.querySelector('form')).toBeNull();
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toContain('claire@atelier-moreau.fr');
    expect(document.activeElement).toBe(status.closest('[tabindex="-1"]'));

    const resend = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent!.includes('Renvoyer'),
    )!;
    resend.click();
    expect(host.resends).toEqual([{ email: 'claire@atelier-moreau.fr' }]);
  });

  it('retour à la connexion : bouton qui émet, ou lien', async () => {
    const { fixture, host, el } = await setup();
    el.querySelector<HTMLButtonElement>('button.gestio-auth__link')!.click();
    expect(host.backs).toBe(1);

    host.loginHref.set('/connexion');
    await fixture.whenStable();
    expect(el.querySelector('a.gestio-auth__link')!.getAttribute('href')).toBe('/connexion');
  });
});
