import { Component, signal } from '@angular/core';
import { GestioSwitch } from '@gestiolabs336/ui/switch';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-switch-page',
  imports: [GestioSwitch, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Interrupteur" eyebrow="Composants">
      Pour un réglage qui s’applique immédiatement. Repose sur
      <code>&lt;input type="checkbox" role="switch"&gt;</code> : les lecteurs d’écran annoncent «
      activé » ou « désactivé ». Dans un formulaire validé par un bouton, préférez la case à cocher.
    </sc-page-header>

    <sc-example
      heading="Liste de réglages"
      description='labelPosition="start" aligne les interrupteurs à droite.'
      [code]="settingsCode"
      stacked
    >
      <div class="sc-settings">
        <gestio-switch
          label="Relances automatiques"
          description="Un e-mail 3 jours avant l’échéance de chaque facture."
          labelPosition="start"
          [(checked)]="reminders"
        />
        <gestio-switch
          label="Rapport hebdomadaire"
          description="Synthèse du chiffre d’affaires chaque lundi."
          labelPosition="start"
          [(checked)]="weekly"
        />
        <gestio-switch
          label="Signature électronique"
          description="Réservée à l’offre Pro."
          labelPosition="start"
          disabled
        />
      </div>
      <p class="sc-result" aria-live="polite">
        Relances : <strong>{{ reminders() ? 'activées' : 'désactivées' }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Libellé après l’interrupteur" [code]="basicCode" stacked>
      <gestio-switch label="Afficher les montants HT" [(checked)]="ht" />
      <gestio-switch label="Option activée et désactivée" [checked]="true" disabled />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de l’interrupteur" [rows]="api" />
    </section>
  `,
  styles: `
    .sc-settings {
      display: flex;
      flex-direction: column;
      gap: var(--gestio-space-4);
      max-width: 34rem;
    }
  `,
})
export class SwitchPage {
  protected readonly reminders = signal(true);
  protected readonly weekly = signal(false);
  protected readonly ht = signal(false);

  protected readonly settingsCode = `<gestio-switch
  label="Relances automatiques"
  description="Un e-mail 3 jours avant l’échéance de chaque facture."
  labelPosition="start"
  [(checked)]="reminders"
/>`;

  protected readonly basicCode = `<gestio-switch label="Afficher les montants HT" formControlName="ht" />`;

  protected readonly api: ApiRow[] = [
    { name: 'label', type: 'string', description: 'Libellé ; le contenu projeté s’y ajoute.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans libellé visible.' },
    { name: 'description', type: 'string', description: 'Texte secondaire.' },
    {
      name: 'checked',
      type: 'model<boolean>',
      default: 'false',
      description: 'État ; [(checked)] ou formulaire (ControlValueAccessor).',
    },
    {
      name: 'labelPosition',
      type: "'start' | 'end'",
      default: "'end'",
      description: 'Libellé avant ou après l’interrupteur.',
    },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive.' },
    { name: 'switchId, name', type: 'string', description: 'Attributs natifs.' },
  ];
}
