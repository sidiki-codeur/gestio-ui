import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { Injector, Service, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { GESTIO_DIALOG_DATA, GestioDialogRef } from './dialog-ref';
import { GestioConfirmDialog, GestioConfirmOptions } from './confirm-dialog';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioDialogSize = 'sm' | 'md' | 'lg';

export interface GestioDialogConfig<D = unknown> {
  /** Données injectables via `GESTIO_DIALOG_DATA`. */
  data?: D;
  /** Largeur maximale : sm 400 px, md 560 px, lg 800 px. */
  size?: GestioDialogSize;
  /** Fermeture par la touche Échap. `true` par défaut. */
  closeOnEscape?: boolean;
  /** Fermeture par clic sur le fond. `true` par défaut. */
  closeOnBackdropClick?: boolean;
  /** Rôle ARIA. `alertdialog` pour une confirmation importante. */
  role?: 'dialog' | 'alertdialog';
  /**
   * Nom accessible explicite. À fournir si le contenu n'utilise pas
   * `<gestio-dialog title="…">`.
   */
  ariaLabel?: string;
  /**
   * Élément focalisé à l'ouverture : premier élément focalisable (défaut),
   * conteneur (`dialog`), premier titre ou sélecteur CSS.
   * Un élément portant l'attribut `cdkFocusInitial` est prioritaire.
   */
  autoFocus?: 'first-tabbable' | 'dialog' | 'first-heading' | (string & {});
  /** Restaure le focus sur l'élément déclencheur à la fermeture. `true` par défaut. */
  restoreFocus?: boolean;
  /** Classes supplémentaires sur le panneau de l'overlay. */
  panelClass?: string | string[];
  /** Injecteur parent du contenu. */
  injector?: Injector;
  /** Position logique du contenu dans l'arbre de composants. */
  viewContainerRef?: ViewContainerRef;
}

const DIALOG_MAX_WIDTH: Record<GestioDialogSize, string> = {
  sm: '400px',
  md: '560px',
  lg: '800px',
};

/**
 * Ouvre des modales accessibles (piège et restauration du focus, blocage du
 * défilement, fond, Échap) en s'appuyant sur `@angular/cdk/dialog`.
 *
 * Le service ne conserve aucun état propre : l'état des modales ouvertes est
 * porté par le CDK, à l'échelle de l'application (et donc de chaque requête SSR).
 */
@Service()
export class GestioDialogService {
  private readonly cdkDialog = inject(Dialog);

  /** Ouvre un composant ou un template dans une modale. */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config: GestioDialogConfig<D> = {},
  ): GestioDialogRef<R> {
    const size = config.size ?? 'md';
    const closeOnEscape = config.closeOnEscape ?? true;
    const closeOnBackdropClick = config.closeOnBackdropClick ?? true;
    const panelClasses = ['gestio-dialog-pane', `gestio-dialog-pane--${size}`].concat(
      config.panelClass ?? [],
    );
    const id = gestioUniqueId('gestio-dialog');
    let gestioRef: GestioDialogRef<R> | undefined;

    const cdkRef: DialogRef<R, C> = this.cdkDialog.open<R, D, C>(content, {
      id,
      data: config.data,
      role: config.role ?? 'dialog',
      ariaModal: true,
      ariaLabel: config.ariaLabel ?? null,
      // Titre rendu par <gestio-dialog> (voir GestioDialogRef.titleId).
      ariaLabelledBy: config.ariaLabel ? null : `${id}-title`,
      ariaDescribedBy: config.ariaLabel ? null : `${id}-description`,
      autoFocus: config.autoFocus ?? 'first-tabbable',
      restoreFocus: config.restoreFocus ?? true,
      // La fermeture Échap / fond est gérée ci-dessous, séparément.
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'gestio-dialog-backdrop',
      panelClass: panelClasses,
      width: '100%',
      maxWidth: `min(${DIALOG_MAX_WIDTH[size]}, calc(100vw - 2rem))`,
      injector: config.injector,
      viewContainerRef: config.viewContainerRef,
      providers: (ref) => {
        gestioRef = new GestioDialogRef<R>(ref as DialogRef<R, unknown>);
        return [
          { provide: GestioDialogRef, useValue: gestioRef },
          { provide: GESTIO_DIALOG_DATA, useValue: config.data ?? null },
        ];
      },
    });

    // Le CDK appelle `providers` de façon synchrone pendant `open()`.
    const ref = gestioRef ?? new GestioDialogRef<R>(cdkRef as DialogRef<R, unknown>);

    cdkRef.keydownEvents.subscribe((event) => {
      if (
        closeOnEscape &&
        event.key === 'Escape' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        ref.close();
      }
    });

    cdkRef.backdropClick.subscribe(() => {
      if (closeOnBackdropClick) ref.close();
    });

    return ref;
  }

  /**
   * Ouvre une modale de confirmation prête à l'emploi.
   * Résultat : `true` (confirmé), `false` (annulé) ou `undefined` (Échap / fond).
   */
  confirm(options: GestioConfirmOptions): GestioDialogRef<boolean> {
    return this.open<boolean, GestioConfirmOptions>(GestioConfirmDialog, {
      data: options,
      size: options.size ?? 'sm',
      role: 'alertdialog',
      closeOnBackdropClick: options.closeOnBackdropClick ?? false,
      closeOnEscape: options.closeOnEscape ?? true,
    });
  }

  /** Ferme toutes les modales ouvertes. */
  closeAll(): void {
    this.cdkDialog.closeAll();
  }
}
