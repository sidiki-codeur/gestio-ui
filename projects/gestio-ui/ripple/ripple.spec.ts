import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioRipple } from './ripple';

@Component({
  imports: [GestioRipple, GestioButton],
  template: `
    <div
      class="tile"
      gestioRipple
      [gestioRippleDisabled]="rippleDisabled()"
      [style.--gestio-ripple]="design()"
    >
      Tuile
    </div>
    <button gestioButton [disabled]="disabled()" [style.--gestio-ripple]="design()">
      Enregistrer
    </button>
  `,
})
class Host {
  readonly design = signal<'on' | null>('on');
  readonly disabled = signal(false);
  readonly rippleDisabled = signal(false);
}

describe('GestioRipple', () => {
  const animate = vi.fn(() => ({ finished: Promise.resolve() }) as unknown as Animation);

  beforeEach(() => {
    animate.mockClear();
    HTMLElement.prototype.animate = animate;
  });

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const tile = el.querySelector('.tile') as HTMLElement;
    const button = el.querySelector('button') as HTMLButtonElement;
    return { fixture, host: fixture.componentInstance, tile, button };
  }

  function press(target: HTMLElement, init: MouseEventInit = {}): void {
    target.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 4, clientY: 4, ...init }),
    );
  }

  const waves = (target: HTMLElement) => target.querySelectorAll(':scope > .gestio-ripple');

  it('crée une onde masquée aux technologies d’assistance quand --gestio-ripple vaut on', async () => {
    const { tile } = await setup();
    press(tile);

    const container = waves(tile)[0] as HTMLElement;
    expect(container).toBeDefined();
    expect(container.getAttribute('aria-hidden')).toBe('true');
    expect(container.style.pointerEvents).toBe('none');
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('retire l’onde après le relâchement du pointeur', async () => {
    const { tile } = await setup();
    press(tile);
    document.dispatchEvent(new MouseEvent('pointerup'));
    await vi.waitFor(() => expect(waves(tile).length).toBe(0));
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it('reste inactive hors du style Material', async () => {
    const { fixture, host, tile } = await setup();
    host.design.set(null);
    await fixture.whenStable();
    press(tile);
    expect(waves(tile).length).toBe(0);
  });

  it('ignore le bouton secondaire, gestioRippleDisabled et les éléments désactivés', async () => {
    const { fixture, host, tile, button } = await setup();
    press(tile, { button: 2 });
    expect(waves(tile).length).toBe(0);

    host.rippleDisabled.set(true);
    host.disabled.set(true);
    await fixture.whenStable();
    press(tile);
    press(button);
    expect(waves(tile).length).toBe(0);
    expect(waves(button).length).toBe(0);
  });

  it('est appliquée à gestioButton sans changer son API', async () => {
    const { button } = await setup();
    press(button);
    expect(waves(button).length).toBe(1);
    expect(button.getAttribute('gestioRipple')).toBeNull();
  });
});
