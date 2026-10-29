import { Component, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioInput } from '@gestiolabs336/ui/input';
import {
  GestioStep,
  GestioStepper,
  GestioStepperNext,
  GestioStepperPrevious,
} from '@gestiolabs336/ui/stepper';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-stepper-page',
  imports: [
    ReactiveFormsModule,
    GestioStepper,
    GestioStep,
    GestioStepperNext,
    GestioStepperPrevious,
    GestioButton,
    GestioInput,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Assistant en étapes" eyebrow="Composants">
      <code>gestio-stepper</code> découpe une saisie longue en étapes. Les en-têtes forment une
      liste ordonnée navigable aux flèches ; l’étape active porte
      <code>aria-current="step"</code> et chaque en-tête annonce sa position et son état (« Étape 2
      sur 3, terminée »).
    </sc-page-header>

    <sc-example
      heading="Création d’un fournisseur (mode linear)"
      description="Impossible de passer à l’étape suivante tant que l’étape courante n’est pas valide. Le bouton Suivant affiche alors les erreurs."
      [code]="linearCode"
      stacked
    >
      <form [formGroup]="supplier" (ngSubmit)="create()" novalidate style="width: 100%">
        <gestio-stepper #wizard linear ariaLabel="Création du fournisseur" [(selectedIndex)]="step">
          <gestio-step
            label="Identité"
            description="Raison sociale et SIRET"
            [completed]="supplier.controls.identity.valid"
          >
            <div class="sc-form" formGroupName="identity">
              <gestio-input
                class="sc-form__full"
                label="Raison sociale"
                formControlName="name"
                autocomplete="organization"
                required
                [error]="
                  errorFor(supplier.controls.identity.controls.name, 'Saisissez la raison sociale.')
                "
              />
              <gestio-input
                label="SIRET"
                formControlName="siret"
                hint="14 chiffres, sans espace."
                required
                [error]="
                  errorFor(
                    supplier.controls.identity.controls.siret,
                    'Le SIRET comporte 14 chiffres.'
                  )
                "
              />
            </div>
            <div class="sc-form__actions" style="margin-top: var(--gestio-space-5)">
              <button
                gestioButton
                gestioStepperNext
                (click)="supplier.controls.identity.markAllAsTouched()"
              >
                Suivant
              </button>
            </div>
          </gestio-step>

          <gestio-step
            label="Coordonnées"
            description="Contact comptable"
            [completed]="supplier.controls.contact.valid"
          >
            <div class="sc-form" formGroupName="contact">
              <gestio-input
                label="E-mail de facturation"
                type="email"
                formControlName="email"
                autocomplete="email"
                required
                [error]="
                  errorFor(
                    supplier.controls.contact.controls.email,
                    'Saisissez une adresse e-mail valide.'
                  )
                "
              />
              <gestio-input
                label="Téléphone"
                type="tel"
                formControlName="phone"
                autocomplete="tel"
              />
            </div>
            <div class="sc-form__actions" style="margin-top: var(--gestio-space-5)">
              <button gestioButton variant="outline" gestioStepperPrevious>Précédent</button>
              <button
                gestioButton
                gestioStepperNext
                (click)="supplier.controls.contact.markAllAsTouched()"
              >
                Suivant
              </button>
            </div>
          </gestio-step>

          <gestio-step label="Conditions" description="Règlement" optional>
            <div class="sc-form" formGroupName="terms">
              <gestio-input
                label="Délai de paiement"
                type="number"
                formControlName="delay"
                [min]="0"
                hint="En jours, 30 par défaut."
              >
                <span gestioSuffix>jours</span>
              </gestio-input>
              <gestio-input label="IBAN" formControlName="iban" autocomplete="off" />
            </div>
            <div class="sc-form__actions" style="margin-top: var(--gestio-space-5)">
              <button gestioButton variant="outline" gestioStepperPrevious>Précédent</button>
              <button gestioButton type="submit" [loading]="saving()">Créer le fournisseur</button>
            </div>
          </gestio-step>
        </gestio-stepper>
      </form>
      <p class="sc-result" aria-live="polite">
        @if (created(); as name) {
          Fournisseur <strong>{{ name }}</strong> créé.
          <button gestioButton variant="ghost" size="sm" (click)="restart()">Nouveau</button>
        } @else {
          selectedIndex : <strong>{{ step() }}</strong>
        }
      </p>
    </sc-example>

    <sc-example
      heading="Clôture mensuelle (vertical, non linéaire)"
      description="Toutes les étapes sont accessibles. États : terminée, en erreur, facultative ; l’export comptable n’est plus modifiable une fois quitté."
      [code]="verticalCode"
      stacked
    >
      <gestio-stepper
        orientation="vertical"
        ariaLabel="Clôture d’octobre"
        [(selectedIndex)]="closing"
      >
        <gestio-step label="Rapprochement bancaire" description="142 opérations" [completed]="true">
          <p style="margin: 0">Toutes les opérations d’octobre sont rapprochées.</p>
        </gestio-step>
        <gestio-step
          label="Factures fournisseurs"
          description="3 factures sans justificatif"
          hasError
        >
          <p style="margin: 0 0 var(--gestio-space-3)">
            Joignez les justificatifs manquants avant de poursuivre.
          </p>
          <div class="sc-row">
            <button gestioButton variant="outline" size="sm" gestioStepperPrevious>
              Précédent
            </button>
            <button gestioButton size="sm" gestioStepperNext>Suivant</button>
          </div>
        </gestio-step>
        <gestio-step label="Notes de frais" optional>
          <p style="margin: 0 0 var(--gestio-space-3)">Aucune note de frais en attente.</p>
          <div class="sc-row">
            <button gestioButton variant="outline" size="sm" gestioStepperPrevious>
              Précédent
            </button>
            <button gestioButton size="sm" gestioStepperNext>Suivant</button>
          </div>
        </gestio-step>
        <gestio-step label="Export comptable" [editable]="false">
          <p style="margin: 0">Export FEC généré le 31 octobre.</p>
        </gestio-step>
      </gestio-stepper>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-stepper et gestio-step" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Sans <code>[completed]</code>, une étape est considérée terminée dès qu’on la quitte. En
          mode <code>linear</code>, liez <code>[completed]</code> à la validité du formulaire de
          l’étape. Les boutons <code>gestioStepperNext</code> / <code>gestioStepperPrevious</code>
          placent le focus sur l’en-tête de la nouvelle étape ; les méthodes
          <code>next()</code>, <code>previous()</code>, <code>select()</code> et
          <code>reset()</code> sont accessibles via une référence (<code>#wizard</code>).
        </p>
      </div>
    </section>
  `,
})
export class StepperPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly wizard = viewChild.required<GestioStepper>('wizard');

  protected readonly step = signal(0);
  protected readonly closing = signal(1);
  protected readonly saving = signal(false);
  protected readonly created = signal<string | null>(null);

  protected readonly supplier = this.fb.group({
    identity: this.fb.group({
      name: ['', Validators.required],
      siret: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
    }),
    contact: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    }),
    terms: this.fb.group({
      delay: this.fb.control<number | null>(30),
      iban: [''],
    }),
  });

  protected errorFor(control: AbstractControl, message: string): string | null {
    return control.invalid && control.touched ? message : null;
  }

  protected create(): void {
    if (this.supplier.invalid) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.created.set(this.supplier.controls.identity.controls.name.value);
    }, 600);
  }

  protected restart(): void {
    this.supplier.reset();
    this.created.set(null);
    this.wizard().reset();
  }

  protected readonly linearCode = `<form [formGroup]="supplier" (ngSubmit)="create()">
  <gestio-stepper #wizard linear ariaLabel="Création du fournisseur" [(selectedIndex)]="step">
    <gestio-step label="Identité" description="Raison sociale et SIRET"
                 [completed]="supplier.controls.identity.valid">
      <!-- champs formGroupName="identity" -->
      <button gestioButton gestioStepperNext
              (click)="supplier.controls.identity.markAllAsTouched()">Suivant</button>
    </gestio-step>
    <gestio-step label="Coordonnées" [completed]="supplier.controls.contact.valid">
      …
      <button gestioButton variant="outline" gestioStepperPrevious>Précédent</button>
      <button gestioButton gestioStepperNext>Suivant</button>
    </gestio-step>
    <gestio-step label="Conditions" optional>
      …
      <button gestioButton type="submit">Créer le fournisseur</button>
    </gestio-step>
  </gestio-stepper>
</form>

<!-- Après création : wizard.reset() revient à la première étape. -->`;

  protected readonly verticalCode = `<gestio-stepper orientation="vertical" ariaLabel="Clôture d’octobre" [(selectedIndex)]="closing">
  <gestio-step label="Rapprochement bancaire" [completed]="true">…</gestio-step>
  <gestio-step label="Factures fournisseurs" hasError>…</gestio-step>
  <gestio-step label="Notes de frais" optional>…</gestio-step>
  <gestio-step label="Export comptable" [editable]="false">…</gestio-step>
</gestio-stepper>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'selectedIndex',
      type: 'model<number>',
      default: '0',
      description: 'Étape active, à partir de 0 ; [(selectedIndex)].',
    },
    {
      name: 'orientation',
      type: `'horizontal' | 'vertical'`,
      default: `'horizontal'`,
      description: 'Disposition des en-têtes ; en vertical, chaque panneau suit son en-tête.',
    },
    {
      name: 'linear',
      type: 'boolean',
      default: 'false',
      description: 'Interdit d’aller au-delà d’une étape non terminée (hors facultatives).',
    },
    { name: 'ariaLabel', type: 'string', description: 'Nom de la liste des étapes.' },
    {
      name: 'labels',
      type: 'Partial<GestioStepperLabels>',
      default: '{}',
      description: 'Textes (steps, position, completed, error, optional, stepChanged, blocked).',
    },
    { name: 'gestio-step · label', type: 'string', description: 'Libellé (obligatoire).' },
    { name: 'gestio-step · description', type: 'string', description: 'Texte secondaire.' },
    {
      name: 'gestio-step · completed',
      type: 'boolean | undefined',
      description: 'Étape terminée ; non renseigné : terminée une fois quittée.',
    },
    {
      name: 'gestio-step · optional',
      type: 'boolean',
      default: 'false',
      description: 'Ne bloque pas la progression en mode linear.',
    },
    {
      name: 'gestio-step · hasError',
      type: 'boolean',
      default: 'false',
      description: 'Affiche et annonce un état d’erreur.',
    },
    {
      name: 'gestio-step · editable',
      type: 'boolean',
      default: 'true',
      description: 'false : impossible de revenir sur l’étape.',
    },
  ];
}
