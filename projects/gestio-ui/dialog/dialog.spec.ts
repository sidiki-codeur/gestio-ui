import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GESTIO_DIALOG_IMPORTS } from './dialog';
import { GESTIO_DIALOG_DATA, GestioDialogRef } from './dialog-ref';
import { GestioDialogConfig, GestioDialogService } from './dialog.service';

@Component({
  imports: [GESTIO_DIALOG_IMPORTS, GestioButton],
  template: `
    <gestio-dialog title="Archiver la facture" description="Elle restera consultable.">
      <p>Facture {{ data.numero }}</p>
      <div gestioDialogActions>
        <button gestioButton class="cancel" (click)="ref.close('annule')">Annuler</button>
        <button gestioButton class="ok" (click)="ref.close('archive')">Archiver</button>
      </div>
    </gestio-dialog>
  `,
})
class ArchiveDialog {
  readonly ref = inject<GestioDialogRef<string>>(GestioDialogRef);
  readonly data = inject<{ numero: string }>(GESTIO_DIALOG_DATA);
}

@Component({
  template: `<button id="trigger" type="button">Ouvrir</button>`,
})
class Host {}

describe('GestioDialogService', () => {
  let service: GestioDialogService;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    service = TestBed.inject(GestioDialogService);
  });

  afterEach(() => service.closeAll());

  function open(config: GestioDialogConfig<{ numero: string }> = {}) {
    return service.open<string, { numero: string }>(ArchiveDialog, {
      data: { numero: 'F-2024-001' },
      ...config,
    });
  }

  async function settle(): Promise<void> {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  function container(): HTMLElement {
    return document.querySelector('.cdk-dialog-container') as HTMLElement;
  }

  function pressEscape(): void {
    container().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
  }

  it('rend le contenu avec une sémantique de dialogue nommée et décrite', async () => {
    open();
    await settle();

    const element = container();
    expect(element.getAttribute('role')).toBe('dialog');
    expect(element.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(element.getAttribute('aria-labelledby')!);
    expect(title?.textContent).toContain('Archiver la facture');
    const description = document.getElementById(element.getAttribute('aria-describedby')!);
    expect(description?.textContent).toContain('consultable');
    expect(element.textContent).toContain('F-2024-001');
  });

  it('retourne le résultat à l’appelant à la fermeture', async () => {
    const ref = open();
    await settle();
    const result = ref.afterClosed();

    (document.querySelector('.ok') as HTMLButtonElement).click();
    await expect(result).resolves.toBe('archive');
    expect(container()).toBeNull();
  });

  it('se ferme avec Échap par défaut, sans résultat', async () => {
    const ref = open();
    await settle();
    const result = ref.afterClosed();

    pressEscape();
    await expect(result).resolves.toBeUndefined();
  });

  it('ignore Échap et le fond si la configuration le demande', async () => {
    const ref = open({ closeOnEscape: false, closeOnBackdropClick: false });
    await settle();
    let closed = false;
    ref.closed.subscribe(() => (closed = true));

    pressEscape();
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    await settle();
    expect(closed).toBe(false);
    expect(container()).not.toBeNull();
  });

  it('se ferme au clic sur le fond par défaut', async () => {
    const ref = open();
    await settle();
    const result = ref.afterClosed();

    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    await expect(result).resolves.toBeUndefined();
  });

  it('confirm() retourne true quand l’utilisateur confirme', async () => {
    const ref = service.confirm({ title: 'Supprimer ce client ?', confirmLabel: 'Supprimer' });
    await settle();
    expect(container().getAttribute('role')).toBe('alertdialog');
    const result = ref.afterClosed();

    const buttons = Array.from(container().querySelectorAll('button'));
    buttons.find((button) => button.textContent?.includes('Supprimer'))!.click();
    await expect(result).resolves.toBe(true);
  });
});
