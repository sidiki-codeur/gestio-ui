import { CdkAccordionItem } from '@angular/cdk/accordion';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GESTIO_ACCORDION, GestioAccordionHost } from './accordion-host';

/** Niveau du titre (`h2` à `h6`) qui contient le bouton d'en-tête. */
export type GestioAccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Section d'un `gestio-accordion`, basée sur `CdkAccordionItem`.
 *
 * ```html
 * <gestio-accordion-item heading="Conditions de paiement" [(expanded)]="ouvert">
 *   <svg gestioAccordionIcon aria-hidden="true">…</svg>
 *   Paiement à 30 jours fin de mois.
 * </gestio-accordion-item>
 * ```
 *
 * L'en-tête est un `<button>` placé dans un titre `hn` (`headingLevel`, 3 par
 * défaut) ; il porte `aria-expanded` et `aria-controls`. Le panneau est une
 * région nommée par l'en-tête ; fermé, il porte l'attribut `hidden`.
 * Icône facultative : projeter un élément portant `gestioAccordionIcon`.
 */
@Component({
  selector: 'gestio-accordion-item',
  exportAs: 'gestioAccordionItem',
  imports: [NgTemplateOutlet],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
  hostDirectives: [{ directive: CdkAccordionItem, outputs: ['opened', 'closed'] }],
  host: {
    class: 'gestio-accordion-item',
    '[class]': 'variantClass()',
    '[class.gestio-accordion-item--expanded]': 'expanded()',
    '[class.gestio-accordion-item--disabled]': 'disabled()',
  },
})
export class GestioAccordionItem {
  private readonly cdkItem = inject(CdkAccordionItem);
  /** @docs-private Accordéon parent (navigation clavier). */
  readonly accordionHost = inject<GestioAccordionHost>(GESTIO_ACCORDION, { optional: true });

  /** Texte de l'en-tête (nom accessible du bouton et de la région). */
  readonly heading = input.required<string>();
  /** Section ouverte ; liaison bidirectionnelle `[(expanded)]`. */
  readonly expanded = model(false);
  /** Empêche d'ouvrir ou de fermer la section. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Niveau du titre de l'en-tête, de 2 à 6, selon la hiérarchie de la page. */
  readonly headingLevel = input<GestioAccordionHeadingLevel, unknown>(3, {
    transform: (value: unknown) =>
      Math.min(
        6,
        Math.max(2, Math.round(numberAttribute(value, 3))),
      ) as GestioAccordionHeadingLevel,
  });

  private readonly id = gestioUniqueId('gestio-accordion');
  protected readonly triggerId = `${this.id}-trigger`;
  protected readonly panelId = `${this.id}-panel`;

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly variantClass = computed(
    () => `gestio-accordion-item--${this.accordionHost?.variant() ?? 'bordered'}`,
  );

  constructor() {
    // L'état CDK (exclusivité entre sections, openAll/closeAll) est la source
    // des changements ; le model `expanded` le reflète pour les liaisons.
    const subscription = this.cdkItem.expandedChange.subscribe((value) => this.expanded.set(value));
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());

    effect(() => {
      this.cdkItem.disabled = this.disabled();
    });
    effect(() => {
      // Le setter CDK n'émet que si la valeur change et referme les autres sections.
      this.cdkItem.expanded = this.expanded();
    });
  }

  /** Ouvre ou ferme la section (sans effet si elle est désactivée). */
  toggle(): void {
    if (!this.disabled()) this.cdkItem.toggle();
  }

  /** Ouvre la section. */
  open(): void {
    if (!this.disabled()) this.cdkItem.open();
  }

  /** Ferme la section. */
  close(): void {
    if (!this.disabled()) this.cdkItem.close();
  }

  /** Place le focus sur le bouton d'en-tête. */
  focus(): void {
    this.trigger().nativeElement.focus();
  }

  /** @docs-private */
  isTrigger(target: EventTarget | null): boolean {
    return target === this.trigger().nativeElement;
  }
}
