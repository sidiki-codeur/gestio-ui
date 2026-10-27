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
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, email, form, minLength, required, validate } from '@angular/forms/signals';
import { GestioAlert } from '@gestiolabs336/ui/alert';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioInput } from '@gestiolabs336/ui/input';

/** Valeur émise à la soumission (la confirmation du mot de passe n'est pas incluse). */
export interface GestioSignupFormValue {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

/** Force estimée du mot de passe : 0 (vide) à 4 (très bonne). */
export type GestioPasswordStrength = 0 | 1 | 2 | 3 | 4;

/** Libellés du formulaire d'inscription (internationalisation). */
export interface GestioSignupFormLabels {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  /** Aide sous le mot de passe ; `{min}` est remplacé. */
  passwordHint: string;
  terms: string;
  termsLink: string;
  /** Annonce d'ouverture dans un nouvel onglet (lecteurs d'écran). */
  newTab: string;
  submit: string;
  separator: string;
  /** Préfixe de l'indicateur de force. */
  strength: string;
  /** Niveaux de force, du plus faible au plus fort. */
  strengthLevels: readonly [string, string, string, string];
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  /** `{min}` est remplacé. */
  passwordTooShort: string;
  confirmRequired: string;
  passwordMismatch: string;
  termsRequired: string;
}

export const GESTIO_SIGNUP_FORM_LABELS: GestioSignupFormLabels = {
  name: 'Nom complet',
  email: 'Adresse e-mail professionnelle',
  password: 'Mot de passe',
  confirmPassword: 'Confirmer le mot de passe',
  passwordHint: '{min} caractères minimum. Mélangez majuscules, chiffres et symboles.',
  terms: "J'accepte les conditions générales d'utilisation",
  termsLink: 'Lire les conditions',
  newTab: '(nouvel onglet)',
  submit: 'Créer mon compte',
  separator: 'ou',
  strength: 'Force du mot de passe :',
  strengthLevels: ['faible', 'moyenne', 'bonne', 'très bonne'],
  nameRequired: 'Saisissez votre nom.',
  emailRequired: 'Saisissez votre adresse e-mail.',
  emailInvalid: 'Saisissez une adresse e-mail valide, par exemple nom@entreprise.fr.',
  passwordRequired: 'Choisissez un mot de passe.',
  passwordTooShort: 'Le mot de passe doit contenir au moins {min} caractères.',
  confirmRequired: 'Confirmez votre mot de passe.',
  passwordMismatch: 'Les deux mots de passe ne correspondent pas.',
  termsRequired: 'Vous devez accepter les conditions pour continuer.',
};

interface SignupModel {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Estime la force d'un mot de passe (longueur, variété des caractères).
 * Indication visuelle seulement : la politique réelle reste côté serveur.
 */
export function gestioPasswordStrength(password: string): GestioPasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.max(1, Math.min(4, score - 1)) as GestioPasswordStrength;
}

/**
 * Formulaire d'inscription : nom, e-mail, mot de passe avec indicateur de
 * force, confirmation et acceptation des conditions.
 *
 * ```html
 * <gestio-signup-form termsHref="/cgu" [loading]="pending()" [error]="error()" (submitted)="signUp($event)">
 *   <button gestioAuthSocial gestioSocialButton provider="google" fullWidth></button>
 *   <p gestioAuthFooter>Déjà un compte ? <a href="/connexion">Se connecter</a></p>
 * </gestio-signup-form>
 * ```
 *
 * `submitted` n'est émis que si le formulaire est valide ; sinon le focus va
 * au premier champ en erreur.
 */
@Component({
  selector: 'gestio-signup-form',
  imports: [FormField, GestioAlert, GestioButton, GestioCheckbox, GestioInput],
  templateUrl: './signup-form.html',
  styleUrl: './signup-form.scss',
  host: {
    class: 'gestio-signup-form',
    '[class.gestio-auth--plain]': 'appearance() === "plain"',
  },
})
export class GestioSignupForm {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Titre du formulaire. */
  readonly heading = input('Créer un compte');
  /** Texte sous le titre. */
  readonly subheading = input<string>();
  /** Niveau du titre (`h1` sur une page dédiée). */
  readonly headingLevel = input<1 | 2 | 3>(1);
  /** Carte centrée avec bordure (`card`) ou formulaire sans fond ni bordure (`plain`). */
  readonly appearance = input<'card' | 'plain'>('card');
  /** Longueur minimale du mot de passe. */
  readonly minPasswordLength = input(8, { transform: numberAttribute });
  /** Affiche la case d'acceptation des conditions (obligatoire si affichée). */
  readonly showTerms = input(true, { transform: booleanAttribute });
  /** URL des conditions générales (ouverte dans un nouvel onglet). */
  readonly termsHref = input<string>();
  /** Bloque la soumission et affiche l'indicateur du bouton. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Erreur renvoyée par le serveur (e-mail déjà utilisé…). Annoncée et focalisée. */
  readonly error = input<string | null>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioSignupFormLabels>>({});

