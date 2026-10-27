import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioCarousel, GestioCarouselSlide } from './carousel';

@Component({
  imports: [GestioCarousel, GestioCarouselSlide],
  template: `
    <gestio-carousel
      ariaLabel="Nouveautés"
      [(index)]="index"
      [loop]="loop()"
      [autoplay]="autoplay()"
      [interval]="40"
    >
      <gestio-carousel-slide label="Printemps"><a href="#a">A</a></gestio-carousel-slide>
      <gestio-carousel-slide><a href="#b">B</a></gestio-carousel-slide>
      <gestio-carousel-slide><a href="#c">C</a></gestio-carousel-slide>
    </gestio-carousel>
  `,
})
class Host {
  readonly index = signal(0);
  readonly loop = signal(false);
  readonly autoplay = signal(false);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('GestioCarousel', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const carousel = el.querySelector('gestio-carousel') as HTMLElement;
    const slides = [...el.querySelectorAll<HTMLElement>('gestio-carousel-slide')];
    const button = (selector: string) => el.querySelector(selector) as HTMLButtonElement;
    return { fixture, host: fixture.componentInstance, el, carousel, slides, button };
  }

  it('expose le motif ARIA carrousel et diapositive', async () => {
    const { carousel, slides } = await setup();
    expect(carousel.getAttribute('role')).toBe('region');
    expect(carousel.getAttribute('aria-roledescription')).toBe('carrousel');
    expect(carousel.getAttribute('aria-label')).toBe('Nouveautés');
    expect(slides[0].getAttribute('role')).toBe('group');
    expect(slides[0].getAttribute('aria-roledescription')).toBe('diapositive');
    expect(slides[0].getAttribute('aria-label')).toBe('Printemps (1 sur 3)');
    expect(slides[1].getAttribute('aria-label')).toBe('2 sur 3');
    expect(slides[0].hasAttribute('inert')).toBe(false);
    expect(slides[1].hasAttribute('inert')).toBe(true);
  });

  it('boutons précédent / suivant, bornés sans loop', async () => {
    const { fixture, host, slides, button } = await setup();
    const previous = button('.gestio-carousel__nav--previous');
    const next = button('.gestio-carousel__nav--next');
    expect(previous.disabled).toBe(true);
    expect(next.getAttribute('aria-label')).toBe('Diapositive suivante');

    next.click();
    next.click();
    await fixture.whenStable();
    expect(host.index()).toBe(2);
    expect(next.disabled).toBe(true);
    expect(slides[2].hasAttribute('inert')).toBe(false);
    expect(slides[0].hasAttribute('inert')).toBe(true);

    host.loop.set(true);
    await fixture.whenStable();
    next.click();
    expect(host.index()).toBe(0);
  });

  it('indicateurs : aria-current et navigation directe', async () => {
    const { fixture, host, el } = await setup();
    const group = el.querySelector('.gestio-carousel__indicators')!;
    expect(group.getAttribute('role')).toBe('group');
    const dots = group.querySelectorAll<HTMLButtonElement>('button');
    expect(dots.length).toBe(3);
    expect(dots[0].getAttribute('aria-current')).toBe('true');
    dots[2].click();
    await fixture.whenStable();
    expect(host.index()).toBe(2);
    expect(dots[2].getAttribute('aria-current')).toBe('true');
    expect(dots[0].hasAttribute('aria-current')).toBe(false);
  });

  it('flèches du clavier et glissement', async () => {
    const { fixture, host, carousel, el } = await setup();
    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(host.index()).toBe(1);
    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(host.index()).toBe(0);

    const viewport = el.querySelector('.gestio-carousel__viewport')!;
    viewport.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 10 }));
    viewport.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 15 }));
    await fixture.whenStable();
    expect(host.index()).toBe(1);
  });

  it('défilement automatique : bouton pause, rotation, arrêt au focus', async () => {
    const { fixture, host, carousel, button } = await setup();
    host.autoplay.set(true);
    await fixture.whenStable();

    const play = button('.gestio-carousel__play');
    expect(play.getAttribute('aria-label')).toBe('Arrêter le défilement automatique');
    expect(carousel.querySelector('.gestio-carousel__track')!.getAttribute('aria-live')).toBe(
      'off',
    );

    await wait(60);
    await fixture.whenStable();
    expect(host.index()).toBe(1);

    play.click();
    await fixture.whenStable();
    expect(play.getAttribute('aria-label')).toBe('Démarrer le défilement automatique');
    await wait(120);
    expect(host.index()).toBe(1);

    play.click();
    carousel.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await fixture.whenStable();
    await wait(120);
    expect(host.index()).toBe(1);
  });
});
