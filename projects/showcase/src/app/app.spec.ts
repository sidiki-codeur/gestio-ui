import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { NAVIGATION } from './core/navigation';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('affiche le nom de la bibliothèque et la navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.sc-brand')?.textContent).toContain('Gestio UI');
    const links = element.querySelectorAll('nav a');
    const expected = NAVIGATION.reduce((count, section) => count + section.items.length, 0);
    expect(links.length).toBe(expected);
  });

  it('bascule le thème clair / sombre sur <html>', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      '.sc-theme-toggle:not(.sc-design-toggle)',
    ) as HTMLButtonElement;
    const initial = document.documentElement.getAttribute('data-gestio-theme') === 'dark';

    toggle.click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-gestio-theme')).toBe(
      initial ? 'light' : 'dark',
    );
    expect(toggle.getAttribute('aria-pressed')).toBe(String(!initial));
  });

  it('bascule le style Material sur <html>', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      '.sc-design-toggle',
    ) as HTMLButtonElement;
    const root = document.documentElement;
    const initial = root.getAttribute('data-gestio-design') === 'material';

    toggle.click();
    await fixture.whenStable();
    expect(root.getAttribute('data-gestio-design')).toBe(initial ? null : 'material');
    expect(toggle.getAttribute('aria-pressed')).toBe(String(!initial));

    toggle.click();
    await fixture.whenStable();
    expect(root.getAttribute('data-gestio-design')).toBe(initial ? 'material' : null);
  });

  it('utilise gestio-app-shell : repères, menu et tiroir', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);

    expect(element.querySelector('gestio-app-shell header')).not.toBeNull();
    expect(element.querySelector('gestio-app-shell main')).not.toBeNull();
    const menu = element.querySelector('.gestio-shell__toggle') as HTMLButtonElement;
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    menu.click();
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect((element.querySelector('main') as HTMLElement & { inert: boolean }).inert).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    element.remove();
  });
});
