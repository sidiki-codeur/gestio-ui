import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioToastService } from './toast.service';
import { GestioToaster } from './toaster';
import { provideGestioToast } from './toast.types';

@Component({
  imports: [GestioToaster],
  template: `<gestio-toaster />`,
})
class Host {}

/** Minuteurs de fermeture encore suivis par le service. */
function pendingTimers(service: GestioToastService): number {
  return (service as unknown as { timers: Map<string, unknown> }).timers.size;
}

describe('GestioToastService', () => {
  const announce = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.useFakeTimers();
    announce.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideGestioToast({ duration: 4000, maxVisible: 2 }),
        { provide: LiveAnnouncer, useValue: { announce } },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const service = TestBed.inject(GestioToastService);
    const render = () => {
      fixture.detectChanges();
      return Array.from(fixture.nativeElement.querySelectorAll('.gestio-toast')) as HTMLElement[];
    };
    return { service, render };
  }

  it('expose les quatre variantes avec titre facultatif', () => {
    const { service, render } = setup();
    service.success('Facture enregistrée', { title: 'Succès' });
    service.info('Synchronisation en cours');

    const toasts = render();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].classList).toContain('gestio-toast--success');
    expect(toasts[0].textContent).toContain('Succès');
    expect(service.toasts()[1].variant).toBe('info');
    service.clear();
  });

  it('se ferme automatiquement après la durée configurée', () => {
    const { service, render } = setup();
    service.warning('Session bientôt expirée');
    expect(render()).toHaveLength(1);

    vi.advanceTimersByTime(3999);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
    expect(render()).toHaveLength(0);
  });

  it('respecte une durée propre et la valeur 0 (persistant)', () => {
    const { service } = setup();
    service.error('Échec de l’envoi', { duration: 0 });
    service.success('Envoyé', { duration: 1000 });

    vi.advanceTimersByTime(60_000);
    expect(service.toasts().map((toast) => toast.message)).toEqual(['Échec de l’envoi']);
    service.clear();
  });

  it('se ferme manuellement via le bouton et annule le minuteur', () => {
    const { service, render } = setup();
    const id = service.info('Export prêt');
    const close = render()[0].querySelector('button') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fermer la notification');

    close.click();
    expect(service.toasts()).toHaveLength(0);
    expect(pendingTimers(service)).toBe(0);
    expect(() => service.dismiss(id)).not.toThrow();
  });

  it('limite le nombre de notifications visibles', () => {
    const { service } = setup();
    service.info('Un');
    service.info('Deux');
    service.info('Trois');
    expect(service.toasts().map((toast) => toast.message)).toEqual(['Deux', 'Trois']);
    service.clear();
    expect(pendingTimers(service)).toBe(0);
  });

  it('suspend la fermeture au survol et la reprend avec le temps restant', () => {
    const { service, render } = setup();
    service.success('Modifications enregistrées');
    const toast = render()[0];

    vi.advanceTimersByTime(3000);
    toast.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(10_000);
    expect(service.toasts()).toHaveLength(1);

    toast.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(999);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it('suspend la fermeture tant que le focus est dans la notification', () => {
    const { service, render } = setup();
    service.info('Brouillon sauvegardé');
    const toast = render()[0];

    toast.dispatchEvent(new FocusEvent('focusin'));
    vi.advanceTimersByTime(10_000);
    expect(service.toasts()).toHaveLength(1);

    toast.dispatchEvent(new FocusEvent('focusout'));
    vi.advanceTimersByTime(4000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('annonce les messages avec une politesse adaptée', () => {
    const { service } = setup();
    service.success('Client créé', { title: 'Succès' });
    service.error('Paiement refusé');
    expect(announce).toHaveBeenNthCalledWith(1, 'Succès. Client créé', 'polite');
    expect(announce).toHaveBeenNthCalledWith(2, 'Paiement refusé', 'assertive');
    service.clear();
  });

  it('ne déplace jamais le focus', () => {
    const { service, render } = setup();
    const before = document.activeElement;
    service.error('Connexion perdue');
    render();
    expect(document.activeElement).toBe(before);
    service.clear();
  });
});
