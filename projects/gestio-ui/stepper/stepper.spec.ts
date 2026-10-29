import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioStep } from './step';
import { GestioStepper, GestioStepperOrientation } from './stepper';
import { GestioStepperNext, GestioStepperPrevious } from './stepper-buttons';

@Component({
  imports: [GestioStepper, GestioStep, GestioStepperNext, GestioStepperPrevious],
  template: `
    <gestio-stepper
      [(selectedIndex)]="index"
      [linear]="linear()"
      [orientation]="orientation()"
      [labels]="{ steps: 'Création du fournisseur' }"
    >
      <gestio-step
        label="Identité"
        description="Raison sociale et SIRET"
        [completed]="identityDone()"
      >
        <input aria-label="Raison sociale" class="field" />
        <button gestioStepperNext class="next-0">Suivant</button>
      </gestio-step>
      <gestio-step label="Coordonnées" optional [hasError]="contactError()">
        <button gestioStepperPrevious class="prev-1">Précédent</button>
        <button gestioStepperNext class="next-1">Suivant</button>
      </gestio-step>
      <gestio-step label="Conditions" [editable]="conditionsEditable()">
        <button gestioStepperNext class="next-2">Suivant</button>
      </gestio-step>
      <gestio-step label="Récapitulatif">
        <button gestioStepperPrevious class="prev-3">Précédent</button>
      </gestio-step>
    </gestio-stepper>
  `,
})
class Host {
  readonly index = signal(0);
  readonly linear = signal(false);
  readonly orientation = signal<GestioStepperOrientation>('horizontal');
  readonly identityDone = signal<boolean | undefined>(undefined);
  readonly contactError = signal(false);
  readonly conditionsEditable = signal(true);
  readonly stepper = viewChild.required(GestioStepper);
}

