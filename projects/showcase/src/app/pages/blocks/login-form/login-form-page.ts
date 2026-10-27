import { Component, signal } from '@angular/core';
import { GestioLoginForm, GestioLoginFormValue } from '@gestiolabs336/ui/blocks/login-form';
import { GestioSocialButton } from '@gestiolabs336/ui/blocks/social-button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-login-form-page',
  imports: [GestioLoginForm, GestioSocialButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Connexion" eyebrow="Blocs">
      <code>gestio-login-form</code> assemble un écran de connexion complet : e-mail, mot de passe
      avec affichage, « Se souvenir de moi », lien de récupération, boutons sociaux et pied. La
      validation repose sur Signal Forms ; le focus va au premier champ en erreur, et l’erreur
      renvoyée par le serveur est annoncée puis focalisée.
    </sc-page-header>

    <sc-example
      heading="Écran de connexion"
      description="Mot de passe de démonstration : gestio. Tout autre mot de passe renvoie une erreur."
      [code]="loginCode"
      stacked
    >
      <gestio-login-form
        subheading="Accédez à votre espace de gestion"
        [headingLevel]="3"
        [loading]="pending()"
        [error]="error()"
        (submitted)="signIn($event)"
        (forgotPassword)="result.set('Lien « Mot de passe oublié ? » activé')"
      >
        <button gestioAuthSocial gestioSocialButton provider="google" fullWidth></button>
        <button gestioAuthSocial gestioSocialButton provider="microsoft" fullWidth></button>
        <p gestioAuthFooter>Pas de compte ? <a href="#inscription">S’inscrire</a></p>
      </gestio-login-form>
      <p class="sc-result" aria-live="polite">
        Résultat : <strong>{{ result() ?? 'aucune soumission' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Version minimale"
      description="Sans boutons sociaux, sans case « Se souvenir de moi », sans carte."
      [code]="plainCode"
      stacked
    >
      <div style="max-width: 24rem">
        <gestio-login-form
          appearance="plain"
          heading="Espace administrateur"
          [headingLevel]="3"
          [showRemember]="false"
          forgotPasswordHref="#mot-de-passe-oublie"
        />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-login-form" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          <code>(submitted)</code> n’est émis que pour un formulaire valide. L’application pilote
          <code>loading</code> et <code>error</code> pendant l’appel serveur ; repassez
          <code>error</code> à <code>null</code> avant un nouvel essai pour que le message soit de
          nouveau focalisé.
        </p>
      </div>
    </section>
  `,
})
export class LoginFormPage {
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<string | null>(null);

  protected signIn(value: GestioLoginFormValue): void {
    this.error.set(null);
    this.pending.set(true);
    setTimeout(() => {
      this.pending.set(false);
      if (value.password === 'gestio') {
        this.result.set(`Connecté : ${value.email}${value.remember ? ' (session conservée)' : ''}`);
      } else {
        this.error.set('Adresse e-mail ou mot de passe incorrect.');
        this.result.set('Échec de connexion');
      }
    }, 900);
  }

  protected readonly loginCode = `<gestio-login-form
  subheading="Accédez à votre espace de gestion"
  forgotPasswordHref="/mot-de-passe-oublie"
  [loading]="pending()"
  [error]="error()"
  (submitted)="signIn($event)"
>
  <button gestioAuthSocial gestioSocialButton provider="google" fullWidth></button>
  <button gestioAuthSocial gestioSocialButton provider="microsoft" fullWidth></button>
  <p gestioAuthFooter>Pas de compte ? <a routerLink="/inscription">S'inscrire</a></p>
</gestio-login-form>`;

  protected readonly plainCode = `<gestio-login-form
  appearance="plain"
  heading="Espace administrateur"
  [showRemember]="false"
  forgotPasswordHref="/mot-de-passe-oublie"
  (submitted)="signIn($event)"
/>`;

  protected readonly api: ApiRow[] = [
    { name: 'heading', type: 'string', default: `'Connexion'`, description: 'Titre.' },
    { name: 'subheading', type: 'string', description: 'Texte sous le titre.' },
    {
      name: 'headingLevel',
      type: '1 | 2 | 3',
      default: '1',
      description: 'Niveau du titre : h1 sur une page dédiée, 2 ou 3 dans une page existante.',
    },
    {
      name: 'appearance',
      type: `'card' | 'plain'`,
      default: `'card'`,
      description: 'Carte centrée ou formulaire nu.',
    },
    { name: 'initialEmail', type: 'string', default: `''`, description: 'E-mail prérempli.' },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Bloque la soumission, indicateur sur le bouton.',
    },
    {
      name: 'error',
      type: 'string | null',
      description: 'Erreur serveur annoncée (role="alert") et focalisée.',
    },
    {
      name: 'showRemember',
      type: 'boolean',
      default: 'true',
      description: 'Case « Se souvenir de moi ».',
    },
    {
      name: 'showForgotPassword',
      type: 'boolean',
      default: 'true',
      description: 'Lien « Mot de passe oublié ? ».',
    },
    {
      name: 'forgotPasswordHref',
      type: 'string',
      description: 'URL du lien ; sans URL, un bouton émet (forgotPassword).',
    },
    {
      name: 'labels',
      type: 'Partial<GestioLoginFormLabels>',
      default: '{}',
      description: 'Libellés et messages.',
    },
    {
      name: '(submitted)',
      type: 'GestioLoginFormValue',
      description: '{ email, password, remember } d’un formulaire valide.',
    },
    {
      name: '(forgotPassword)',
      type: 'void',
      description: 'Clic sur « Mot de passe oublié ? » sans URL.',
    },
    {
      name: '[gestioAuthSocial]',
      type: 'slot',
      description: 'Boutons sociaux, suivis du séparateur « ou ».',
    },
    { name: '[gestioAuthFooter]', type: 'slot', description: 'Pied du bloc.' },
  ];
}
