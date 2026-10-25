import { CdkMenuTrigger } from '@angular/cdk/menu';
import { FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { GESTIO_MENU_IMPORTS } from './menu';

@Component({
  imports: [GESTIO_MENU_IMPORTS],
  template: `
    <button type="button" class="trigger" [gestioMenuTriggerFor]="menu" menuPlacement="bottom-end">
      Actions
    </button>
    <ng-template #menu>
      <gestio-menu ariaLabel="Actions sur la facture">
        <button gestioMenuItem hint="Ctrl+E" (triggered)="log.set('edit')">Modifier</button>
        <button gestioMenuItem disabled (triggered)="log.set('duplicate')">Dupliquer</button>
        <gestio-menu-divider />
        <button gestioMenuItem variant="danger" (triggered)="log.set('delete')">Supprimer</button>
      </gestio-menu>
    </ng-template>
  `,
})
class Host {
  readonly log = signal('');
}

describe('GestioMenu', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    const settle = () => fixture.whenStable();
    const menu = () => document.querySelector('gestio-menu') as HTMLElement | null;
    const items = () => Array.from(document.querySelectorAll('[gestioMenuItem]')) as HTMLElement[];
    return { fixture, host: fixture.componentInstance, trigger, settle, menu, items };
  }

  afterEach(() => document.querySelector('.cdk-overlay-container')?.replaceChildren());

  it('ouvre le menu au clic avec la sémantique ARIA', async () => {
    const { trigger, settle, menu, items } = await setup();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    await settle();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu()?.getAttribute('role')).toBe('menu');
    expect(menu()?.getAttribute('aria-label')).toBe('Actions sur la facture');
    expect(items().map((item) => item.getAttribute('role'))).toEqual([
      'menuitem',
      'menuitem',
      'menuitem',
    ]);
    expect(items()[0].getAttribute('type')).toBe('button');
    expect(items()[0].textContent).toContain('Ctrl+E');
    expect(document.querySelector('gestio-menu-divider')?.getAttribute('role')).toBe('separator');
  });

  it('insère le menu juste après le déclencheur (popover inline)', async () => {
    const { fixture, trigger } = await setup();
    const cdkTrigger = fixture.debugElement
      .query(By.directive(CdkMenuTrigger))
      .injector.get(CdkMenuTrigger) as unknown as {
      _getOverlayPositionStrategy(): FlexibleConnectedPositionStrategy;
    };
    // Échoue si le CDK retire la méthode interne complétée par GestioMenuTrigger.
    const strategy = cdkTrigger._getOverlayPositionStrategy();
    expect(strategy.getPopoverInsertionPoint()).toBe(trigger);
  });

  it('déclenche une action puis ferme le menu', async () => {
    const { host, trigger, settle, menu, items } = await setup();
    trigger.click();
    await settle();
    items()[2].click();
    await settle();
    expect(host.log()).toBe('delete');
    expect(menu()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('ignore un élément désactivé (aria-disabled, toujours focalisable)', async () => {
    const { host, trigger, settle, items } = await setup();
    trigger.click();
    await settle();
    const disabled = items()[1];
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.hasAttribute('disabled')).toBe(false);
    disabled.click();
    await settle();
    expect(host.log()).toBe('');
  });

  it('ferme avec Échap', async () => {
    const { trigger, settle, menu } = await setup();
    trigger.click();
    await settle();
    menu()!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
      } as KeyboardEventInit),
    );
    await settle();
    expect(menu()).toBeNull();
  });
});
