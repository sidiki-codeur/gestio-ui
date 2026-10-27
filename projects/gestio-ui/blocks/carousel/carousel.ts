import {
  Component,
  DOCUMENT,
  InjectionToken,
  Signal,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Libellés du carrousel (internationalisation). */
export interface GestioCarouselLabels {
  /** Rôle annoncé pour le carrousel (`aria-roledescription`). */
  carousel: string;
  /** Rôle annoncé pour une diapositive (`aria-roledescription`). */
  slide: string;
  /** Nom par défaut d'une diapositive ; `{index}`, `{count}` sont remplacés. */
  slidePosition: string;
  previous: string;
  next: string;
  /** Nom du groupe d'indicateurs. */
  indicators: string;
  /** Nom d'un indicateur ; `{index}` est remplacé. */
  goTo: string;
  pause: string;
  play: string;
}

export const GESTIO_CAROUSEL_LABELS: GestioCarouselLabels = {
  carousel: 'carrousel',
  slide: 'diapositive',
  slidePosition: '{index} sur {count}',
  previous: 'Diapositive précédente',
  next: 'Diapositive suivante',
  indicators: 'Choisir une diapositive',
  goTo: 'Diapositive {index}',
  pause: 'Arrêter le défilement automatique',
  play: 'Démarrer le défilement automatique',
};

/** Contexte partagé avec les diapositives. Usage interne. */
interface CarouselContext {
  readonly slides: Signal<readonly GestioCarouselSlide[]>;
  readonly current: Signal<number>;
  readonly text: Signal<GestioCarouselLabels>;
}

const GESTIO_CAROUSEL = new InjectionToken<CarouselContext>('GestioCarousel');

/** Distance minimale (px) d'un glissement horizontal pour changer de diapositive. */
const SWIPE_THRESHOLD = 40;

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Diapositive d'un `gestio-carousel`. Seule la diapositive active est
 * exposée : les autres sont `inert` (ni focalisables, ni lues).
 */
@Component({
  selector: 'gestio-carousel-slide',
  template: '<ng-content />',
  styles: ':host { display: block; flex: 0 0 100%; min-width: 0; box-sizing: border-box; }',
  host: {
    class: 'gestio-carousel-slide',
    role: 'group',
    '[attr.aria-roledescription]': 'carousel.text().slide',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.inert]': 'active() ? null : ""',
    '[class.is-active]': 'active()',
  },
})
export class GestioCarouselSlide {
  protected readonly carousel = inject(GESTIO_CAROUSEL);

  /** Nom de la diapositive ; « 2 sur 5 » par défaut. */
  readonly label = input<string>();

  protected readonly position = computed(() => this.carousel.slides().indexOf(this));
  protected readonly active = computed(() => this.position() === this.carousel.current());
  protected readonly accessibleName = computed(() => {
    const position = interpolate(this.carousel.text().slidePosition, {
      index: this.position() + 1,
      count: this.carousel.slides().length,
    });
    return this.label() ? `${this.label()} (${position})` : position;
  });
}

/**
 * Carrousel accessible (motif ARIA « Carousel ») : boutons précédent /
 * suivant, indicateurs, flèches du clavier, glissement tactile et défilement
 * automatique optionnel.
 *
 * ```html
 * <gestio-carousel ariaLabel="Nouveautés" [(index)]="slide" autoplay>
 *   <gestio-carousel-slide><img src="…" alt="…" /></gestio-carousel-slide>
 *   <gestio-carousel-slide>…</gestio-carousel-slide>
 * </gestio-carousel>
 * ```
 *
 * Le défilement automatique propose toujours un bouton pause, s'interrompt
 * au survol et au focus, et ne démarre pas si l'utilisateur a demandé à
 * réduire les animations (`prefers-reduced-motion`).
 */
