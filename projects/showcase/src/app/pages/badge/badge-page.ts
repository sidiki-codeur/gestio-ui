import { Component } from '@angular/core';
import { GestioBadge, GestioBadgeAppearance, GestioBadgeVariant } from '@gestiolabs336/ui/badge';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-badge-page',
  imports: [GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Badge" eyebrow="Composants">
      <code>gestio-badge</code> signale un statut ou une catégorie. Le libellé doit rester explicite
      : la couleur seule ne porte pas l’information.
    </sc-page-header>

    @for (appearance of appearances; track appearance.value) {
      <sc-example [heading]="appearance.label" [code]="codeFor(appearance.value)">
        @for (variant of variants; track variant.value) {
          <gestio-badge [variant]="variant.value" [appearance]="appearance.value">
            {{ variant.label }}
          </gestio-badge>
        }
      </sc-example>
    }

    <sc-example heading="Indicateur et tailles" [code]="dotCode">
      <gestio-badge variant="success" dot>Payée</gestio-badge>
      <gestio-badge variant="warning" dot>En retard</gestio-badge>
      <gestio-badge variant="danger" dot appearance="outline">Litige</gestio-badge>
      <gestio-badge variant="primary" size="sm">Nouveau</gestio-badge>
      <gestio-badge variant="neutral" size="sm" dot>Brouillon</gestio-badge>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées du badge" [rows]="api" />
    </section>
  `,
})
export class BadgePage {
  protected readonly variants: { value: GestioBadgeVariant; label: string }[] = [
    { value: 'neutral', label: 'Brouillon' },
    { value: 'primary', label: 'Nouveau' },
    { value: 'success', label: 'Payée' },
    { value: 'warning', label: 'En attente' },
    { value: 'danger', label: 'Rejetée' },
    { value: 'info', label: 'Envoyée' },
  ];

  protected readonly appearances: { value: GestioBadgeAppearance; label: string }[] = [
    { value: 'soft', label: 'Style « soft » (par défaut)' },
    { value: 'solid', label: 'Style « solid »' },
    { value: 'outline', label: 'Style « outline »' },
  ];

  protected codeFor(appearance: GestioBadgeAppearance): string {
    return this.variants
      .map(
        (variant) =>
          `<gestio-badge variant="${variant.value}" appearance="${appearance}">${variant.label}</gestio-badge>`,
      )
      .join('\n');
  }

  protected readonly dotCode = `<gestio-badge variant="success" dot>Payée</gestio-badge>
<gestio-badge variant="danger" dot appearance="outline">Litige</gestio-badge>
<gestio-badge variant="primary" size="sm">Nouveau</gestio-badge>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'variant',
      type: `'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'`,
      default: `'neutral'`,
      description: 'Couleur sémantique.',
    },
    {
      name: 'appearance',
      type: `'soft' | 'solid' | 'outline'`,
      default: `'soft'`,
      description: 'Style visuel.',
    },
    { name: 'size', type: `'sm' | 'md'`, default: `'md'`, description: 'Taille.' },
    {
      name: 'dot',
      type: 'boolean',
      default: 'false',
      description: 'Pastille décorative avant le libellé.',
    },
  ];
}
