import { Component, signal } from '@angular/core';
import { GestioSignupForm, GestioSignupFormValue } from '@gestiolabs336/ui/blocks/signup-form';
import { GestioSocialButton } from '@gestiolabs336/ui/blocks/social-button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-signup-form-page',
  imports: [GestioSignupForm, GestioSocialButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Inscription" eyebrow="Blocs">
      <code>gestio-signup-form</code> crée un compte : nom, e-mail, mot de passe avec indicateur de
      force, confirmation et acceptation des conditions. La force est donnée par une barre et par un
      texte annoncé aux lecteurs d’écran.
    </sc-page-header>

    <sc-example
      heading="Création de compte"
      description="L’adresse deja@pris.fr simule un e-mail déjà utilisé."
      [code]="signupCode"
      stacked
    >
      <gestio-signup-form
        subheading="14 jours d’essai gratuit, sans carte bancaire"
        termsHref="#conditions"
        [headingLevel]="3"
        [loading]="pending()"
        [error]="error()"
        (submitted)="signUp($event)"
      >
        <button gestioAuthSocial gestioSocialButton provider="google" fullWidth>
          S’inscrire avec Google
        </button>
        <p gestioAuthFooter>Déjà un compte ? <a href="#connexion">Se connecter</a></p>
      </gestio-signup-form>
      <p class="sc-result" aria-live="polite">
        Résultat : <strong>{{ result() ?? 'aucune soumission' }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-signup-form" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          L’indicateur de force (<code>gestioPasswordStrength()</code>, exportée) est indicatif : la
          politique de mot de passe doit être vérifiée côté serveur. La confirmation n’est pas
          incluse dans la valeur émise.
        </p>
      </div>
    </section>
  `,
})
export class SignupFormPage {
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<string | null>(null);

  protected signUp(value: GestioSignupFormValue): void {
    this.error.set(null);
    this.pending.set(true);
    setTimeout(() => {
      this.pending.set(false);
      if (value.email === 'deja@pris.fr') {
        this.error.set('Un compte existe déjà avec cette adresse e-mail.');
        this.result.set('Échec de l’inscription');
      } else {
        this.result.set(`Compte créé pour ${value.name} (${value.email})`);
      }
    }, 900);
  }

  protected readonly signupCode = `<gestio-signup-form
  subheading="14 jours d'essai gratuit, sans carte bancaire"
  termsHref="/conditions"
  [loading]="pending()"
  [error]="error()"
  (submitted)="signUp($event)"
>
  <button gestioAuthSocial gestioSocialButton provider="google" fullWidth>
    S'inscrire avec Google
  </button>
  <p gestioAuthFooter>Déjà un compte ? <a routerLink="/connexion">Se connecter</a></p>
</gestio-signup-form>`;

  protected readonly api: ApiRow[] = [
    { name: 'heading', type: 'string', default: `'Créer un compte'`, description: 'Titre.' },
    { name: 'subheading', type: 'string', description: 'Texte sous le titre.' },
    { name: 'headingLevel', type: '1 | 2 | 3', default: '1', description: 'Niveau du titre.' },
    {
      name: 'appearance',
      type: `'card' | 'plain'`,
      default: `'card'`,
      description: 'Carte centrée ou formulaire nu.',
    },
    {
      name: 'minPasswordLength',
      type: 'number',
      default: '8',
      description: 'Longueur minimale du mot de passe.',
    },
    {
      name: 'showTerms',
      type: 'boolean',
      default: 'true',
      description: 'Case d’acceptation des conditions (obligatoire si affichée).',
    },
    {
      name: 'termsHref',
      type: 'string',
      description: 'URL des conditions, ouverte dans un nouvel onglet.',
    },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Bloque la soumission.' },
    { name: 'error', type: 'string | null', description: 'Erreur serveur annoncée et focalisée.' },
    {
      name: 'labels',
      type: 'Partial<GestioSignupFormLabels>',
      default: '{}',
      description: 'Libellés et messages.',
    },
    {
      name: '(submitted)',
      type: 'GestioSignupFormValue',
      description: '{ name, email, password, acceptTerms } d’un formulaire valide.',
    },
    {
      name: '[gestioAuthSocial]',
      type: 'slot',
      description: 'Boutons sociaux + séparateur « ou ».',
    },
    { name: '[gestioAuthFooter]', type: 'slot', description: 'Pied du bloc.' },
  ];
}