@Component({
  selector: 'gestio-carousel',
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  providers: [{ provide: GESTIO_CAROUSEL, useExisting: forwardRef(() => GestioCarousel) }],
  host: {
    class: 'gestio-carousel',
    role: 'region',
    '[attr.aria-roledescription]': 'text().carousel',
    '[attr.aria-label]': 'ariaLabel()',
    '(keydown)': 'handleKeydown($event)',
    '(pointerenter)': 'hovered.set(true)',
    '(pointerleave)': 'hovered.set(false)',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class GestioCarousel implements CarouselContext {
  private readonly document = inject(DOCUMENT);

  /** Nom accessible du carrousel (obligatoire en pratique). */
  readonly ariaLabel = input<string>();
  /** Diapositive active, à partir de 0 (`[(index)]`). */
  readonly index = model(0);
  /** Revient au début après la dernière diapositive (et inversement). */
  readonly loop = input(false, { transform: booleanAttribute });
  /** Défilement automatique. */
  readonly autoplay = input(false, { transform: booleanAttribute });
  /** Durée d'affichage d'une diapositive en défilement automatique (ms). */
  readonly interval = input(5000, { transform: numberAttribute });
  /** Affiche les boutons précédent / suivant. */
  readonly showControls = input(true, { transform: booleanAttribute });
  /** Affiche les indicateurs de position. */
  readonly showIndicators = input(true, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioCarouselLabels>>({});

  readonly slides = contentChildren(GestioCarouselSlide);

  readonly text = computed<GestioCarouselLabels>(() => ({
    ...GESTIO_CAROUSEL_LABELS,
    ...this.labels(),
  }));

  protected readonly trackId = gestioUniqueId('gestio-carousel');
  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  private readonly reducedMotion =
    this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  /** Pause demandée par l'utilisateur (bouton). */
  private readonly userPaused = signal(this.reducedMotion);

  protected readonly count = computed(() => this.slides().length);
  /** Index effectif, borné au nombre de diapositives. */
  readonly current = computed(() =>
    Math.min(Math.max(0, this.index()), Math.max(0, this.count() - 1)),
  );
  protected readonly indicators = computed(() =>
    this.slides().map((_, i) => ({
      index: i,
      label: interpolate(this.text().goTo, { index: i + 1 }),
    })),
  );
  protected readonly canPrevious = computed(() => this.loop() || this.current() > 0);
  protected readonly canNext = computed(() => this.loop() || this.current() < this.count() - 1);

  /** Le défilement est actif (bouton en position « pause »). */
  protected readonly playing = computed(() => this.autoplay() && !this.userPaused());
  /** Défilement effectif : actif et ni survolé ni focalisé. */
  protected readonly rotating = computed(
    () => this.playing() && !this.hovered() && !this.focused() && this.count() > 1,
  );

  private pointerStart: { x: number; y: number } | null = null;

  constructor() {
    effect((onCleanup) => {
      if (!this.rotating()) return;
      const current = this.current();
      const timer = setTimeout(() => this.goTo((current + 1) % this.count()), this.interval());
      onCleanup(() => clearTimeout(timer));
    });
  }

  /** Affiche la diapositive précédente. */
  previous(): void {
    const current = this.current();
    if (current > 0) this.goTo(current - 1);
    else if (this.loop()) this.goTo(this.count() - 1);
  }

  /** Affiche la diapositive suivante. */
  next(): void {
    const current = this.current();
    if (current < this.count() - 1) this.goTo(current + 1);
    else if (this.loop()) this.goTo(0);
  }

  /** Affiche la diapositive `index` (à partir de 0). */
  goTo(index: number): void {
    if (index >= 0 && index < this.count()) this.index.set(index);
  }

  protected togglePlay(): void {
    this.userPaused.update((paused) => !paused);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    const rtl = this.document.dir === 'rtl';
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (rtl) this.next();
      else this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (rtl) this.previous();
      else this.next();
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) this.focused.set(false);
  }

  protected handlePointerDown(event: PointerEvent): void {
    this.pointerStart = { x: event.clientX, y: event.clientY };
  }

  protected handlePointerUp(event: PointerEvent): void {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    const forward = dx < 0 !== (this.document.dir === 'rtl');
    if (forward) this.next();
    else this.previous();
  }
}
