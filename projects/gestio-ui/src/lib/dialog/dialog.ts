import { Component, booleanAttribute, input, inject } from '@angular/core';
import { gestioUniqueId } from '../core/id';
import { GestioDialogActions } from './dialog-actions';
import { GestioDialogRef } from './dialog-ref';

/**
 * Mise en page d'une modale : titre, description, contenu défilant et actions.
 * À utiliser dans le composant (ou template) ouvert par `GestioDialogService`,
 * avec `GestioDialogActions` pour la zone d'actions (ou `GESTIO_DIALOG_IMPORTS`).
 *
 * ```html
 * <gestio-dialog title="Supprimer le client" description="Cette action est définitive.">
 *   <p>Contenu…</p>
 *   <div gestioDialogActions>
 *     <button gestioButton variant="ghost" (click)="ref.close(false)">Annuler</button>
 *     <button gestioButton variant="danger" (click)="ref.close(true)">Supprimer</button>
 *   </div>
 * </gestio-dialog>
 * ```
 */
@Component({
  selector: 'gestio-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
  host: { class: 'gestio-dialog' },
})
export class GestioDialog {
  private readonly ref = inject(GestioDialogRef, { optional: true });

  /** Titre de la modale, utilisé comme nom accessible. */
  readonly title = input.required<string>();
  /** Description courte, reliée par `aria-describedby`. */
  readonly description = input<string>();
  /** Affiche le bouton de fermeture dans l'en-tête. */
  readonly showClose = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Fermer');

  private readonly fallbackId = gestioUniqueId('gestio-dialog-layout');
  protected readonly titleId = this.ref?.titleId ?? `${this.fallbackId}-title`;
  protected readonly descriptionId = this.ref?.descriptionId ?? `${this.fallbackId}-description`;

  protected close(): void {
    this.ref?.close();
  }
}

/** Imports nécessaires pour composer le contenu d'une modale. */
export const GESTIO_DIALOG_IMPORTS = [GestioDialog, GestioDialogActions] as const;
