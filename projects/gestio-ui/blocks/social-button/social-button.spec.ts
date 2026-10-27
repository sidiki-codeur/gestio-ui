import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioSocialButton, GestioSocialProvider } from './social-button';

@Component({
  imports: [GestioSocialButton],
  template: `
    <button
      gestioSocialButton
      [provider]="provider()"
      [loading]="loading()"
      [disabled]="disabled()"
      fullWidth
      (click)="clicks = clicks + 1"
    ></button>
    <a gestioSocialButton provider="github" href="/auth/github" [disabled]="disabled()"
      >Se connecter avec GitHub</a
    >
  `,
})
class Host {
  readonly provider = signal<GestioSocialProvider>('google');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  clicks = 0;
}

describe('GestioSocialButton', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      button: el.querySelector('button')!,
      link: el.querySelector('a')!,
    };
  }

  it('affiche le logo masqué et le libellé par défaut du fournisseur', async () => {
    const { fixture, host, button } = await setup();
    expect(button.getAttribute('type')).toBe('button');
    expect(button.textContent!.trim()).toBe('Continuer avec Google');
    expect(button.querySelector('.gestio-social-button__logo')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(button.classList).toContain('gestio-social-button--google');
    expect(button.classList).toContain('gestio-social-button--full-width');

    host.provider.set('microsoft');
    await fixture.whenStable();
    expect(button.textContent!.trim()).toBe('Continuer avec Microsoft');
    expect(button.querySelectorAll('rect').length).toBe(4);
  });

  it('le contenu projeté remplace le libellé par défaut', async () => {
    const { link } = await setup();
    expect(link.textContent!.trim()).toBe('Se connecter avec GitHub');
    expect(link.getAttribute('type')).toBeNull();
  });

  it('en chargement : aria-busy, annonce et clics bloqués', async () => {
    const { fixture, host, button } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.textContent).toContain('Connexion en cours');
    button.click();
    expect(host.clicks).toBe(0);
  });

  it('désactive le bouton et le lien', async () => {
    const { fixture, host, button, link } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
