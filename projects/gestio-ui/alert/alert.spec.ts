import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioAlert, GestioAlertLive } from './alert';

@Component({
  imports: [GestioAlert],
  template: `
    @if (visible()) {
      <gestio-alert
        variant="danger"
        title="Paiement refusé"
        dismissible
        [live]="live()"
        (dismissed)="visible.set(false)"
      >
        La carte a expiré.
        <div gestioAlertActions><button type="button" class="retry">Réessayer</button></div>
      </gestio-alert>
    }
    <gestio-alert class="plain">Information simple</gestio-alert>
  `,
})
class Host {
  readonly visible = signal(true);
  readonly live = signal<GestioAlertLive>('off');
}

describe('GestioAlert', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('affiche titre, message, actions et préfixe pour les lecteurs d’écran', async () => {
    const { el } = await setup();
    const alert = el.querySelector('gestio-alert') as HTMLElement;
    expect(alert.classList).toContain('gestio-alert--danger');
    expect(alert.textContent).toContain('Erreur :');
    expect(alert.textContent).toContain('Paiement refusé');
    expect(alert.querySelector('.gestio-alert__actions .retry')).not.toBeNull();
    expect(el.querySelector('.plain')?.textContent).toContain('Information :');
  });

  it('n’a pas de rôle live par défaut, status ou alert sur demande', async () => {
    const { fixture, host, el } = await setup();
    const box = () => el.querySelector('.gestio-alert') as HTMLElement;
    expect(box().hasAttribute('role')).toBe(false);
    host.live.set('polite');
    await fixture.whenStable();
    expect(box().getAttribute('role')).toBe('status');
    host.live.set('assertive');
    await fixture.whenStable();
    expect(box().getAttribute('role')).toBe('alert');
  });

  it('émet dismissed au clic sur le bouton de fermeture', async () => {
    const { fixture, el } = await setup();
    const close = el.querySelector('.gestio-alert__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fermer le message');
    close.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('gestio-alert')).toHaveLength(1);
  });
});
