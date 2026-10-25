import { Component, inject } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioToastService } from '@gestiolabs336/ui/toast';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { CodeBlock } from '../../shared/code-block';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-toast-page',
  imports: [GestioButton, Example, ApiTable, CodeBlock, PageHeader],
  template: `
    <sc-page-header heading="Notifications" eyebrow="Composants">
      <code>GestioToastService</code> affiche des messages éphémères dans
      <code>&lt;gestio-toaster&gt;</code>. Ils sont annoncés aux lecteurs d’écran sans jamais
      prendre le focus, et se mettent en pause au survol ou au focus.
    </sc-page-header>

    <sc-example heading="Variantes" [code]="variantsCode">
      <button gestioButton variant="outline" (click)="success()">Succès</button>
      <button gestioButton variant="outline" (click)="error()">Erreur</button>
      <button gestioButton variant="outline" (click)="info()">Information</button>
      <button gestioButton variant="outline" (click)="warning()">Avertissement</button>
    </sc-example>

    <sc-example heading="Durée, persistance et limite" [code]="optionsCode">
      <button gestioButton variant="secondary" (click)="persistent()">
        Notification persistante
      </button>
      <button gestioButton variant="secondary" (click)="burst()">Envoyer 5 notifications</button>
      <button gestioButton variant="ghost" (click)="toast.clear()">Tout fermer</button>
    </sc-example>

    <section class="sc-section" aria-labelledby="config">
      <h2 id="config">Configuration</h2>
      <p>
        Placez <code>&lt;gestio-toaster /&gt;</code> une seule fois (composant racine) et configurez
        les valeurs par défaut au démarrage.
      </p>
      <sc-code-block language="typescript" [code]="configCode" />
    </section>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="API de GestioToastService" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Au-delà de <code>maxVisible</code>, les notifications les plus anciennes sont retirées
          (pas de file d’attente). Les messages d’erreur et d’avertissement sont annoncés de façon
          prioritaire (<code>assertive</code>), les autres poliment.
        </p>
      </div>
    </section>
  `,
})
export class ToastPage {
  protected readonly toast = inject(GestioToastService);
  private burstCount = 0;

  protected success(): void {
    this.toast.success('La facture F-2024-118 a été envoyée à Atelier Moreau.', {
      title: 'Facture envoyée',
    });
  }

  protected error(): void {
    this.toast.error('Le serveur de paiement ne répond pas. Réessayez dans quelques minutes.', {
      title: 'Échec du prélèvement',
      duration: 8000,
    });
  }

  protected info(): void {
    this.toast.info('La synchronisation bancaire est en cours.');
  }

  protected warning(): void {
    this.toast.warning('Votre session expire dans 5 minutes.', { title: 'Session' });
  }

  protected persistent(): void {
    this.toast.info('Cette notification reste affichée jusqu’à sa fermeture.', {
      title: 'Export en préparation',
      duration: 0,
    });
  }

  protected burst(): void {
    for (let i = 0; i < 5; i++) {
      this.burstCount++;
      this.toast.success(`Ligne ${this.burstCount} importée.`);
    }
  }

  protected readonly variantsCode = `private readonly toast = inject(GestioToastService);

this.toast.success('La facture F-2024-118 a été envoyée.', { title: 'Facture envoyée' });
this.toast.error('Le serveur de paiement ne répond pas.', { title: 'Échec', duration: 8000 });
this.toast.info('La synchronisation bancaire est en cours.');
this.toast.warning('Votre session expire dans 5 minutes.');`;

  protected readonly optionsCode = `// duration: 0 → pas de fermeture automatique
const id = this.toast.info('Export en préparation', { duration: 0 });
this.toast.dismiss(id);
this.toast.clear();`;

  protected readonly configCode = `// app.config.ts
providers: [
  provideGestioToast({ duration: 5000, maxVisible: 3, position: 'bottom-right' }),
]

// app.html
<router-outlet />
<gestio-toaster />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'success / error / info / warning',
      type: '(message: string, options?: GestioToastOptions) => string',
      description: 'Affiche une notification et retourne son identifiant.',
    },
    { name: 'options.title', type: 'string', description: 'Titre facultatif.' },
    {
      name: 'options.duration',
      type: 'number',
      default: '5000',
      description: 'Durée en ms ; 0 = persistante.',
    },
    { name: 'dismiss', type: '(id: string) => void', description: 'Ferme une notification.' },
    { name: 'clear', type: '() => void', description: 'Ferme tout et annule les minuteurs.' },
    {
      name: 'provideGestioToast',
      type: '{ duration, maxVisible, position }',
      default: '5000, 3, bottom-right',
      description: 'Positions : top-right, top-center, bottom-right, bottom-center.',
    },
    {
      name: '<gestio-toaster>',
      type: 'position, ariaLabel, closeLabel',
      description: 'Zone d’affichage ; position surcharge la configuration.',
    },
  ];
}
