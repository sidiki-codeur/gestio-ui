import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioFileRejection, GestioFileUpload } from '@gestiolabs336/ui/file-upload';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-file-upload-page',
  imports: [ReactiveFormsModule, GestioFileUpload, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Dépôt de fichiers" eyebrow="Composants">
      <code>gestio-file-upload</code> combine une zone de glisser-déposer et un bouton « Parcourir »
      posé sur un <code>&lt;input type="file"&gt;</code> natif, atteignable au clavier. Les fichiers
      refusés (type, taille, nombre, doublon) sont listés et annoncés aux lecteurs d’écran.
    </sc-page-header>

    <sc-example
      heading="Import de factures PDF"
      description="PDF uniquement, 10 Mo par fichier, 5 fichiers au plus. La progression de l’envoi est simulée."
      [code]="importCode"
      stacked
    >
      <div class="sc-stack" style="max-width: 36rem">
        <gestio-file-upload
          label="Factures fournisseurs"
          hint="Les factures sont rattachées automatiquement au fournisseur d’après leur SIRET."
          accept=".pdf,application/pdf"
          multiple
          [maxSize]="10 * 1024 * 1024"
          [maxFiles]="5"
          [progress]="progress()"
          [disabled]="uploading()"
          [(files)]="invoices"
          (filesChange)="done.set(false)"
          (rejected)="onRejected($event)"
        />
        <div class="sc-row">
          <button
            gestioButton
            [disabled]="!invoices().length || done()"
            [loading]="uploading()"
            (click)="upload()"
          >
            Importer les factures
          </button>
          <button gestioButton variant="ghost" [disabled]="uploading()" (click)="clear()">
            Vider
          </button>
        </div>
        <p class="sc-result" aria-live="polite">
          @if (done()) {
            <strong>{{ invoices().length }}</strong> facture(s) importée(s).
          } @else {
            Fichiers : <strong>{{ invoices().length }}</strong> · refus (rejected) :
            <strong>{{ rejectedCount() }}</strong>
          }
        </p>
      </div>
    </sc-example>

    <sc-example
      heading="Logo de l’entreprise (Reactive Forms)"
      description="Un seul fichier image : un nouveau dépôt remplace le précédent. La valeur du FormControl est un File[]."
      [code]="formCode"
      stacked
    >
      <div class="sc-stack" style="max-width: 36rem">
        <gestio-file-upload
          label="Logo"
          accept="image/png,image/jpeg,image/svg+xml"
          [maxSize]="512 * 1024"
          hint="PNG, JPEG ou SVG, affiché sur les factures."
          [formControl]="logo"
        />
        <div class="sc-row">
          <button gestioButton variant="outline" size="sm" (click)="toggleLogo()">
            {{ logoLocked() ? 'Déverrouiller' : 'Verrouiller' }} le champ
          </button>
        </div>
        <p class="sc-result" aria-live="polite">
          Valeur : <code>{{ logoSummary() }}</code>
        </p>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-file-upload" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Le composant ne télécharge rien : il gère la sélection et la validation côté client.
          L’envoi reste à votre charge ; transmettez l’avancement via <code>[progress]</code>, un
          objet indexé par nom de fichier (0 à 100). <code>accept</code> filtre aussi les fichiers
          déposés, mais une validation côté serveur reste nécessaire.
        </p>
      </div>
    </section>
  `,
})
export class FileUploadPage {
  private readonly timers = new Set<ReturnType<typeof setInterval>>();

  protected readonly invoices = signal<File[]>([]);
  protected readonly progress = signal<Record<string, number>>({});
  protected readonly uploading = signal(false);
  protected readonly done = signal(false);
  protected readonly rejectedCount = signal(0);

  protected readonly logo = new FormControl<File[]>([], { nonNullable: true });
  protected readonly logoLocked = signal(false);
  private readonly logoValue = toSignal(this.logo.valueChanges, { initialValue: [] });
  protected readonly logoSummary = computed(() => {
    const files = this.logoValue();
    return files.length ? files.map((file) => file.name).join(', ') : '[]';
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearInterval(timer)));
  }

  protected upload(): void {
    const files = this.invoices();
    this.uploading.set(true);
    this.progress.set(Object.fromEntries(files.map((file) => [file.name, 0])));
    files.forEach((file, index) => {
      const timer = setInterval(
        () => {
          const next = Math.min(100, (this.progress()[file.name] ?? 0) + 20);
          this.progress.update((value) => ({ ...value, [file.name]: next }));
          if (next < 100) return;
          clearInterval(timer);
          this.timers.delete(timer);
          if (!this.timers.size) {
            this.uploading.set(false);
            this.done.set(true);
          }
        },
        250 + index * 120,
      );
      this.timers.add(timer);
    });
  }

  protected clear(): void {
    this.invoices.set([]);
    this.progress.set({});
    this.done.set(false);
    this.rejectedCount.set(0);
  }

  protected toggleLogo(): void {
    this.logoLocked.update((locked) => !locked);
    if (this.logoLocked()) this.logo.disable();
    else this.logo.enable();
  }

  protected readonly importCode = `<gestio-file-upload
  label="Factures fournisseurs"
  accept=".pdf,application/pdf"
  multiple
  [maxSize]="10 * 1024 * 1024"
  [maxFiles]="5"
  [progress]="progress()"
  [(files)]="invoices"
  (rejected)="onRejected($event)"
/>

// progress : { 'facture-0425.pdf': 60, … } mis à jour pendant l’envoi`;

  protected readonly formCode = `logo = new FormControl<File[]>([], { nonNullable: true });

<gestio-file-upload
  label="Logo"
  accept="image/png,image/jpeg,image/svg+xml"
  [maxSize]="512 * 1024"
  [formControl]="logo"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'files',
      type: 'model<File[]>',
      default: '[]',
      description: 'Fichiers sélectionnés ; [(files)] ou (filesChange) hors formulaire.',
    },
    { name: 'label', type: 'string', description: 'Libellé visible.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans libellé visible.' },
    { name: 'hint', type: 'string', description: 'Aide sous la zone.' },
    { name: 'error', type: 'string | null', description: 'Erreur externe ; active aria-invalid.' },
    {
      name: 'accept',
      type: 'string',
      default: `''`,
      description: 'Types acceptés (extensions, types MIME, image/*).',
    },
    {
      name: 'multiple',
      type: 'boolean',
      default: 'false',
      description: 'Plusieurs fichiers ; sinon le nouveau remplace l’ancien.',
    },
    { name: 'maxSize', type: 'number | null', description: 'Taille max. par fichier (octets).' },
    { name: 'maxFiles', type: 'number | null', description: 'Nombre max. de fichiers.' },
    {
      name: 'progress',
      type: 'Record<string, number>',
      default: '{}',
      description: 'Avancement 0–100 par nom de fichier.',
    },
    { name: 'required', type: 'boolean', default: 'false', description: 'Astérisque visuel.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive le champ.' },
    { name: 'inputId', type: 'string', description: 'id de l’input natif.' },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Locale Intl.' },
    {
      name: 'labels',
      type: 'Partial<GestioFileUploadLabels>',
      default: '{}',
      description: 'Textes de la zone, de la liste, des refus et des annonces.',
    },
    {
      name: '(rejected)',
      type: 'GestioFileRejection[]',
      description: 'Fichiers refusés à l’ajout (reason : type, size, count, duplicate).',
    },
  ];

  protected onRejected(rejections: GestioFileRejection[]): void {
    this.rejectedCount.update((count) => count + rejections.length);
  }
}
