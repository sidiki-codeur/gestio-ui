import { Component, signal } from '@angular/core';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { GestioOtpInput } from '@gestiolabs336/ui/blocks/otp-input';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-otp-input-page',
  imports: [GestioOtpInput, GestioButton, FormField, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Code OTP" eyebrow="Blocs">
      <code>gestio-otp-input</code> saisit un code à usage unique, une case par chiffre. Le focus
      avance tout seul, <kbd>Retour arrière</kbd> recule, les flèches, <kbd>Début</kbd> et
      <kbd>Fin</kbd> déplacent le curseur. Coller le code ou le remplissage automatique du SMS
      remplissent toutes les cases.
    </sc-page-header>

    <sc-example
      heading="Vérification en deux étapes"
      description="Code de démonstration : 482913. Essayez de le coller."
      [code]="verifyCode"
      stacked
    >
      <gestio-otp-input
        hint="Saisissez le code envoyé par SMS au 06 •• •• •• 42."
        [error]="error()"
        [(value)]="code"
        (completed)="verify($event)"
      />
      <p class="sc-result" aria-live="polite">
        Valeur : <strong>{{ code() || '—' }}</strong> · Statut : <strong>{{ status() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Avec Signal Forms"
      description="Code à 4 chiffres requis ; l’erreur s’affiche une fois le groupe quitté."
      [code]="formCode"
      stacked
    >
      <form class="sc-stack" style="align-items: flex-start" (submit)="submit($event)">
        <gestio-otp-input label="Code PIN" [length]="4" [formField]="pinForm.pin" />
        <button gestioButton type="submit">Valider</button>
      </form>
      <p class="sc-result" aria-live="polite">
        Formulaire valide : <strong>{{ pinForm().valid() ? 'oui' : 'non' }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-otp-input" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          La valeur est une chaîne (les zéros initiaux sont conservés). <code>(completed)</code>
          n’est émis que lorsque l’utilisateur remplit la dernière case.
        </p>
      </div>
    </section>
  `,
})
export class OtpInputPage {
  protected readonly code = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal('en attente');

  protected readonly pinModel = signal({ pin: '' });
  protected readonly pinForm = form(this.pinModel, (path) => {
    required(path.pin);
    minLength(path.pin, 4);
  });

  protected verify(code: string): void {
    if (code === '482913') {
      this.error.set(null);
      this.status.set('code vérifié');
    } else {
      this.error.set('Code incorrect. Vérifiez le SMS reçu.');
      this.status.set('code refusé');
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.pinForm().markAsTouched();
  }

  protected readonly verifyCode = `<gestio-otp-input
  hint="Saisissez le code envoyé par SMS au 06 •• •• •• 42."
  [error]="error()"
  [(value)]="code"
  (completed)="verify($event)"
/>`;

  protected readonly formCode = `readonly model = signal({ pin: '' });
readonly pinForm = form(this.model, (path) => {
  required(path.pin);
  minLength(path.pin, 4);
});

<gestio-otp-input label="Code PIN" [length]="4" [formField]="pinForm.pin" />`;

  protected readonly api: ApiRow[] = [
    { name: 'length', type: 'number', default: '6', description: 'Nombre de chiffres.' },
    { name: 'value', type: 'model<string>', default: `''`, description: 'Code saisi ; [(value)].' },
    {
      name: 'label',
      type: 'string',
      description: 'Libellé du groupe (par défaut « Code de vérification »).',
    },
    { name: 'hint', type: 'string', description: 'Aide sous les cases.' },
    {
      name: 'error',
      type: 'string | null',
      description: 'Message d’erreur ; active l’état invalide.',
    },
    {
      name: 'invalid',
      type: 'boolean',
      default: 'false',
      description: 'État invalide (lié par [formField]), affiché après interaction.',
    },
    {
      name: 'touched',
      type: 'boolean',
      default: 'false',
      description: 'Champ touché (lié par [formField]).',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive toutes les cases.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioOtpInputLabels>',
      default: '{}',
      description: 'Libellé du groupe et nom des cases ({index}, {length}).',
    },
    {
      name: '(completed)',
      type: 'string',
      description: 'Toutes les cases viennent d’être remplies.',
    },
    { name: '(touch)', type: 'void', description: 'Le focus quitte le groupe.' },
  ];
}
