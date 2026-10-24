import { DialogRef } from '@angular/cdk/dialog';
import { InjectionToken } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

/** Données transmises au composant affiché dans la modale. */
export const GESTIO_DIALOG_DATA = new InjectionToken<unknown>('GESTIO_DIALOG_DATA');

/**
 * Référence vers une modale ouverte par `GestioDialogService`.
 * Injectable dans le composant de contenu pour fermer la modale et
 * retourner un résultat à l'appelant.
 */
export class GestioDialogRef<R = unknown> {
  /** Identifiant de la modale. */
  readonly id: string;
  /** Identifiant appliqué au titre (`aria-labelledby`). */
  readonly titleId: string;
  /** Identifiant appliqué à la description (`aria-describedby`). */
  readonly descriptionId: string;
  /** Émet une fois, à la fermeture, le résultat (ou `undefined` si fermée sans résultat). */
  readonly closed: Observable<R | undefined>;

  constructor(private readonly cdkRef: DialogRef<R, unknown>) {
    this.id = cdkRef.id;
    this.titleId = `${cdkRef.id}-title`;
    this.descriptionId = `${cdkRef.id}-description`;
    this.closed = cdkRef.closed;
  }

  /** Ferme la modale en transmettant éventuellement un résultat. */
  close(result?: R): void {
    this.cdkRef.close(result);
  }

  /** Promesse résolue avec le résultat à la fermeture. */
  afterClosed(): Promise<R | undefined> {
    return firstValueFrom(this.closed);
  }
}
