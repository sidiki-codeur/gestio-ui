import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioButton } from './button';

@Component({
  imports: [GestioButton],
  template: `
    <form (submit)="onSubmit($event)">
      <button
        gestioButton
        [type]="type()"
        [disabled]="disabled()"
        [loading]="loading()"
        (click)="clicks.set(clicks() + 1)"
      >
        Enregistrer
      </button>
    </form>
    <a gestioButton href="#suite" [disabled]="disabled()">Lien</a>
  `,
})
class Host {
  readonly type = signal<'button' | 'submit'>('button');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly clicks = signal(0);
  submits = 0;

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submits++;
  }
}

describe('GestioButton', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    return { fixture, host: fixture.componentInstance, button, link };
  }

  it('utilise type="button" par défaut et applique les classes de variante', async () => {
    const { button } = await setup();
    expect(button.getAttribute('type')).toBe('button');
    expect(button.classList).toContain('gestio-button--primary');
    expect(button.classList).toContain('gestio-button--md');
  });

  it('pose l’attribut natif disabled et bloque les clics', async () => {
    const { fixture, host, button } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(host.clicks()).toBe(0);
  });

  it('en chargement : reste focalisable, expose aria-busy et bloque activation et soumission', async () => {
    const { fixture, host, button } = await setup();
    host.type.set('submit');
    host.loading.set(true);
    await fixture.whenStable();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.querySelector('.gestio-button__spinner')).not.toBeNull();

    button.click();
    expect(host.clicks()).toBe(0);
    expect(host.submits).toBe(0);
  });

  it('soumet le formulaire avec type="submit" hors chargement', async () => {
    const { fixture, host, button } = await setup();
    host.type.set('submit');
    await fixture.whenStable();

    button.click();
    expect(host.clicks()).toBe(1);
    expect(host.submits).toBe(1);
  });

  it('désactive un lien via aria-disabled et tabindex', async () => {
    const { fixture, host, link } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();

    expect(link.getAttribute('type')).toBeNull();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
