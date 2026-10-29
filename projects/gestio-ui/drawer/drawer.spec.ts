import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GESTIO_DRAWER_IMPORTS } from './drawer';
import { GESTIO_DRAWER_DATA, GestioDrawerPosition, GestioDrawerRef } from './drawer-ref';
import { GestioDrawerService } from './drawer.service';

@Component({
  imports: [GESTIO_DRAWER_IMPORTS],
  template: `
    <button id="trigger" type="button" (click)="open.set(true)">Ouvrir</button>
    <gestio-drawer
      [(open)]="open"
      heading="Facture F-2024-0042"
      description="Émise le 12 mars"
      [position]="position()"
      [closeOnBackdropClick]="closeOnBackdrop()"
      [labels]="{ close: 'Fermer la facture' }"
    >
      <span gestioDrawerHeader class="badge">Payée</span>
      <p class="body">Montant : 1 250 €</p>
      <div gestioDrawerFooter>
        <button type="button" class="done" (click)="open.set(false)">Terminer</button>
      </div>
    </gestio-drawer>
  `,
})
class Host {
  readonly open = signal(false);
  readonly position = signal<GestioDrawerPosition>('end');
  readonly closeOnBackdrop = signal(true);
}

@Component({
  imports: [GESTIO_DRAWER_IMPORTS],
  template: `
    <gestio-drawer-content heading="Client {{ data.name }}">
      <button type="button" class="ok" (click)="ref.close('ok')">Valider</button>
    </gestio-drawer-content>
  `,
})
class ClientDrawer {
  readonly ref = inject<GestioDrawerRef<string>>(GestioDrawerRef);
  readonly data = inject<{ name: string }>(GESTIO_DRAWER_DATA);
}

async function settle(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

function container(): HTMLElement | null {
  return document.querySelector('.cdk-dialog-container');
}

function pressEscape(): void {
  container()!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
}

describe('GestioDrawer', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    return { fixture, host: fixture.componentInstance, trigger };
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.replaceChildren());
  });

  it('ne rend rien tant que le panneau est fermé', async () => {
    await setup();
    expect(container()).toBeNull();
  });

  it('ouvre un dialogue modal nommé et décrit, avec les slots projetés', async () => {
    const { host, fixture } = await setup();
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    const element = container()!;
    expect(element.getAttribute('role')).toBe('dialog');
    expect(element.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(element.getAttribute('aria-labelledby')!);
    expect(title?.textContent).toContain('Facture F-2024-0042');
    const description = document.getElementById(element.getAttribute('aria-describedby')!);
    expect(description?.textContent).toContain('12 mars');
    expect(element.querySelector('.gestio-drawer__header-extra .badge')).not.toBeNull();
    expect(element.querySelector('.gestio-drawer__body .body')).not.toBeNull();
    expect(element.querySelector('.gestio-drawer__footer .done')).not.toBeNull();
    expect(document.querySelector('.gestio-drawer-pane--end')).not.toBeNull();
    expect(element.querySelector('.gestio-drawer-content--end')).not.toBeNull();
  });

  it('se ferme avec Échap et met à jour [(open)]', async () => {
    const { host, fixture } = await setup();
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    pressEscape();
    await settle();
    expect(host.open()).toBe(false);
    expect(container()).toBeNull();
  });

  it('déplace le focus dans le panneau puis le restaure sur le déclencheur', async () => {
    const { host, fixture, trigger } = await setup();
    trigger.focus();
    host.open.set(true);
    await fixture.whenStable();
    await settle();
    expect(container()!.contains(document.activeElement)).toBe(true);

    pressEscape();
    await settle();
    expect(document.activeElement).toBe(trigger);
  });

  it('se ferme par le bouton de fermeture, libellé via labels', async () => {
    const { host, fixture } = await setup();
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    const close = container()!.querySelector('.gestio-drawer__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fermer la facture');
    close.click();
    await settle();
    expect(host.open()).toBe(false);
  });

  it('se ferme quand open repasse à false', async () => {
    const { host, fixture } = await setup();
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    (container()!.querySelector('.done') as HTMLButtonElement).click();
    await fixture.whenStable();
    await settle();
    expect(container()).toBeNull();
  });

  it('respecte closeOnBackdropClick', async () => {
    const { host, fixture } = await setup();
    host.closeOnBackdrop.set(false);
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    await settle();
    expect(host.open()).toBe(true);
    expect(container()).not.toBeNull();
  });

  it('se ferme au clic sur le fond par défaut', async () => {
    const { host, fixture } = await setup();
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    await settle();
    expect(host.open()).toBe(false);
  });

  it('positionne le panneau en bas', async () => {
    const { host, fixture } = await setup();
    host.position.set('bottom');
    host.open.set(true);
    await fixture.whenStable();
    await settle();

    expect(document.querySelector('.gestio-drawer-pane--bottom')).not.toBeNull();
    expect(container()!.querySelector('.gestio-drawer-content--from-bottom')).not.toBeNull();
  });
});

describe('GestioDrawerService', () => {
  let service: GestioDrawerService;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    service = TestBed.inject(GestioDrawerService);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.replaceChildren());
  });

  it('ouvre un composant, transmet les données et retourne le résultat', async () => {
    const ref = service.open<string, { name: string }>(ClientDrawer, {
      data: { name: 'Atelier Moreau' },
      position: 'start',
    });
    await settle();

    const element = container()!;
    expect(ref.position).toBe('start');
    const title = document.getElementById(element.getAttribute('aria-labelledby')!);
    expect(title?.textContent).toContain('Client Atelier Moreau');
    expect(element.querySelector('.gestio-drawer-content--start')).not.toBeNull();

    const result = ref.afterClosed();
    (element.querySelector('.ok') as HTMLButtonElement).click();
    await expect(result).resolves.toBe('ok');
  });

  it('se ferme avec Échap sans résultat, sauf si désactivé', async () => {
    const ref = service.open(ClientDrawer, {
      data: { name: 'A' },
      closeOnEscape: false,
    });
    await settle();
    let closed = false;
    ref.closed.subscribe(() => (closed = true));
    pressEscape();
    await settle();
    expect(closed).toBe(false);

    ref.close();
    const second = service.open(ClientDrawer, { data: { name: 'B' } });
    await settle();
    const result = second.afterClosed();
    pressEscape();
    await expect(result).resolves.toBeUndefined();
  });

  it('le bouton de fermeture du contenu ferme le panneau', async () => {
    const ref = service.open(ClientDrawer, { data: { name: 'A' } });
    await settle();
    const result = ref.afterClosed();
    (container()!.querySelector('.gestio-drawer__close') as HTMLButtonElement).click();
    await expect(result).resolves.toBeUndefined();
  });
});