describe('GestioStepper', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const headers = () => [...el.querySelectorAll<HTMLButtonElement>('.gestio-stepper__header')];
    const panels = () => [...el.querySelectorAll<HTMLElement>('[role="region"]')];
    const live = () => el.querySelector('[aria-live]')!.textContent!.trim();
    return { fixture, host: fixture.componentInstance, el, headers, panels, live };
  }

  it('rend une liste ordonnée d’en-têtes, aria-current sur l’étape active et un seul panneau visible', async () => {
    const { el, headers, panels } = await setup();
    const list = el.querySelector('ol')!;
    expect(list.getAttribute('aria-label')).toBe('Création du fournisseur');
    expect(headers()).toHaveLength(4);
    expect(headers()[0].getAttribute('aria-current')).toBe('step');
    expect(headers()[1].getAttribute('aria-current')).toBeNull();
    expect(headers()[0].textContent).toContain('Étape 1 sur 4');
    expect(headers()[1].textContent).toContain('Facultative');

    const describedBy = headers()[0].getAttribute('aria-describedby')!;
    expect(el.querySelector(`#${describedBy}`)!.textContent).toContain('SIRET');

    expect(panels().map((panel) => panel.hidden)).toEqual([false, true, true, true]);
    expect(panels()[0].getAttribute('aria-labelledby')).toBe(headers()[0].id);
    expect(panels()[0].querySelector('.field')).not.toBeNull();
  });

  it('gestioStepperNext / Previous naviguent, marquent l’étape terminée et déplacent le focus', async () => {
    const { fixture, host, el, headers, panels } = await setup();
    (el.querySelector('.next-0') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(host.index()).toBe(1);
    expect(panels()[1].hidden).toBe(false);
    expect(document.activeElement).toBe(headers()[1]);
    expect(headers()[0].textContent).toContain('Étape 1 sur 4, terminée');
    expect(headers()[1].getAttribute('tabindex')).toBe('0');
    expect(headers()[0].getAttribute('tabindex')).toBe('-1');

    (el.querySelector('.prev-1') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(host.index()).toBe(0);
    expect((el.querySelector('.next-0') as HTMLButtonElement).type).toBe('button');
  });

  it('méthodes publiques next(), previous(), select(), reset() et annonce live', async () => {
    const { fixture, host, live } = await setup();
    const stepper = host.stepper();

    expect(stepper.next()).toBe(true);
    await fixture.whenStable();
    expect(host.index()).toBe(1);
    expect(live()).toBe('Étape 2 sur 4 : Coordonnées');

    expect(stepper.select(3)).toBe(true);
    expect(stepper.previous()).toBe(true);
    await fixture.whenStable();
    expect(host.index()).toBe(2);

    stepper.reset();
    await fixture.whenStable();
    expect(host.index()).toBe(0);
    expect(stepper.isCompleted(0)).toBe(false);
  });

  it('mode linear : bloque au-delà d’une étape non terminée, ignore les étapes facultatives', async () => {
    const { fixture, host, el, headers, live } = await setup();
    host.linear.set(true);
    host.identityDone.set(false);
    await fixture.whenStable();

    expect(headers()[1].getAttribute('aria-disabled')).toBe('true');
    headers()[2].click();
    await fixture.whenStable();
    expect(host.index()).toBe(0);
    expect(live()).toContain('non accessible');

    (el.querySelector('.next-0') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(host.index()).toBe(0);

    host.identityDone.set(true);
    await fixture.whenStable();
    expect(headers()[1].getAttribute('aria-disabled')).toBeNull();
    // Étape 2 facultative, mais l’étape 3 n’a jamais été parcourue : l’étape 4 reste bloquée.
    expect(headers()[2].getAttribute('aria-disabled')).toBeNull();
    expect(headers()[3].getAttribute('aria-disabled')).toBe('true');

    headers()[2].click();
    await fixture.whenStable();
    expect(host.index()).toBe(2);
  });

  it('editable=false empêche de revenir sur une étape quittée', async () => {
    const { fixture, host, headers } = await setup();
    host.conditionsEditable.set(false);
    host.index.set(3);
    await fixture.whenStable();

    expect(headers()[2].getAttribute('aria-disabled')).toBe('true');
    expect(host.stepper().previous()).toBe(false);
    expect(host.index()).toBe(3);
    expect(host.stepper().select(0)).toBe(true);
  });

  it('état d’erreur annoncé dans l’en-tête', async () => {
    const { fixture, host, headers } = await setup();
    host.contactError.set(true);
    await fixture.whenStable();
    expect(headers()[1].textContent).toContain('Étape 2 sur 4, erreur');
    expect(headers()[1].closest('li')!.classList).toContain('is-error');
  });

  it('clavier : flèches selon l’orientation, Début et Fin déplacent le focus sans sélectionner', async () => {
    const { fixture, host, headers } = await setup();
    const key = (target: HTMLElement, value: string) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));

    headers()[0].focus();
    key(headers()[0], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(headers()[1]);
    expect(headers()[1].getAttribute('tabindex')).toBe('0');
    expect(host.index()).toBe(0);

    key(headers()[1], 'End');
    expect(document.activeElement).toBe(headers()[3]);
    key(headers()[3], 'ArrowRight');
    expect(document.activeElement).toBe(headers()[0]);

    host.orientation.set('vertical');
    await fixture.whenStable();
    headers()[0].focus();
    key(headers()[0], 'ArrowDown');
    expect(document.activeElement).toBe(headers()[1]);
    key(headers()[1], 'ArrowUp');
    expect(document.activeElement).toBe(headers()[0]);
    key(headers()[0], 'Home');
    expect(document.activeElement).toBe(headers()[0]);

    headers()[2].click();
    await fixture.whenStable();
    expect(host.index()).toBe(2);
  });

  it('vertical : chaque panneau est rendu sous son en-tête', async () => {
    const { fixture, host, el, panels } = await setup();
    host.orientation.set('vertical');
    await fixture.whenStable();
    const items = el.querySelectorAll('li');
    expect(items[0].querySelector('[role="region"]')).toBe(panels()[0]);
    expect(el.querySelector('.gestio-stepper--vertical')).not.toBeNull();
    // Le contenu projeté reste unique.
    expect(el.querySelectorAll('.field')).toHaveLength(1);
  });
});
