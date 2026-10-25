import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { Component, Directive, ElementRef, effect, inject, input } from '@angular/core';

export type GestioMenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export type GestioMenuItemVariant = 'default' | 'danger';

const OFFSET = 4;

const BELOW_START: ConnectedPosition = {
  originX: 'start',
  originY: 'bottom',
  overlayX: 'start',
  overlayY: 'top',
  offsetY: OFFSET,
};
const BELOW_END: ConnectedPosition = { ...BELOW_START, originX: 'end', overlayX: 'end' };
const ABOVE_START: ConnectedPosition = {
  originX: 'start',
  originY: 'top',
  overlayX: 'start',
  overlayY: 'bottom',
  offsetY: -OFFSET,
};
const ABOVE_END: ConnectedPosition = { ...ABOVE_START, originX: 'end', overlayX: 'end' };

/** Position préférée en tête, puis replis si la place manque. */
const POSITIONS: Record<GestioMenuPlacement, ConnectedPosition[]> = {
  'bottom-start': [BELOW_START, BELOW_END, ABOVE_START, ABOVE_END],
  'bottom-end': [BELOW_END, BELOW_START, ABOVE_END, ABOVE_START],
  'top-start': [ABOVE_START, ABOVE_END, BELOW_START, BELOW_END],
  'top-end': [ABOVE_END, ABOVE_START, BELOW_END, BELOW_START],
};

/**
 * Rend le menu en popover « inline », juste après le déclencheur, plutôt qu'à la fin
 * de `<body>` : il reste dans le landmark de la page (règle axe `region`) et suit le
 * déclencheur dans l'ordre de lecture. Le popover est affiché dans la couche supérieure,
 * il n'est donc pas rogné par un conteneur `overflow: hidden`.
 *
 * Le CDK ne l'expose pas en option : la stratégie de position est complétée. Si cette
 * méthode interne disparaît, le menu revient simplement au rendu global du CDK.
 */
function insertMenuAfterTrigger(trigger: CdkMenuTrigger): void {
  const target = trigger as unknown as {
    _getOverlayPositionStrategy?: () => FlexibleConnectedPositionStrategy;
  };
  const original = target._getOverlayPositionStrategy;
  if (typeof original !== 'function') return;
  target._getOverlayPositionStrategy = () => original.call(trigger).withPopoverLocation('inline');
}

/**
 * Ouvre un menu (`<ng-template>` contenant un `gestio-menu`) au clic, à
 * Entrée, Espace ou flèche bas. Pose `aria-haspopup` et `aria-expanded`.
 *
 * ```html
 * <button gestioButton variant="outline" [gestioMenuTriggerFor]="actions">Actions</button>
 * <ng-template #actions>
 *   <gestio-menu>
 *     <button gestioMenuItem (triggered)="edit()">Modifier</button>
 *     <gestio-menu-divider />
 *     <button gestioMenuItem variant="danger" (triggered)="remove()">Supprimer</button>
 *   </gestio-menu>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[gestioMenuTriggerFor]',
  exportAs: 'gestioMenuTrigger',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: [
        'cdkMenuTriggerFor: gestioMenuTriggerFor',
        'cdkMenuTriggerData: gestioMenuTriggerData',
      ],
      outputs: ['cdkMenuOpened: menuOpened', 'cdkMenuClosed: menuClosed'],
    },
  ],
})
export class GestioMenuTrigger {
  private readonly trigger = inject(CdkMenuTrigger);

  /** Position du menu par rapport au déclencheur (repli automatique si la place manque). */
  readonly menuPlacement = input<GestioMenuPlacement>('bottom-start');

  constructor() {
    effect(() => {
      this.trigger.menuPosition = POSITIONS[this.menuPlacement()];
    });
    insertMenuAfterTrigger(this.trigger);
  }

  /** Ouvre le menu. */
  open(): void {
    this.trigger.open();
  }

  /** Ferme le menu. */
  close(): void {
    this.trigger.close();
  }

  /** Ouvert ou fermé. */
  isOpen(): boolean {
    return this.trigger.isOpen();
  }
}

/**
 * Panneau de menu (`role="menu"`) : flèches haut/bas, Début/Fin, saisie de la
 * première lettre, Échap ferme et rend le focus au déclencheur.
 */
@Component({
  selector: 'gestio-menu',
  template: '<ng-content />',
  styleUrl: './menu.scss',
  hostDirectives: [CdkMenu],
  host: {
    class: 'gestio-menu',
    '[attr.aria-label]': 'ariaLabel() ?? null',
  },
})
export class GestioMenu {
  /** Nom accessible du menu (par défaut, aucun : le déclencheur suffit généralement). */
  readonly ariaLabel = input<string>();
}

/**
 * Élément de menu sur un `<button>` (action) ou un `<a>` (navigation).
 * `disabled` le laisse focalisable mais inactif (`aria-disabled`).
 * Icône : projeter un élément portant `gestioMenuItemIcon` (décoratif, `aria-hidden`).
 */
@Component({
  selector: 'button[gestioMenuItem], a[gestioMenuItem]',
  template: `
    <ng-content select="[gestioMenuItemIcon]" />
    <span class="gestio-menu-item__label"><ng-content /></span>
    @if (hint()) {
      <span class="gestio-menu-item__hint">{{ hint() }}</span>
    }
  `,
  styleUrl: './menu-item.scss',
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    class: 'gestio-menu-item',
    '[class.gestio-menu-item--danger]': "variant() === 'danger'",
    '[attr.type]': 'isButton ? "button" : null',
    // `disabled` est l'entrée du CDK : l'attribut natif rendrait l'élément non focalisable.
    '[attr.disabled]': 'null',
  },
})
export class GestioMenuItem {
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';

  /** `danger` pour les actions destructives. */
  readonly variant = input<GestioMenuItemVariant>('default');
  /** Texte secondaire aligné à droite (raccourci clavier, compteur…). */
  readonly hint = input<string>();
}

/** Séparateur entre deux groupes d'éléments. */
@Component({
  selector: 'gestio-menu-divider',
  template: '',
  styles: `
    :host {
      display: block;
      height: var(--gestio-border-width);
      margin-block: var(--gestio-space-1);
      background: var(--gestio-color-border);
    }
  `,
  host: { role: 'separator', class: 'gestio-menu-divider' },
})
export class GestioMenuDivider {}

/** `imports: [GESTIO_MENU_IMPORTS]` */
export const GESTIO_MENU_IMPORTS = [
  GestioMenuTrigger,
  GestioMenu,
  GestioMenuItem,
  GestioMenuDivider,
] as const;
