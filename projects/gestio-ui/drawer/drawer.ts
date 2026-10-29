import {
  Component,
  DestroyRef,
  TemplateRef,
  ViewContainerRef,
  afterRenderEffect,
  booleanAttribute,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioDrawerContent, GestioDrawerLabels } from './drawer-content';
import { GestioDrawerFooter } from './drawer-footer';
import { GESTIO_DRAWER_HOST, GestioDrawerHost } from './drawer-host';
import { GestioDrawerPosition, GestioDrawerRef, GestioDrawerSize } from './drawer-ref';
import { GestioDrawerService } from './drawer.service';

/**
 * Panneau latéral modal (« drawer », « sheet ») piloté par `[(open)]`.
 * Rendu dans un overlay `@angular/cdk/dialog` : rôle `dialog` nommé par
 * `heading`, piège et restauration du focus, blocage du défilement,
 * fermeture par Échap, par le fond et par le bouton de fermeture.
 *
 * ```html
 * <button gestioButton (click)="detailOpen.set(true)">Voir la facture</button>
 *
 * <gestio-drawer [(open)]="detailOpen" heading="Facture F-2024-0042" position="end" size="md">
 *   <gestio-badge gestioDrawerHeader variant="success">Payée</gestio-badge>
 *   <p>Contenu…</p>
 *   <div gestioDrawerFooter>
 *     <button gestioButton variant="outline" (click)="detailOpen.set(false)">Fermer</button>
 *   </div>
 * </gestio-drawer>
 * ```
 *
 * Le contenu n'est rendu que lorsque le panneau est ouvert (et jamais côté serveur).
 */
@Component({
  selector: 'gestio-drawer',
  imports: [GestioDrawerContent],
  template: `
    <ng-template #panel>
      <gestio-drawer-content
        [heading]="heading()"
        [description]="description()"
        [showClose]="showClose()"
        [labels]="labels()"
      >
        <ng-container ngProjectAs="[gestioDrawerHeader]">
          <ng-content select="[gestioDrawerHeader]" />
        </ng-container>
        <ng-content />
        <ng-container ngProjectAs="[gestioDrawerFooter]">
          <ng-content select="[gestioDrawerFooter]" />
        </ng-container>
      </gestio-drawer-content>
    </ng-template>
  `,
  styles: ':host { display: none; }',
  viewProviders: [
    {
      provide: GESTIO_DRAWER_HOST,
      useFactory: (): GestioDrawerHost => {
        const drawer = inject(GestioDrawer);
        return {
          titleId: `${drawer.id}-title`,
          descriptionId: `${drawer.id}-description`,
          position: () => drawer.position(),
          close: () => drawer.open.set(false),
        };
      },
    },
  ],
  host: { class: 'gestio-drawer' },
})
export class GestioDrawer {
  private readonly drawers = inject(GestioDrawerService);
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Ouverture du panneau (liaison bidirectionnelle `[(open)]`). */
  readonly open = model(false);
  /** Bord d'ouverture : fin de ligne (défaut), début de ligne ou bas de l'écran. */
  readonly position = input<GestioDrawerPosition>('end');
  /** Côtés : largeur 320 / 420 / 640 px. Bas : hauteur max. 40 / 60 / 85 % de l'écran. */
  readonly size = input<GestioDrawerSize>('md');
  /** Titre du panneau, utilisé comme nom accessible. */
  readonly heading = input.required<string>();
  /** Description courte, reliée par `aria-describedby`. */
  readonly description = input<string>();
  /** Affiche le bouton de fermeture dans l'en-tête. */
  readonly showClose = input(true, { transform: booleanAttribute });
  /** Fermeture par la touche Échap. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Fermeture par clic sur le fond. */
  readonly closeOnBackdropClick = input(true, { transform: booleanAttribute });
  /** Restaure le focus sur l'élément déclencheur à la fermeture. */
  readonly restoreFocus = input(true, { transform: booleanAttribute });
  /** Libellés (bouton de fermeture). */
  readonly labels = input<Partial<GestioDrawerLabels>>({});

  /** Identifiant du panneau ouvert (titre : `${id}-title`). */
  readonly id = gestioUniqueId('gestio-drawer');

  private readonly panel = viewChild.required('panel', { read: TemplateRef });
  private ref: GestioDrawerRef | null = null;

  constructor() {
    // Rendu navigateur uniquement : rien n'est ouvert pendant le rendu serveur.
    afterRenderEffect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.ref?.close()));
    });
    inject(DestroyRef).onDestroy(() => this.ref?.close());
  }

  private show(): void {
    if (this.ref) return;
    const ref = this.drawers.open(this.panel(), {
      id: this.id,
      position: this.position(),
      size: this.size(),
      closeOnEscape: this.closeOnEscape(),
      closeOnBackdropClick: this.closeOnBackdropClick(),
      restoreFocus: this.restoreFocus(),
      viewContainerRef: this.viewContainerRef,
    });
    this.ref = ref;
    ref.closed.subscribe(() => {
      if (this.ref === ref) this.ref = null;
      this.open.set(false);
    });
  }
}

/** Imports nécessaires pour un panneau déclaratif ou un contenu ouvert par le service. */
export const GESTIO_DRAWER_IMPORTS = [
  GestioDrawer,
  GestioDrawerContent,
  GestioDrawerFooter,
] as const;
