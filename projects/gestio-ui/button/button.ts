import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { GestioSize } from '@gestiolabs336/ui/core';

export type GestioButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type GestioButtonSize = GestioSize;
export type GestioButtonType = 'button' | 'submit' | 'reset';

/**
 * Bouton Gestio, appliqué sur un élément natif `<button>` ou `<a>`.
 *
 * ```html
 * <button gestioButton variant="primary">Enregistrer</button>
 * <button gestioButton variant="outline" [loading]="saving()">Enregistrer</button>
 * <a gestioButton variant="ghost" href="/aide">Aide</a>
 * ```
 *
 * Icônes : projeter un élément portant l'attribut `gestioButtonIcon` (avant le
 * libellé) ou `gestioButtonIconEnd` (après le libellé).
 */
@Component({
  selector: 'button[gestioButton], a[gestioButton]',
  exportAs: 'gestioButton',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    class: 'gestio-button',
    '[class]': 'modifierClasses()',
    '[attr.type]': 'isNativeButton ? type() : null',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.tabindex]': '!isNativeButton && disabled() ? -1 : null',
  },
})
export class GestioButton {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Variante visuelle. */
  readonly variant = input<GestioButtonVariant>('primary');
  /** Taille du bouton. */
  readonly size = input<GestioButtonSize>('md');
  /** Type natif du bouton. `button` par défaut pour éviter les soumissions involontaires. */
  readonly type = input<GestioButtonType>('button');
  /** Désactive le bouton (attribut natif `disabled` sur `<button>`). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Affiche un indicateur de chargement et bloque les activations.
   * Le bouton reste focalisable pour ne pas perdre le focus clavier.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Occupe toute la largeur disponible. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Texte annoncé aux technologies d'assistance pendant le chargement. */
  readonly loadingLabel = input('Chargement en cours');

  protected readonly isNativeButton = this.host.nativeElement.tagName.toLowerCase() === 'button';

  protected readonly modifierClasses = computed(() => {
    const classes = [`gestio-button--${this.variant()}`, `gestio-button--${this.size()}`];
    if (this.fullWidth()) classes.push('gestio-button--full-width');
    if (this.loading()) classes.push('gestio-button--loading');
    return classes.join(' ');
  });

  protected readonly ariaDisabled = computed(() =>
    this.loading() || (!this.isNativeButton && this.disabled()) ? 'true' : null,
  );

  constructor() {
    // Écouteur en phase de capture : il s'exécute avant les écouteurs (click)
    // déclarés par l'application et peut donc les bloquer.
    const element = this.host.nativeElement;
    const blockActivation = (event: Event) => {
      if (this.loading() || this.disabled()) {
        // Bloque la soumission de formulaire, la navigation et les écouteurs de l'hôte.
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    element.addEventListener('click', blockActivation, true);
    inject(DestroyRef).onDestroy(() => element.removeEventListener('click', blockActivation, true));
  }
}
