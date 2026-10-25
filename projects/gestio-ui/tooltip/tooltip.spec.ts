import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioTooltip } from './tooltip';

@Component({
  imports: [GestioTooltip],
  template: `
    <button
      type="button"
      aria-label="Exporter"
      [gestioTooltip]="message()"
      [gestioTooltipDisabled]="disabled()"
      #tip="gestioTooltip"
    >
      ⇩
    </button>
  `,
})
class Host {
  readonly message = signal('Exporter en CSV');
  readonly disabled = signal(false);
}

describe('GestioTooltip', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const panel = () => document.querySelector('.gestio-tooltip') as HTMLElement | null;
    return { fixture, host: fixture.componentInstance, button, panel };
  }

  afterEach(() => vi.useRealTimers());

  it('décrit le déclencheur par aria-describedby sans remplacer son nom', async () => {
    const { button } = await setup();
    const id = button.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.textContent).toBe('Exporter en CSV');
    expect(button.getAttribute('aria-label')).toBe('Exporter');
  });

  it('s’affiche au survol après un délai et reste affiché sur la bulle', async () => {
    const { button, panel } = await setup();
    vi.useFakeTimers();
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(399);
    expect(panel()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(panel()?.textContent).toBe('Exporter en CSV');
    expect(panel()?.getAttribute('aria-hidden')).toBe('true');

    // Le pointeur passe du déclencheur à la bulle : elle reste affichée.
    button.dispatchEvent(new MouseEvent('mouseleave'));
    panel()!.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(500);
    expect(panel()).not.toBeNull();

    panel()!.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(150);
    expect(panel()).toBeNull();
  });

  it('se ferme avec Échap', async () => {
    const { button, panel } = await setup();
    vi.useFakeTimers();
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(panel()).not.toBeNull();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel()).toBeNull();
  });

  it('ne s’affiche pas lorsqu’il est désactivé', async () => {
    const { fixture, host, button, panel } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    vi.useFakeTimers();
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(panel()).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});
