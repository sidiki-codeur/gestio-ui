import { LiveAnnouncer } from '@angular/cdk/a11y';
import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, PLATFORM_ID, Service, inject, signal } from '@angular/core';
import { gestioUniqueId } from '../core/id';
import {
  GESTIO_TOAST_CONFIG,
  GESTIO_TOAST_DEFAULTS,
  GestioToast,
  GestioToastConfig,
  GestioToastOptions,
  GestioToastVariant,
} from './toast.types';

interface ToastTimer {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
}

/**
 * Affiche des notifications éphémères dans `<gestio-toaster>`.
 *
 * L'état est porté par l'instance du service, fournie à la racine de
 * l'application : en SSR, chaque requête dispose de sa propre instance.
 * Les minuteurs et les annonces ne sont créés que dans le navigateur.
 */
@Service()
export class GestioToastService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly announcer = inject(LiveAnnouncer);
  private readonly timers = new Map<string, ToastTimer>();
  private readonly toastsState = signal<readonly GestioToast[]>([]);

  /** Configuration effective (valeurs par défaut + `provideGestioToast`). */
  readonly config: GestioToastConfig = {
    ...GESTIO_TOAST_DEFAULTS,
    ...inject(GESTIO_TOAST_CONFIG, { optional: true }),
  };

  /** Notifications visibles, de la plus ancienne à la plus récente. */
  readonly toasts = this.toastsState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  success(message: string, options?: GestioToastOptions): string {
    return this.show('success', message, options);
  }

  error(message: string, options?: GestioToastOptions): string {
    return this.show('error', message, options);
  }

  info(message: string, options?: GestioToastOptions): string {
    return this.show('info', message, options);
  }

  warning(message: string, options?: GestioToastOptions): string {
    return this.show('warning', message, options);
  }

  /** Affiche une notification et retourne son identifiant. */
  show(variant: GestioToastVariant, message: string, options: GestioToastOptions = {}): string {
    const toast: GestioToast = {
      id: gestioUniqueId('gestio-toast'),
      variant,
      message,
      title: options.title,
      duration: Math.max(0, options.duration ?? this.config.duration),
    };

    const maxVisible = Math.max(1, this.config.maxVisible);
    const next = [...this.toastsState(), toast];
    const overflow = next.splice(0, Math.max(0, next.length - maxVisible));
    overflow.forEach((removed) => this.clearTimer(removed.id));
    this.toastsState.set(next);

    if (this.isBrowser) {
      if (toast.duration > 0) {
        this.timers.set(toast.id, { handle: null, remaining: toast.duration, startedAt: 0 });
        this.resume(toast.id);
      }
      // Erreurs et avertissements : annonce immédiate ; sinon annonce polie.
      const politeness = variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';
      void this.announcer.announce(
        toast.title ? `${toast.title}. ${toast.message}` : toast.message,
        politeness,
      );
    }

    return toast.id;
  }

  /** Ferme une notification. */
  dismiss(id: string): void {
    this.clearTimer(id);
    this.toastsState.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /** Ferme toutes les notifications et annule leurs minuteurs. */
  clear(): void {
    for (const id of this.timers.keys()) this.clearTimer(id);
    this.toastsState.set([]);
  }

  /** Suspend la fermeture automatique (survol, focus). */
  pause(id: string): void {
    const timer = this.timers.get(id);
    if (!timer || timer.handle === null) return;
    clearTimeout(timer.handle);
    timer.handle = null;
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  }

  /** Reprend la fermeture automatique avec le temps restant. */
  resume(id: string): void {
    const timer = this.timers.get(id);
    if (!timer || timer.handle !== null) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), timer.remaining);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer?.handle != null) clearTimeout(timer.handle);
    this.timers.delete(id);
  }
}
