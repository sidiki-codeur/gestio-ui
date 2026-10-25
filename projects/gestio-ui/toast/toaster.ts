import { Component, computed, inject, input } from '@angular/core';
import { GestioToastService } from './toast.service';
import { GestioToast, GestioToastPosition } from './toast.types';

/**
 * Zone d'affichage des notifications. À placer une seule fois, par exemple
 * dans le template du composant racine : `<gestio-toaster />`.
 *
 * Les notifications sont annoncées par une région live dédiée (CDK
 * LiveAnnouncer) et ne prennent jamais le focus.
 */
@Component({
  selector: 'gestio-toaster',
  templateUrl: './toaster.html',
  styleUrl: './toaster.scss',
})
export class GestioToaster {
  protected readonly service = inject(GestioToastService);

  /** Position de la pile ; à défaut, celle de la configuration. */
  readonly position = input<GestioToastPosition>();
  /** Nom accessible de la région. */
  readonly ariaLabel = input('Notifications');
  readonly closeLabel = input('Fermer la notification');

  protected readonly effectivePosition = computed(
    () => this.position() ?? this.service.config.position,
  );
  protected readonly toasts = this.service.toasts;

  protected readonly variantLabels: Record<GestioToast['variant'], string> = {
    success: 'Succès',
    error: 'Erreur',
    info: 'Information',
    warning: 'Avertissement',
  };

  private readonly hovered = new Set<string>();
  private readonly focused = new Set<string>();

  protected onPointerEnter(id: string): void {
    this.hovered.add(id);
    this.service.pause(id);
  }

  protected onPointerLeave(id: string): void {
    this.hovered.delete(id);
    if (!this.focused.has(id)) this.service.resume(id);
  }

  protected onFocusIn(id: string): void {
    this.focused.add(id);
    this.service.pause(id);
  }

  protected onFocusOut(id: string, event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (container && next && container.contains(next)) return;
    this.focused.delete(id);
    if (!this.hovered.has(id)) this.service.resume(id);
  }

  protected dismiss(id: string): void {
    this.hovered.delete(id);
    this.focused.delete(id);
    this.service.dismiss(id);
  }
}
