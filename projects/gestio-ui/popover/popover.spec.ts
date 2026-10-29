import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioPopoverPosition, GestioPopoverTrigger } from './popover';

@Component({
  imports: [GestioPopoverTrigger],
  template: `
    <button
      type="button"
      class="trigger"
      [gestioPopoverTrigger]="content"
      popoverAriaLabel="Filtres des factures"
      [popoverPosition]="position()"
      [popoverArrow]="arrow()"
      [(popoverOpen)]="open"
      (opened)="events.push('opened')"
      (closed)="events.push('closed')"
      #pop="gestioPopoverTrigger"
    >
      Filtres
    </button>
    <button type="button" class="outside">Ailleurs</button>
    <ng-template #content let-close="close">
      <label><input type="checkbox" class="first" /> En retard</label>
      <button type="button" class="apply" (click)="applied.set(true); close()">Appliquer</button>
    </ng-template>
  `,
})
class Host {
  readonly open = signal(false);
  readonly position = signal<GestioPopoverPosition>('bottom');
  readonly arrow = signal(true);
  readonly applied = signal(false);
  readonly events: string[] = [];
}

describe('GestioPopoverTrigger', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector('.trigger') as HTMLButtonElement;
    const panel = () => document.querySelector('.gestio-popover') as HTMLElement | null;
    const settle = () => fixture.whenStable();
    return { fixture, host: fixture.componentInstance, el, trigger, panel, settle };
  }

  function press(target: Element, key: string) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }

  afterEach(() => {
    document.querySelectorAll('.gestio-popover').forEach((node) => node.remove());
  });

  it('pose la sémantique ARIA sur le déclencheur et la fenêtre', async () => {
    const { trigger, panel, settle } = await setup();
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);

    trigger.click();
    await settle();
    const dialog = panel()!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Filtres des factures');
    expect(dialog.hasAttribute('aria-modal')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
  });

  it('déplace le focus dans la fenêtre puis le rend au déclencheur avec Échap', async () => {
    const { host, trigger, panel, settle } = await setup();
    trigger.focus();
    trigger.click();
    await settle();
    // jsdom ne calcule pas la visibilité : le CDK ne trouve pas d'élément tabulable
    // et le focus se replie sur la fenêtre. Dans un navigateur, la case est focalisée.
    expect(panel()!.contains(document.activeElement)).toBe(true);
    const first = panel()!.querySelector('.first') as HTMLInputElement;

    press(first, 'Escape');
    await settle();
    expect(panel()).toBeNull();
    expect(host.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('ferme depuis le contenu via close() du contexte', async () => {
    const { host, trigger, panel, settle } = await setup();
    trigger.click();
    await settle();
    (panel()!.querySelector('.apply') as HTMLButtonElement).click();
    await settle();
    expect(host.applied()).toBe(true);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('ferme au clic extérieur, et le déclencheur bascule l’état', async () => {
    const { el, trigger, panel, settle } = await setup();
    trigger.click();
    await settle();
    expect(panel()).not.toBeNull();

    trigger.click();
    await settle();
    expect(panel()).toBeNull();

    trigger.click();
    await settle();
    const outside = el.querySelector('.outside') as HTMLButtonElement;
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(panel()).toBeNull();
  });

  it('se pilote par [(popoverOpen)] et affiche la flèche du côté retenu', async () => {
    const { host, trigger, panel, settle } = await setup();
    host.position.set('end');
    host.open.set(true);
    await settle();
    expect(panel()).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel()!.querySelector('.gestio-popover__arrow')).not.toBeNull();
    expect(['left', 'right', 'top', 'bottom']).toContain(panel()!.dataset['placement']);

    host.open.set(false);
    await settle();
    expect(panel()).toBeNull();

    host.arrow.set(false);
    host.open.set(true);
    await settle();
    expect(panel()!.querySelector('.gestio-popover__arrow')).toBeNull();
  });
});
