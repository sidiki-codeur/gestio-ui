import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { GestioAlert } from '@gestiolabs336/ui/alert';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioInput } from '@gestiolabs336/ui/input';

/** Valeur émise à la soumission. */
export interface GestioLoginFormValue {
  email: string;
  password: string;
  remember: boolean;
}

/** Libellés du formulaire de connexion (internationalisation). */
export interface GestioLoginFormLabels {
  email: string;
  password: string;
  remember: string;
  forgotPassword: string;
  submit: string;
  /** Séparateur entre les boutons sociaux et le formulaire. */
  separator: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
}

export const GESTIO_LOGIN_FORM_LABELS: GestioLoginFormLabels = {
  email: 'Adresse e-mail',
  password: 'Mot de passe',
  remember: 'Se souvenir de moi',
  forgotPassword: 'Mot de passe oublié ?',
  submit: 'Se connecter',
  separator: 'ou',
  emailRequired: 'Saisissez votre adresse e-mail.',
  emailInvalid: 'Saisissez une adresse e-mail valide, par exemple nom@entreprise.fr.',
  passwordRequired: 'Saisissez votre mot de passe.',
};

/**
 * Formulaire de connexion : e-mail, mot de passe, « Se souvenir de moi »,
 * lien « Mot de passe oublié ? », boutons sociaux et pied de formulaire.
 *
 * ```html
 * <gestio-login-form
 *   forgotPasswordHref="/mot-de-passe-oublie"
 *   [loading]="pending()"
 *   [error]="error()"
 *   (submitted)="signIn($event)"
 * >
 *   <button gestioAuthSocial gestioSocialButton provider="google" fullWidth></button>
 *   <p gestioAuthFooter>Pas de compte ? <a href="/inscription">S'inscrire</a></p>
 * </gestio-login-form>
 * ```
 *
 * La validation (champs requis, format e-mail) est faite avec Signal Forms ;
 * `submitted` n'est émis que si le formulaire est valide. Sinon le focus va
 * au premier champ en erreur. Quand `error` est renseigné, le message est
 * annoncé et reçoit le focus.
 */
@Component({
  selector: 'gestio-login-form',
  imports: [FormField, GestioAlert, GestioButton, GestioCheckbox, GestioInput],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  host: {
    class: 'gestio-login-form',
    '[class.gestio-auth--plain]': 'appearance() === "plain"',
  },
})
export class GestioLoginForm {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Titre du formulaire. */
  readonly heading = input('Connexion');
  /** Texte sous le titre. */
  readonly subheading = input<string>();
  /** Niveau du titre (`h1` sur une page dédiée, `h2` dans une page qui a déjà un `h1`). */
  readonly headingLevel = input<1 | 2 | 3>(1);
  /** Carte centrée avec bordure (`card`) ou formulaire sans fond ni bordure (`plain`). */
  readonly appearance = input<'card' | 'plain'>('card');
  /** E-mail prérempli (ex. après une inscription). */
  readonly initialEmail = input('');
  /** Bloque la soumission et affiche l'indicateur du bouton. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Erreur renvoyée par le serveur (identifiants invalides…). Annoncée et focalisée. */
  readonly error = input<string | null>();
  /** Affiche la case « Se souvenir de moi ». */
  readonly showRemember = input(true, { transform: booleanAttribute });
  /** Affiche le lien « Mot de passe oublié ? ». */
  readonly showForgotPassword = input(true, { transform: booleanAttribute });
  /** URL du lien « Mot de passe oublié ? ». Sans URL, un bouton émet `forgotPassword`. */
  readonly forgotPasswordHref = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioLoginFormLabels>>({});

  /** Formulaire valide soumis. */
  readonly submitted = output<GestioLoginFormValue>();
  /** Clic sur « Mot de passe oublié ? » (sans `forgotPasswordHref`). */
  readonly forgotPassword = output<void>();

  protected readonly headingId = gestioUniqueId('gestio-login-form');

  protected readonly text = computed<GestioLoginFormLabels>(() => ({
    ...GESTIO_LOGIN_FORM_LABELS,
    ...this.labels(),
  }));

  protected readonly model = linkedSignal<GestioLoginFormValue>(() => ({
    email: this.initialEmail(),
    password: '',
    remember: false,
  }));
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  });

  protected readonly emailError = computed(() => {
    const field = this.loginForm.email();
    if (!field.touched()) return null;
    const kind = field.errors()[0]?.kind;
    if (kind === 'required') return this.text().emailRequired;
    if (kind === 'email') return this.text().emailInvalid;
    return null;
  });

  protected readonly passwordError = computed(() => {
    const field = this.loginForm.password();
    return field.touched() && field.errors().length ? this.text().passwordRequired : null;
  });

  private readonly errorRegion = viewChild<ElementRef<HTMLElement>>('errorRegion');

  constructor() {
    // Erreur serveur : le message reçoit le focus pour être lu immédiatement.
    afterRenderEffect(() => {
      const region = this.errorRegion()?.nativeElement;
      if (region && this.error()) region.focus();
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    this.loginForm().markAsTouched();
    if (this.loginForm().invalid()) {
      this.focusFirstInvalid();
      return;
    }
    this.submitted.emit({ ...this.model() });
  }

  private focusFirstInvalid(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
