import { JsonPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCard } from '@gestiolabs336/ui/card';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { GestioInput } from '@gestiolabs336/ui/input';
import { GestioSelect, GestioSelectOption } from '@gestiolabs336/ui/select';
import { GestioTextarea } from '@gestiolabs336/ui/textarea';
import { GestioToastService } from '@gestiolabs336/ui/toast';
import { CodeBlock } from '../../shared/code-block';
import { PageHeader } from '../../shared/page-header';

interface FieldError {
  readonly id: string;
  readonly message: string;
}

@Component({
  selector: 'sc-form-page',
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    GestioButton,
    GestioCard,
    GestioCheckbox,
    GestioInput,
    GestioSelect,
    GestioTextarea,
    CodeBlock,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Formulaire complet" eyebrow="Exemple">
      Création d’un client avec Reactive Forms : les erreurs apparaissent après interaction avec un
      champ ou à la soumission, avec un récapitulatif qui reçoit le focus.
    </sc-page-header>

    <gestio-card variant="bordered" padding="lg">
      <div gestioCardHeader>
        <h2 class="sc-card-title">Nouveau client</h2>
        <p class="sc-card-subtitle">Les champs marqués d’un astérisque sont obligatoires.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (submitted() && errors().length) {
          <div
            #summary
            class="sc-form-summary"
            tabindex="-1"
            aria-labelledby="form-summary-title"
            style="margin-bottom: var(--gestio-space-5)"
          >
            <strong id="form-summary-title"
              >{{ errors().length }}
              {{ errors().length > 1 ? 'champs à corriger' : 'champ à corriger' }}</strong
            >
            <ul>
              @for (error of errors(); track error.id) {
                <li>
                  <a [href]="'#' + error.id" (click)="focusField($event, error.id)">{{
                    error.message
                  }}</a>
                </li>
              }
            </ul>
          </div>
        }

        <div class="sc-form">
          <gestio-input
            class="sc-form__full"
            inputId="client-name"
            label="Raison sociale"
            formControlName="name"
            autocomplete="organization"
            required
            [error]="errorFor(form.controls.name, { required: 'Saisissez la raison sociale.' })"
          />
          <gestio-input
            inputId="client-email"
            label="E-mail de facturation"
            type="email"
            formControlName="email"
            autocomplete="email"
            required
            [error]="
              errorFor(form.controls.email, {
                required: 'Saisissez une adresse e-mail.',
                email: 'Adresse e-mail invalide (ex. compta@exemple.fr).',
              })
            "
          />
          <gestio-input
            inputId="client-phone"
            label="Téléphone"
            type="tel"
            formControlName="phone"
            autocomplete="tel"
            hint="Facultatif."
          />
          <gestio-input
            inputId="client-employees"
            label="Effectif"
            type="number"
            formControlName="employees"
            [min]="1"
            [error]="
              errorFor(form.controls.employees, { min: 'L’effectif doit être d’au moins 1.' })
            "
          />
          <gestio-select
            selectId="client-country"
            label="Pays"
            formControlName="country"
            placeholder="Choisir un pays"
            [options]="countries"
            required
            [error]="errorFor(form.controls.country, { required: 'Sélectionnez un pays.' })"
          />
          <gestio-select
            selectId="client-delay"
            label="Délai de paiement"
            formControlName="paymentDelay"
            [options]="delays"
          />
          <gestio-textarea
            class="sc-form__full"
            textareaId="client-notes"
            label="Notes internes"
            formControlName="notes"
            [rows]="3"
            [maxlength]="300"
            showCount
          />
          <div class="sc-form__full sc-stack" style="gap: var(--gestio-space-3)">
            <gestio-checkbox
              checkboxId="client-newsletter"
              label="Inscrire le contact à la lettre d’information"
              formControlName="newsletter"
            />
            <gestio-checkbox
              checkboxId="client-terms"
              label="Le client a accepté les conditions générales de vente"
              formControlName="terms"
              required
              [error]="
                errorFor(form.controls.terms, { required: 'L’acceptation des CGV est requise.' })
              "
            />
          </div>
          <div class="sc-form__full sc-form__actions">
            <button gestioButton variant="ghost" type="button" (click)="reset()">
              Réinitialiser
            </button>
            <button gestioButton type="submit" [loading]="saving()">Créer le client</button>
          </div>
        </div>
      </form>
    </gestio-card>

    @if (result(); as value) {
      <section class="sc-section" aria-labelledby="form-result">
        <h2 id="form-result">Valeur envoyée</h2>
        <p>
          Les types sont préservés : <code>employees</code> et <code>paymentDelay</code> sont des
          nombres.
        </p>
        <pre class="sc-json" tabindex="0">{{ value | json }}</pre>
      </section>
    }

    <section class="sc-section" aria-labelledby="form-code">
      <h2 id="form-code">Code</h2>
      <sc-code-block language="typescript" [code]="code" />
    </section>
  `,
})
export class FormPage {
  private readonly toast = inject(GestioToastService);
  private readonly injector = inject(Injector);
  private readonly summary = viewChild<ElementRef<HTMLElement>>('summary');
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly result = signal<unknown>(null);

  protected readonly countries: GestioSelectOption<string>[] = [
    { label: 'France', value: 'FR' },
    { label: 'Belgique', value: 'BE' },
    { label: 'Suisse', value: 'CH' },
    { label: 'Canada', value: 'CA' },
  ];
  protected readonly delays: GestioSelectOption<number>[] = [
    { label: 'À réception', value: 0 },
    { label: '30 jours', value: 30 },
    { label: '45 jours fin de mois', value: 45 },
  ];

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    employees: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
    country: new FormControl<string | null>(null, { validators: [Validators.required] }),
    paymentDelay: new FormControl<number | null>(30),
    notes: new FormControl('', { nonNullable: true }),
    newsletter: new FormControl(false, { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Message de la première erreur, affiché après interaction ou soumission. */
  protected errorFor(control: AbstractControl, messages: Record<string, string>): string | null {
    if (!control.errors || !(control.touched || this.submitted())) return null;
    const key = Object.keys(messages).find((name) => control.hasError(name));
    return key ? messages[key] : null;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      afterNextRender(() => this.summary()?.nativeElement.focus(), { injector: this.injector });
      return;
    }

    this.saving.set(true);
    this.timer = setTimeout(() => {
      this.saving.set(false);
      this.result.set(this.form.getRawValue());
      this.toast.success(`${this.form.controls.name.value} a été ajouté à vos clients.`, {
        title: 'Client créé',
      });
    }, 1200);
  }

  protected reset(): void {
    this.form.reset();
    this.submitted.set(false);
    this.result.set(null);
  }

  protected focusField(event: Event, id: string): void {
    event.preventDefault();
    this.summary()?.nativeElement.ownerDocument.getElementById(id)?.focus();
  }

  /** Erreurs du récapitulatif, recalculées au fil des corrections. */
  protected errors(): FieldError[] {
    return this.submitted() ? this.collectErrors() : [];
  }

  private collectErrors(): FieldError[] {
    const checks: [AbstractControl, string, Record<string, string>][] = [
      [this.form.controls.name, 'client-name', { required: 'Saisissez la raison sociale.' }],
      [
        this.form.controls.email,
        'client-email',
        { required: 'Saisissez une adresse e-mail.', email: 'Adresse e-mail invalide.' },
      ],
      [
        this.form.controls.employees,
        'client-employees',
        { min: 'L’effectif doit être d’au moins 1.' },
      ],
      [this.form.controls.country, 'client-country', { required: 'Sélectionnez un pays.' }],
      [
        this.form.controls.terms,
        'client-terms',
        { required: 'L’acceptation des CGV est requise.' },
      ],
    ];
    return checks
      .map(([control, id, messages]) => ({ id, message: this.errorFor(control, messages) }))
      .filter((entry): entry is FieldError => entry.message !== null);
  }

  protected readonly code = `form = new FormGroup({
  name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  employees: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
  country: new FormControl<string | null>(null, { validators: [Validators.required] }),
  paymentDelay: new FormControl<number | null>(30),
  notes: new FormControl('', { nonNullable: true }),
  terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
});

errorFor(control: AbstractControl, messages: Record<string, string>): string | null {
  if (!control.errors || !(control.touched || this.submitted())) return null;
  const key = Object.keys(messages).find((name) => control.hasError(name));
  return key ? messages[key] : null;
}

<gestio-input
  label="E-mail de facturation"
  type="email"
  formControlName="email"
  required
  [error]="errorFor(form.controls.email, { required: 'Saisissez une adresse e-mail.', email: 'Adresse e-mail invalide.' })"
/>
<gestio-select label="Délai de paiement" formControlName="paymentDelay" [options]="delays" />
<gestio-checkbox label="Le client a accepté les CGV" formControlName="terms" required
  [error]="errorFor(form.controls.terms, { required: 'L’acceptation des CGV est requise.' })" />
<button gestioButton type="submit" [loading]="saving()">Créer le client</button>`;
}
