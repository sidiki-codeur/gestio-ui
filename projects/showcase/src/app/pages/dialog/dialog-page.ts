import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  GESTIO_DIALOG_DATA,
  GestioButton,
  GestioCheckbox,
  GESTIO_DIALOG_IMPORTS,
  GestioDialogRef,
  GestioDialogService,
  GestioDialogSize,
  GestioInput,
} from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Contact {
  name: string;
  email: string;
}

/** Contenu de modale : édition d'un contact, retourne le contact modifié. */
@Component({
  selector: 'sc-edit-contact-dialog',
  imports: [GESTIO_DIALOG_IMPORTS, GestioButton, GestioInput, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <gestio-dialog
        title="Modifier le contact"
        description="Ces informations apparaissent sur les factures."
      >
        <div class="sc-dialog-form">
          <gestio-input
            label="Nom complet"
            formControlName="name"
            required
            [error]="submitted() && form.controls.name.invalid ? 'Le nom est obligatoire.' : null"
          />
          <gestio-input
            label="E-mail"
            type="email"
            formControlName="email"
            required
            [error]="
              submitted() && form.controls.email.invalid
                ? 'Saisissez une adresse e-mail valide.'
                : null
            "
          />
        </div>
        <div gestioDialogActions>
          <button gestioButton variant="outline" (click)="ref.close()">Annuler</button>
          <button gestioButton type="submit">Enregistrer</button>
        </div>
      </gestio-dialog>
    </form>
  `,
})
class EditContactDialog {
  protected readonly ref = inject<GestioDialogRef<Contact>>(GestioDialogRef);
  private readonly data = inject<Contact>(GESTIO_DIALOG_DATA);
  protected readonly submitted = signal(false);
  protected readonly form = new FormGroup({
    name: new FormControl(this.data.name, { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl(this.data.email, {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

/** Contenu long : démontre la hauteur limitée et le défilement interne. */
@Component({
  selector: 'sc-terms-dialog',
  imports: [GESTIO_DIALOG_IMPORTS, GestioButton],
  template: `
    <gestio-dialog
      title="Conditions générales d’utilisation"
      description="Version du 1er septembre"
    >
      @for (article of articles; track article) {
        <h3 style="font-size: 1rem; margin: 1rem 0 0.25rem">Article {{ article }}</h3>
        <p style="margin: 0; color: var(--gestio-color-text-muted)">
          Le prestataire met à disposition du client un logiciel de gestion accessible en ligne. Les
          données saisies restent la propriété du client, qui peut les exporter à tout moment depuis
          les paramètres de son espace.
        </p>
      }
      <div gestioDialogActions>
        <button gestioButton (click)="ref.close(true)">J’ai lu</button>
      </div>
    </gestio-dialog>
  `,
})
class TermsDialog {
  protected readonly ref = inject<GestioDialogRef<boolean>>(GestioDialogRef);
  protected readonly articles = Array.from({ length: 12 }, (_, i) => i + 1);
}

/** Contenu simple pour la démonstration des tailles et options. */
@Component({
  selector: 'sc-info-dialog',
  imports: [GESTIO_DIALOG_IMPORTS, GestioButton],
  template: `
    <gestio-dialog [title]="'Modale ' + data.size" [description]="data.description">
      <p style="margin: 0">
        Le focus est piégé dans la modale et sera restauré sur le bouton d’ouverture à la fermeture.
        Le défilement de la page est bloqué.
      </p>
      <div gestioDialogActions>
        <button gestioButton (click)="ref.close()">Compris</button>
      </div>
    </gestio-dialog>
  `,
})
class InfoDialog {
  protected readonly ref = inject(GestioDialogRef);
  protected readonly data = inject<{ size: string; description: string }>(GESTIO_DIALOG_DATA);
}

@Component({
  selector: 'sc-dialog-page',
  imports: [GestioButton, GestioCheckbox, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Modale" eyebrow="Composants">
      <code>GestioDialogService</code> ouvre un composant dans une modale construite sur
      <code>&#64;angular/cdk/dialog</code> : piège et restauration du focus, blocage du défilement,
      fond et rôle <code>dialog</code> nommé par son titre.
    </sc-page-header>

    <sc-example
      heading="Confirmation"
      description="confirm() retourne true, false ou undefined (Échap)."
      [code]="confirmCode"
    >
      <button gestioButton variant="danger" (click)="confirmDelete()">Supprimer le client</button>
      <p class="sc-result" aria-live="polite">
        Résultat : <strong>{{ confirmResult() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Formulaire et retour de résultat"
      description="Le composant de contenu injecte GestioDialogRef et GESTIO_DIALOG_DATA."
      [code]="formCode"
    >
      <button gestioButton variant="outline" (click)="editContact()">Modifier le contact</button>
      <p class="sc-result" aria-live="polite">
        Contact : <strong>{{ contact().name }}</strong> — {{ contact().email }}
      </p>
    </sc-example>

    <sc-example heading="Tailles et options de fermeture" [code]="optionsCode" stacked>
      <div class="sc-row">
        <gestio-checkbox label="Fermer avec Échap" [(checked)]="closeOnEscape" />
        <gestio-checkbox label="Fermer au clic sur le fond" [(checked)]="closeOnBackdrop" />
      </div>
      <div class="sc-row">
        @for (size of sizes; track size) {
          <button gestioButton variant="secondary" (click)="openSize(size)">
            Ouvrir ({{ size }})
          </button>
        }
        <button gestioButton variant="ghost" (click)="openTerms()">Contenu long</button>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <p>
        <code>open(composant, config)</code> retourne un <code>GestioDialogRef&lt;R&gt;</code> :
        <code>close(résultat)</code>, <code>closed</code> (Observable) et
        <code>afterClosed()</code> (Promise).
      </p>
      <sc-api-table caption="Options de GestioDialogConfig" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Utilisez <code>&lt;gestio-dialog title="…"&gt;</code> dans le contenu (importez
          <code>GESTIO_DIALOG_IMPORTS</code> : <code>GestioDialog</code> et
          <code>GestioDialogActions</code>) : son titre et sa description sont reliés à
          <code>aria-labelledby</code> et <code>aria-describedby</code>. Sans ce composant, passez
          <code>ariaLabel</code>. L’attribut <code>cdkFocusInitial</code> désigne l’élément focalisé
          à l’ouverture.
        </p>
      </div>
    </section>
  `,
})
export class DialogPage {
  private readonly dialog = inject(GestioDialogService);

  protected readonly sizes: GestioDialogSize[] = ['sm', 'md', 'lg'];
  protected readonly closeOnEscape = signal(true);
  protected readonly closeOnBackdrop = signal(true);
  protected readonly confirmResult = signal('aucun');
  protected readonly contact = signal<Contact>({
    name: 'Claire Moreau',
    email: 'claire.moreau@atelier-moreau.fr',
  });

  protected async confirmDelete(): Promise<void> {
    const confirmed = await this.dialog
      .confirm({
        title: 'Supprimer Atelier Moreau SARL ?',
        description: 'Les 18 factures associées seront archivées. Cette action est définitive.',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Conserver',
        variant: 'danger',
      })
      .afterClosed();
    this.confirmResult.set(
      confirmed === undefined ? 'undefined (fermée sans choix)' : String(confirmed),
    );
  }

  protected editContact(): void {
    this.dialog
      .open<Contact, Contact>(EditContactDialog, { data: this.contact(), size: 'md' })
      .closed.subscribe((result) => {
        if (result) this.contact.set(result);
      });
  }

  protected openSize(size: GestioDialogSize): void {
    this.dialog.open(InfoDialog, {
      size,
      data: {
        size,
        description: `Largeur maximale ${size === 'sm' ? 400 : size === 'md' ? 560 : 800} px.`,
      },
      closeOnEscape: this.closeOnEscape(),
      closeOnBackdropClick: this.closeOnBackdrop(),
    });
  }

  protected openTerms(): void {
    this.dialog.open(TermsDialog, { size: 'md' });
  }

  protected readonly confirmCode = `const confirmed = await this.dialog
  .confirm({
    title: 'Supprimer Atelier Moreau SARL ?',
    description: 'Les 18 factures associées seront archivées.',
    confirmLabel: 'Supprimer',
    cancelLabel: 'Conserver',
    variant: 'danger',
  })
  .afterClosed(); // true | false | undefined`;

  protected readonly formCode = `@Component({
  imports: [GESTIO_DIALOG_IMPORTS, GestioButton, GestioInput, ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="save()">
      <gestio-dialog title="Modifier le contact" description="Ces informations apparaissent sur les factures.">
        <gestio-input label="Nom complet" formControlName="name" required />
        <div gestioDialogActions>
          <button gestioButton variant="outline" (click)="ref.close()">Annuler</button>
          <button gestioButton type="submit">Enregistrer</button>
        </div>
      </gestio-dialog>
    </form>
  \`,
})
class EditContactDialog {
  ref = inject<GestioDialogRef<Contact>>(GestioDialogRef);
  data = inject<Contact>(GESTIO_DIALOG_DATA);
  form = new FormGroup({ name: new FormControl(this.data.name, { nonNullable: true }) });
  save() { this.ref.close(this.form.getRawValue()); }
}

// Appelant
this.dialog
  .open<Contact, Contact>(EditContactDialog, { data: contact, size: 'md' })
  .closed.subscribe((result) => { if (result) this.contact.set(result); });`;

  protected readonly optionsCode = `this.dialog.open(InfoDialog, {
  size: 'sm',                  // 'sm' | 'md' | 'lg'
  closeOnEscape: true,
  closeOnBackdropClick: false,
});`;

  protected readonly api: ApiRow[] = [
    { name: 'data', type: 'D', description: 'Données injectées via GESTIO_DIALOG_DATA.' },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Largeur maximale 400, 560 ou 800 px (bornée à l’écran).',
    },
    {
      name: 'closeOnEscape',
      type: 'boolean',
      default: 'true',
      description: 'Fermeture par Échap.',
    },
    {
      name: 'closeOnBackdropClick',
      type: 'boolean',
      default: 'true',
      description: 'Fermeture au clic sur le fond.',
    },
    {
      name: 'role',
      type: `'dialog' | 'alertdialog'`,
      default: `'dialog'`,
      description: 'Rôle ARIA.',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      description: 'Nom accessible si <gestio-dialog> n’est pas utilisé.',
    },
    {
      name: 'autoFocus',
      type: `'first-tabbable' | 'dialog' | 'first-heading' | string`,
      default: `'first-tabbable'`,
      description: 'Cible du focus initial (ou sélecteur CSS).',
    },
    {
      name: 'restoreFocus',
      type: 'boolean',
      default: 'true',
      description: 'Rend le focus au déclencheur.',
    },
    { name: 'panelClass', type: 'string | string[]', description: 'Classes du panneau d’overlay.' },
    {
      name: 'injector, viewContainerRef',
      type: 'Injector, ViewContainerRef',
      description: 'Contexte d’injection du contenu.',
    },
  ];
}
