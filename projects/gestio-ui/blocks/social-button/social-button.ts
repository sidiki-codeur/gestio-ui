import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

/** Fournisseurs d'identité pris en charge. */
export type GestioSocialProvider = 'google' | 'github' | 'microsoft' | 'apple';

/** Libellés par défaut, par fournisseur (internationalisation). */
export interface GestioSocialButtonLabels {
  google: string;
  github: string;
  microsoft: string;
  apple: string;
  /** Texte annoncé pendant le chargement. */
  loading: string;
}

export const GESTIO_SOCIAL_BUTTON_LABELS: GestioSocialButtonLabels = {
  google: 'Continuer avec Google',
  github: 'Continuer avec GitHub',
  microsoft: 'Continuer avec Microsoft',
  apple: 'Continuer avec Apple',
  loading: 'Connexion en cours',
};

/**
 * Bouton de connexion via un fournisseur d'identité (Google, GitHub,
 * Microsoft, Apple), appliqué sur un `<button>` ou un `<a>` natif.
 *
 * ```html
 * <button gestioSocialButton provider="google" fullWidth (click)="signInWithGoogle()"></button>
 * <a gestioSocialButton provider="github" href="/auth/github">Se connecter avec GitHub</a>
 * ```
 *
 * Sans contenu projeté, le libellé par défaut est « Continuer avec <fournisseur> ».
 * Le bouton Google respecte la charte Google Identity (logo « G » multicolore,
 * fond blanc et bordure grise en thème clair, fond sombre en thème sombre).
 */
@Component({
  selector: 'button[gestioSocialButton], a[gestioSocialButton]',
  exportAs: 'gestioSocialButton',
  templateUrl: './social-button.html',
  styleUrl: './social-button.scss',
  host: {
    class: 'gestio-social-button',
    '[class]': 'modifierClasses()',
    '[attr.type]': 'isNativeButton ? "button" : null',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.tabindex]': '!isNativeButton && disabled() ? -1 : null',
  },
})
export class GestioSocialButton {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Fournisseur d'identité : logo, couleurs et libellé par défaut. */
  readonly provider = input.required<GestioSocialProvider>();
  /** Désactive le bouton. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Affiche un indicateur de chargement et bloque les activations (le focus est conservé). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Occupe toute la largeur disponible. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioSocialButtonLabels>>({});

  protected readonly isNativeButton = this.host.nativeElement.tagName.toLowerCase() === 'button';

  protected readonly text = computed<GestioSocialButtonLabels>(() => ({
    ...GESTIO_SOCIAL_BUTTON_LABELS,
    ...this.labels(),
  }));

  protected readonly modifierClasses = computed(() => {
    const classes = [`gestio-social-button--${this.provider()}`];
    if (this.fullWidth()) classes.push('gestio-social-button--full-width');
    if (this.loading()) classes.push('gestio-social-button--loading');
    return classes.join(' ');
  });

  protected readonly ariaDisabled = computed(() =>
    this.loading() || (!this.isNativeButton && this.disabled()) ? 'true' : null,
  );

  constructor() {
    // Phase de capture : bloque les écouteurs (click) de l'application pendant le chargement.
    const element = this.host.nativeElement;
    const blockActivation = (event: Event) => {
      if (this.loading() || this.disabled()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    element.addEventListener('click', blockActivation, true);
    inject(DestroyRef).onDestroy(() => element.removeEventListener('click', blockActivation, true));
  }
}
