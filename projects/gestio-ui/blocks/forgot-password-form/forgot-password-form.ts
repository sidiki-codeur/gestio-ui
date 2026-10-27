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
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioInput } from '@gestiolabs336/ui/input';

/** Valeur émise à la soumission et au renvoi. */
export interface GestioForgotPasswordFormValue {
  email: string;
}

/** Libellés du formulaire « Mot de passe oublié » (internationalisation). */
export interface GestioForgotPasswordFormLabels {
  description: string;
  email: string;
  submit: string;
  /** Confirmation d'envoi ; `{email}` est remplacé. */
  sent: string;
  resend: string;
  backToLogin: string;
  emailRequired: string;
  emailInvalid: string;
}

export const GESTIO_FORGOT_PASSWORD_FORM_LABELS: GestioForgotPasswordFormLabels = {
  description:
    'Saisissez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.',
  email: 'Adresse e-mail',
  submit: 'Envoyer le lien',
  sent: 'Si un compte est associé à {email}, vous recevrez un lien de réinitialisation dans quelques minutes. Pensez à vérifier vos courriers indésirables.',
  resend: 'Renvoyer le lien',
  backToLogin: 'Retour à la connexion',
  emailRequired: 'Saisissez votre adresse e-mail.',
  emailInvalid: 'Saisissez une adresse e-mail valide, par exemple nom@entreprise.fr.',
};

/**
 * Formulaire « Mot de passe oublié » : saisie de l'e-mail, puis état
 * « lien envoyé » avec bouton de renvoi.
 *
 * ```html
 * <gestio-forgot-password-form
 *   loginHref="/connexion"
 *   [sent]="sent()"
 *   [loading]="pending()"
 *   (submitted)="sendLink($event.email)"
 *   (resend)="sendLink($event.email)"
 * />
 * ```
 *
 * L'application passe `sent` à `true` après l'envoi : le message de
 * confirmation remplace le formulaire, est annoncé et reçoit le focus.
 */
@Component({
  selector: 'gestio-forgot-password-form',
  imports: [FormField, GestioAlert, GestioButton, GestioInput],
  templateUrl: './forgot-password-form.html',
  styleUrl: './forgot-password-form.scss',
  host: {
    class: 'gestio-forgot-password-form',
    '[class.gestio-auth--plain]': 'appearance() === "plain"',
  },
})
export class GestioForgotPasswordForm {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Titre du formulaire. */
  readonly heading = input('Mot de passe oublié');
  /** Niveau du titre (`h1` sur une page dédiée). */
  readonly headingLevel = input<1 | 2 | 3>(1);
  /** Carte centrée avec bordure (`card`) ou formulaire sans fond ni bordure (`plain`). */
  readonly appearance = input<'card' | 'plain'>('card');
  /** E-mail prérempli (ex. saisi sur l'écran de connexion). */
  readonly initialEmail = input('');
  /** Affiche la confirmation d'envoi à la place du formulaire. */
  readonly sent = input(false, { transform: booleanAttribute });
  /** Bloque la soumission (et le renvoi) et affiche l'indicateur du bouton. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Erreur renvoyée par le serveur. Annoncée et focalisée. */
  readonly error = input<string | null>();
  /** URL de retour à la connexion. Sans URL, un bouton émet `backToLogin`. */
  readonly loginHref = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioForgotPasswordFormLabels>>({});

  /** Formulaire valide soumis. */
  readonly submitted = output<GestioForgotPasswordFormValue>();
  /** Clic sur « Renvoyer le lien » (état `sent`). */
  readonly resend = output<GestioForgotPasswordFormValue>();
  /** Clic sur « Retour à la connexion » (sans `loginHref`). */
  readonly backToLogin = output<void>();

  protected readonly headingId = gestioUniqueId('gestio-forgot-password-form');

  protected readonly text = computed<GestioForgotPasswordFormLabels>(() => ({
    ...GESTIO_FORGOT_PASSWORD_FORM_LABELS,
    ...this.labels(),
  }));

  protected readonly model = linkedSignal<GestioForgotPasswordFormValue>(() => ({
    email: this.initialEmail(),
  }));
  protected readonly forgotForm = form(this.model, (path) => {
    required(path.email);
    email(path.email);
  });

  protected readonly emailError = computed(() => {
    const field = this.forgotForm.email();
    if (!field.touched()) return null;
    const kind = field.errors()[0]?.kind;
    if (kind === 'required') return this.text().emailRequired;
    if (kind === 'email') return this.text().emailInvalid;
    return null;
  });

  protected readonly sentText = computed(() =>
    this.text().sent.replace('{email}', this.model().email.trim()),
  );

  private readonly errorRegion = viewChild<ElementRef<HTMLElement>>('errorRegion');
  private readonly sentRegion = viewChild<ElementRef<HTMLElement>>('sentRegion');

  constructor() {
    afterRenderEffect(() => {
      const region = this.errorRegion()?.nativeElement;
      if (region && this.error()) region.focus();
    });
    // Le formulaire disparaît : le focus est placé sur la confirmation.
    afterRenderEffect(() => {
      this.sentRegion()?.nativeElement.focus();
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    this.forgotForm().markAsTouched();
    if (this.forgotForm().invalid()) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }
    this.submitted.emit({ email: this.model().email.trim() });
  }

  protected onResend(): void {
    if (this.loading()) return;
    this.resend.emit({ email: this.model().email.trim() });
  }
}
