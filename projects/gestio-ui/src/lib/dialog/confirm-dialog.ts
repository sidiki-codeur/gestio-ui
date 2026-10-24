import { Component, inject } from '@angular/core';
import { GestioButton } from '../button/button';
import { GESTIO_DIALOG_DATA, GestioDialogRef } from './dialog-ref';
import { GestioDialog } from './dialog';
import { GestioDialogActions } from './dialog-actions';

export interface GestioConfirmOptions {
  title: string;
  description?: string;
  /** Libellé du bouton de confirmation. « Confirmer » par défaut. */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation. « Annuler » par défaut. */
  cancelLabel?: string;
  /** `danger` pour une action destructrice. */
  variant?: 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
}

/** Modale de confirmation utilisée par `GestioDialogService.confirm()`. */
@Component({
  selector: 'gestio-confirm-dialog',
  imports: [GestioDialog, GestioDialogActions, GestioButton],
  template: `
    <gestio-dialog [title]="options.title" [description]="options.description" [showClose]="false">
      <div gestioDialogActions>
        <button gestioButton variant="outline" cdkFocusInitial (click)="ref.close(false)">
          {{ options.cancelLabel ?? 'Annuler' }}
        </button>
        <button gestioButton [variant]="options.variant ?? 'primary'" (click)="ref.close(true)">
          {{ options.confirmLabel ?? 'Confirmer' }}
        </button>
      </div>
    </gestio-dialog>
  `,
})
export class GestioConfirmDialog {
  protected readonly ref = inject<GestioDialogRef<boolean>>(GestioDialogRef);
  protected readonly options = inject<GestioConfirmOptions>(GESTIO_DIALOG_DATA);
}
