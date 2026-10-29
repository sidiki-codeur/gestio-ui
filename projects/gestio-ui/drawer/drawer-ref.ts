import { DialogRef } from '@angular/cdk/dialog';
import { InjectionToken } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

/** Bord de l'écran contre lequel le panneau s'ouvre (`start`/`end` suivent le sens de lecture). */
export type GestioDrawerPosition = 'end' | 'start' | 'bottom';

/** Taille du panneau : largeur (côtés) ou hauteur maximale (bas). */
export type GestioDrawerSize = 'sm' | 'md' | 'lg';

/** Données transmises au composant affiché dans le panneau. */
export const GESTIO_DRAWER_DATA = new InjectionToken<unknown>('GESTIO_DRAWER_DATA');

/**
 * Référence vers un panneau ouvert par `GestioDrawerService`.
 * Injectable dans le composant de contenu pour fermer le panneau et
 * retourner un résultat à l'appelant.
 */
export class GestioDrawerRef<R = unknown> {
  /** Identifiant du panneau. */
  readonly id: string;
  /** Identifiant appliqué au titre (`aria-labelledby`). */
  readonly titleId: string;
  /** Identifiant appliqué à la description (`aria-describedby`). */
  readonly descriptionId: string;
  /** Émet une fois, à la fermeture, le résultat (ou `undefined` si fermé sans résultat). */
  readonly closed: Observable<R | undefined>;

  constructor(
    private readonly cdkRef: DialogRef<R, unknown>,
    /** Bord d'ouverture du panneau. */
    readonly position: GestioDrawerPosition,
  ) {
    this.id = cdkRef.id;
    this.titleId = `${cdkRef.id}-title`;
    this.descriptionId = `${cdkRef.id}-description`;
    this.closed = cdkRef.closed;
  }

  /** Ferme le panneau en transmettant éventuellement un résultat. */
  close(result?: R): void {
    this.cdkRef.close(result);
  }

  /** Promesse résolue avec le résultat à la fermeture. */
  afterClosed(): Promise<R | undefined> {
    return firstValueFrom(this.closed);
  }
}
