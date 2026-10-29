import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  input,
  linkedSignal,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioRipple } from '@gestiolabs336/ui/ripple';
import { GestioStep } from './step';

export type GestioStepperOrientation = 'horizontal' | 'vertical';

/** Libellés du stepper (internationalisation). */
export interface GestioStepperLabels {
  /** Nom de la liste des étapes. */
  steps: string;
  /** Position d'une étape ; `{index}` et `{count}` sont remplacés. */
  position: string;
  /** État ajouté à la position d'une étape terminée. */
  completed: string;
  /** État ajouté à la position d'une étape en erreur. */
  error: string;
  /** Mention visible des étapes facultatives. */
  optional: string;
  /** Annonce après un changement d'étape ; `{index}`, `{count}`, `{label}` sont remplacés. */
  stepChanged: string;
  /** Annonce quand une étape n'est pas accessible (mode `linear`). */
  blocked: string;
}

export const GESTIO_STEPPER_LABELS: GestioStepperLabels = {
  steps: 'Étapes',
  position: 'Étape {index} sur {count}',
  completed: 'terminée',
  error: 'erreur',
  optional: 'Facultative',
  stepChanged: 'Étape {index} sur {count} : {label}',
  blocked: 'Étape non accessible : terminez d’abord les étapes précédentes.',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Assistant en plusieurs étapes (stepper), horizontal ou vertical.
 *
 * ```html
 * <gestio-stepper [(selectedIndex)]="etape" linear>
 *   <gestio-step label="Identité" [completed]="identite.valid">
 *     …
 *     <button gestioButton gestioStepperNext>Suivant</button>
 *   </gestio-step>
 *   <gestio-step label="Coordonnées">
 *     <button gestioButton variant="outline" gestioStepperPrevious>Précédent</button>
 *     <button gestioButton gestioStepperNext>Suivant</button>
 *   </gestio-step>
 * </gestio-stepper>
 * ```
 *
 * Les en-têtes sont des boutons dans une liste ordonnée : un seul arrêt de
 * tabulation, flèches (selon l'orientation), Début / Fin pour se déplacer,
 * Entrée / Espace pour ouvrir l'étape. L'étape active porte `aria-current="step"`
 * et chaque en-tête annonce sa position et son état (« Étape 2 sur 4, terminée »).
 */
@Component({
  selector: 'gestio-stepper',
  exportAs: 'gestioStepper',
  imports: [NgTemplateOutlet, GestioRipple],
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  host: {
    class: 'gestio-stepper',
    '[class.gestio-stepper--horizontal]': 'orientation() === "horizontal"',
    '[class.gestio-stepper--vertical]': 'orientation() === "vertical"',
  },
})
export class GestioStepper {
  /** Index de l'étape active, à partir de 0 (`[(selectedIndex)]`). */
  readonly selectedIndex = model(0);
  /** Disposition des en-têtes. */
  readonly orientation = input<GestioStepperOrientation>('horizontal');
  /** Interdit d'aller au-delà d'une étape non terminée (hors étapes facultatives). */
  readonly linear = input(false, { transform: booleanAttribute });
  /** Nom accessible de la liste des étapes (défaut : libellé `steps`). */
  readonly ariaLabel = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioStepperLabels>>({});

  /** Étapes déclarées dans le contenu. */
  readonly steps = contentChildren(GestioStep);

  protected readonly baseId = gestioUniqueId('gestio-stepper');
  protected readonly announcement = signal('');
  protected readonly text = computed<GestioStepperLabels>(() => ({
    ...GESTIO_STEPPER_LABELS,
    ...this.labels(),
  }));

  /** Étapes déjà quittées (terminées par défaut si `completed` n'est pas renseigné). */
  private readonly visited = signal<ReadonlySet<GestioStep>>(new Set());
  private readonly headers = viewChildren<ElementRef<HTMLButtonElement>>('header');

  /** Étape réellement active : l'index demandé borné au nombre d'étapes. */
  readonly activeIndex = computed(() => {
    const count = this.steps().length;
    if (!count) return -1;
    return Math.min(Math.max(0, Math.trunc(this.selectedIndex()) || 0), count - 1);
  });

  /** En-tête portant le seul arrêt de tabulation (focus itinérant). */
  protected readonly focusIndex = linkedSignal(() => this.activeIndex());

  /** Passe à l'étape suivante si elle est accessible. Retourne `true` en cas de succès. */
  next(): boolean {
    return this.navigate(this.activeIndex() + 1, false);
  }

  /** Revient à l'étape précédente si elle est modifiable. Retourne `true` en cas de succès. */
  previous(): boolean {
    return this.navigate(this.activeIndex() - 1, false);
  }

  /** Sélectionne une étape si elle est accessible. Retourne `true` en cas de succès. */
  select(index: number): boolean {
    return this.navigate(index, false);
  }

  /** Revient à la première étape et oublie les étapes parcourues. */
  reset(): void {
    this.visited.set(new Set());
    this.selectedIndex.set(0);
    this.announcement.set('');
  }

  /** Étape terminée : valeur de `completed`, sinon `true` une fois quittée. */
  isCompleted(index: number): boolean {
    const step = this.steps()[index];
    if (!step) return false;
    return step.completed() ?? this.visited().has(step);
  }

  /** Indique si l'étape peut être sélectionnée depuis l'étape active. */
  canSelect(index: number): boolean {
    const steps = this.steps();
    const current = this.activeIndex();
    const target = steps[index];
    if (!target) return false;
    if (index === current) return true;
    if (index < current) return target.editable();
    if (!this.linear()) return true;
    // L'étape active sera marquée parcourue en la quittant : seul un `completed` explicite la bloque.
    return steps.slice(0, index).every((step, i) => {
      if (step.optional()) return true;
      if (i === current) return step.completed() ?? true;
      return this.isCompleted(i);
    });
  }

  /**
   * Navigation relative déclenchée par `gestioStepperNext` / `gestioStepperPrevious` :
   * le focus passe sur l'en-tête de la nouvelle étape. Usage interne.
   */
  ɵstep(delta: 1 | -1): boolean {
    return this.navigate(this.activeIndex() + delta, true);
  }

  protected status(index: number): string {
    const text = this.text();
    const position = interpolate(text.position, {
      index: index + 1,
      count: this.steps().length,
    });
    if (this.steps()[index]?.hasError()) return `${position}, ${text.error}`;
    if (this.isCompleted(index)) return `${position}, ${text.completed}`;
    return position;
  }

  protected headerId(index: number): string {
    return `${this.baseId}-header-${index}`;
  }

  protected panelId(index: number): string {
    return `${this.baseId}-panel-${index}`;
  }

  protected descriptionId(index: number): string {
    return `${this.baseId}-description-${index}`;
  }

  protected onHeaderClick(index: number): void {
    this.focusIndex.set(index);
    this.navigate(index, false);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const count = this.steps().length;
    if (!count) return;
    const vertical = this.orientation() === 'vertical';
    const position = this.focusIndex();
    let target: number;

    switch (event.key) {
      case vertical ? 'ArrowDown' : 'ArrowRight':
        target = (position + 1) % count;
        break;
      case vertical ? 'ArrowUp' : 'ArrowLeft':
        target = (position - 1 + count) % count;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusHeader(target);
  }

  private navigate(index: number, moveFocus: boolean): boolean {
    const steps = this.steps();
    const current = this.activeIndex();
    if (index === current || index < 0 || index >= steps.length) return false;

    if (!this.canSelect(index)) {
      this.announce(this.text().blocked);
      return false;
    }

    // Quitter une étape vers l'avant la marque comme parcourue.
    if (index > current) {
      const leaving = steps[current];
      this.visited.update((set) => new Set(set).add(leaving));
    }
    this.selectedIndex.set(index);

    if (moveFocus) {
      this.focusHeader(index);
    } else {
      this.announce(
        interpolate(this.text().stepChanged, {
          index: index + 1,
          count: steps.length,
          label: steps[index].label(),
        }),
      );
    }
    return true;
  }

  private focusHeader(index: number): void {
    this.focusIndex.set(index);
    this.headers()[index]?.nativeElement.focus();
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
