import { Component, signal } from '@angular/core';
import { GestioSocialButton } from '@gestiolabs336/ui/blocks/social-button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-social-button-page',
  imports: [GestioSocialButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Boutons sociaux" eyebrow="Blocs">
      L’attribut <code>gestioSocialButton</code> transforme un <code>&lt;button&gt;</code> ou un
      <code>&lt;a&gt;</code> natif en bouton « Continuer avec Google, GitHub, Microsoft ou Apple ».
      Le logo est décoratif (<code>aria-hidden</code>) : le nom accessible est le libellé. Le bouton
      Google suit la charte Google Identity, en thème clair comme en sombre.
    </sc-page-header>

    <sc-example heading="Fournisseurs" [code]="providersCode" stacked>
      <div class="sc-stack" style="max-width: 22rem">
        <button
          gestioSocialButton
          provider="google"
          fullWidth
          (click)="last.set('Google')"
        ></button>
        <button
          gestioSocialButton
          provider="microsoft"
          fullWidth
          (click)="last.set('Microsoft')"
        ></button>
        <button
          gestioSocialButton
          provider="github"
          fullWidth
          (click)="last.set('GitHub')"
        ></button>
        <button gestioSocialButton provider="apple" fullWidth (click)="last.set('Apple')"></button>
      </div>
      <p class="sc-result" aria-live="polite">
        Dernier fournisseur choisi : <strong>{{ last() ?? 'aucun' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Chargement, désactivé et libellé personnalisé"
      description="Pendant le chargement, le bouton reste focalisable mais n’est plus activable."
      [code]="statesCode"
    >
      <button gestioSocialButton provider="google" [loading]="loading()" (click)="simulate()">
        Se connecter avec Google
      </button>
      <button gestioSocialButton provider="github" disabled></button>
      <a gestioSocialButton provider="microsoft" href="#microsoft">Compte professionnel</a>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestioSocialButton" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Dans <code>gestio-login-form</code> ou <code>gestio-signup-form</code>, ajoutez l’attribut
          <code>gestioAuthSocial</code> pour placer le bouton au-dessus du formulaire. Le bouton ne
          lance aucun flux OAuth : branchez votre propre redirection sur <code>(click)</code> ou
          utilisez un lien.
        </p>
      </div>
    </section>
  `,
})
export class SocialButtonPage {
  protected readonly last = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected simulate(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1500);
  }

  protected readonly providersCode = `<button gestioSocialButton provider="google" fullWidth (click)="signIn('google')"></button>
<button gestioSocialButton provider="microsoft" fullWidth (click)="signIn('microsoft')"></button>
<button gestioSocialButton provider="github" fullWidth (click)="signIn('github')"></button>
<button gestioSocialButton provider="apple" fullWidth (click)="signIn('apple')"></button>`;

  protected readonly statesCode = `<button gestioSocialButton provider="google" [loading]="loading()">
  Se connecter avec Google
</button>
<button gestioSocialButton provider="github" disabled></button>
<a gestioSocialButton provider="microsoft" href="/auth/microsoft">Compte professionnel</a>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'provider',
      type: `'google' | 'github' | 'microsoft' | 'apple'`,
      description: 'Fournisseur : logo, couleurs et libellé par défaut (obligatoire).',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Indicateur de chargement ; clics bloqués.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive le bouton ou le lien.',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: 'Toute la largeur disponible.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioSocialButtonLabels>',
      default: '{}',
      description: 'Libellés par défaut par fournisseur et texte annoncé pendant le chargement.',
    },
  ];
}
