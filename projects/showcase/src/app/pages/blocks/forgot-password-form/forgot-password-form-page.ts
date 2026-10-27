import { Component, signal } from '@angular/core';
import { GestioForgotPasswordForm } from '@gestiolabs336/ui/blocks/forgot-password-form';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-forgot-password-form-page',
  imports: [GestioForgotPasswordForm, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Mot de passe oublié" eyebrow="Blocs">
      <code>gestio-forgot-password-form</code> demande l’adresse e-mail puis, une fois
      <code>sent</code> passé à <code>true</code>, affiche une confirmation (annoncée et focalisée)
      avec un bouton pour renvoyer le lien. Le message ne révèle pas si le compte existe.
    </sc-page-header>

    <sc-example heading="Demande de réinitialisation" [code]="code" stacked>
      <gestio-forgot-password-form
        [headingLevel]="3"
        [sent]="sent()"
        [loading]="pending()"
        (submitted)="send($event.email)"
        (resend)="send($event.email)"
        (backToLogin)="reset()"
      />
      <p class="sc-result" aria-live="polite">
        Liens envoyés : <strong>{{ count() }}</strong>
        @if (lastEmail()) {
          · dernier destinataire : <strong>{{ lastEmail() }}</strong>
        }
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-forgot-password-form" [rows]="api" />
    </section>
  `,
})
export class ForgotPasswordFormPage {
  protected readonly sent = signal(false);
  protected readonly pending = signal(false);
  protected readonly count = signal(0);
  protected readonly lastEmail = signal<string | null>(null);

  protected send(email: string): void {
    this.pending.set(true);
    setTimeout(() => {
      this.pending.set(false);
      this.sent.set(true);
      this.count.update((n) => n + 1);
      this.lastEmail.set(email);
    }, 800);
  }

  protected reset(): void {
    this.sent.set(false);
  }

  protected readonly code = `<gestio-forgot-password-form
  loginHref="/connexion"
  [sent]="sent()"
  [loading]="pending()"
  (submitted)="sendLink($event.email)"
  (resend)="sendLink($event.email)"
/>`;

  protected readonly api: ApiRow[] = [
    { name: 'heading', type: 'string', default: `'Mot de passe oublié'`, description: 'Titre.' },
    { name: 'headingLevel', type: '1 | 2 | 3', default: '1', description: 'Niveau du titre.' },
    {
      name: 'appearance',
      type: `'card' | 'plain'`,
      default: `'card'`,
      description: 'Carte centrée ou formulaire nu.',
    },
    { name: 'initialEmail', type: 'string', default: `''`, description: 'E-mail prérempli.' },
    {
      name: 'sent',
      type: 'boolean',
      default: 'false',
      description: 'Affiche la confirmation d’envoi.',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Bloque la soumission et le renvoi.',
    },
    { name: 'error', type: 'string | null', description: 'Erreur serveur annoncée et focalisée.' },
    {
      name: 'loginHref',
      type: 'string',
      description: 'URL de retour à la connexion ; sans URL, un bouton émet (backToLogin).',
    },
    {
      name: 'labels',
      type: 'Partial<GestioForgotPasswordFormLabels>',
      default: '{}',
      description: 'Libellés ; {email} est remplacé dans le message d’envoi.',
    },
    { name: '(submitted)', type: '{ email }', description: 'E-mail valide soumis.' },
    { name: '(resend)', type: '{ email }', description: 'Clic sur « Renvoyer le lien ».' },
    {
      name: '(backToLogin)',
      type: 'void',
      description: 'Clic sur « Retour à la connexion » sans URL.',
    },
  ];
}