  /** Formulaire valide soumis. */
  readonly submitted = output<GestioSignupFormValue>();

  protected readonly headingId = gestioUniqueId('gestio-signup-form');
  protected readonly strengthId = `${this.headingId}-strength`;

  protected readonly text = computed<GestioSignupFormLabels>(() => ({
    ...GESTIO_SIGNUP_FORM_LABELS,
    ...this.labels(),
  }));

  protected readonly model = signal<SignupModel>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  protected readonly signupForm = form(this.model, (path) => {
    required(path.name);
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, () => this.minPasswordLength());
    required(path.confirmPassword);
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password) ? { kind: 'mismatch' } : null,
    );
    validate(path.acceptTerms, ({ value }) =>
      this.showTerms() && !value() ? { kind: 'terms' } : null,
    );
  });

  protected readonly passwordHint = computed(() =>
    this.text().passwordHint.replace('{min}', String(this.minPasswordLength())),
  );

  protected readonly strength = computed(() => gestioPasswordStrength(this.model().password));
  protected readonly strengthText = computed(() => {
    const level = this.strength();
    return level ? `${this.text().strength} ${this.text().strengthLevels[level - 1]}` : '';
  });

  protected readonly nameError = computed(() =>
    this.firstError(this.signupForm.name, { required: this.text().nameRequired }),
  );
  protected readonly emailError = computed(() =>
    this.firstError(this.signupForm.email, {
      required: this.text().emailRequired,
      email: this.text().emailInvalid,
    }),
  );
  protected readonly passwordError = computed(() =>
    this.firstError(this.signupForm.password, {
      required: this.text().passwordRequired,
      minLength: this.text().passwordTooShort.replace('{min}', String(this.minPasswordLength())),
    }),
  );
  protected readonly confirmError = computed(() =>
    this.firstError(this.signupForm.confirmPassword, {
      required: this.text().confirmRequired,
      mismatch: this.text().passwordMismatch,
    }),
  );
  protected readonly termsError = computed(() =>
    this.firstError(this.signupForm.acceptTerms, { terms: this.text().termsRequired }),
  );

  private readonly errorRegion = viewChild<ElementRef<HTMLElement>>('errorRegion');

  constructor() {
    afterRenderEffect(() => {
      const region = this.errorRegion()?.nativeElement;
      if (region && this.error()) region.focus();
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    this.signupForm().markAsTouched();
    if (this.signupForm().invalid()) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }
    const { name, email, password, acceptTerms } = this.model();
    this.submitted.emit({ name: name.trim(), email: email.trim(), password, acceptTerms });
  }

  /** Message du premier code d'erreur connu, une fois le champ touché. */
  private firstError(
    field: () => { touched(): boolean; errors(): readonly { kind: string }[] },
    messages: Record<string, string>,
  ): string | null {
    const state = field();
    if (!state.touched()) return null;
    const kind = state.errors().find((error) => error.kind in messages)?.kind;
    return kind ? messages[kind] : null;
  }
}
