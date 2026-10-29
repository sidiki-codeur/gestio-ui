import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioAccordion } from './accordion';
import { GestioAccordionItem } from './accordion-item';

@Component({
  imports: [GestioAccordion, GestioAccordionItem],
  template: `
    <gestio-accordion [multi]="multi()" [variant]="variant()">
      <gestio-accordion-item
        heading="Coordonnées"
        [(expanded)]="first"
        (opened)="opened = opened + 1"
        (closed)="closed = closed + 1"
      >
        <svg gestioAccordionIcon class="icon" aria-hidden="true"></svg>
        14 rue des Tanneurs
      </gestio-accordion-item>
      <gestio-accordion-item heading="Paiement" [headingLevel]="4">30 jours</gestio-accordion-item>
      <gestio-accordion-item heading="Archives" disabled>Archives</gestio-accordion-item>
      <gestio-accordion-item heading="Notes">Notes internes</gestio-accordion-item>
    </gestio-accordion>
  `,
})
class Host {
  readonly multi = signal(false);
  readonly variant = signal<'bordered' | 'separated' | 'flush'>('bordered');
  readonly first = signal(false);
  readonly accordion = viewChild.required(GestioAccordion);
  opened = 0;
  closed = 0;
}

describe('GestioAccordion', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const triggers = Array.from(
      element.querySelectorAll('.gestio-accordion-item__trigger'),
    ) as HTMLButtonElement[];
    const panels = Array.from(element.querySelectorAll('[role="region"]')) as HTMLElement[];
    const press = async (key: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, element, triggers, panels, press };
  }

  it('place chaque bouton dans un titre et relie en-têtes et régions', async () => {
    const { element, triggers, panels } = await setup();
    expect(triggers).toHaveLength(4);
    expect(triggers[0].parentElement?.tagName).toBe('H3');
    expect(triggers[1].parentElement?.tagName).toBe('H4');
    triggers.forEach((trigger, index) => {
      expect(trigger.getAttribute('aria-controls')).toBe(panels[index].id);
      expect(panels[index].getAttribute('aria-labelledby')).toBe(trigger.id);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(panels[index].hidden).toBe(true);
    });
    expect(triggers[0].textContent).toContain('Coordonnées');
    expect(triggers[0].querySelector('.icon')).not.toBeNull();
    expect(element.querySelector('gestio-accordion')?.classList).toContain(
      'gestio-accordion--bordered',
    );
  });

  it('ouvre et ferme au clic, met à jour le model et émet opened/closed', async () => {
    const { fixture, host, triggers, panels } = await setup();
    triggers[0].click();
    await fixture.whenStable();
    expect(host.first()).toBe(true);
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(panels[0].hidden).toBe(false);
    expect(host.opened).toBe(1);

    triggers[0].click();
    await fixture.whenStable();
    expect(host.first()).toBe(false);
    expect(panels[0].hidden).toBe(true);
    expect(host.closed).toBe(1);
  });

  it('ouvre la section quand le model change', async () => {
    const { fixture, host, triggers } = await setup();
    host.first.set(true);
    await fixture.whenStable();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('referme les autres sections sauf avec multi', async () => {
    const { fixture, host, triggers } = await setup();
    triggers[0].click();
    await fixture.whenStable();
    triggers[1].click();
    await fixture.whenStable();
    expect(host.first()).toBe(false);
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');

    host.multi.set(true);
    await fixture.whenStable();
    triggers[0].click();
    await fixture.whenStable();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('openAll et closeAll ignorent les sections désactivées', async () => {
    const { fixture, host, triggers } = await setup();
    host.multi.set(true);
    await fixture.whenStable();
    host.accordion().openAll();
    await fixture.whenStable();
    expect(triggers.map((t) => t.getAttribute('aria-expanded'))).toEqual([
      'true',
      'true',
      'false',
      'true',
    ]);
    expect(host.first()).toBe(true);
    host.accordion().closeAll();
    await fixture.whenStable();
    expect(triggers.every((t) => t.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('désactive une section', async () => {
    const { fixture, triggers } = await setup();
    expect(triggers[2].disabled).toBe(true);
    triggers[2].click();
    await fixture.whenStable();
    expect(triggers[2].getAttribute('aria-expanded')).toBe('false');
  });

  it('navigue entre les en-têtes avec flèches, Début et Fin en ignorant les désactivés', async () => {
    const { triggers, press } = await setup();
    triggers[0].focus();
    await press('ArrowDown');
    expect(document.activeElement).toBe(triggers[1]);
    await press('ArrowDown');
    expect(document.activeElement).toBe(triggers[3]);
    await press('ArrowDown');
    expect(document.activeElement).toBe(triggers[0]);
    await press('ArrowUp');
    expect(document.activeElement).toBe(triggers[3]);
    await press('Home');
    expect(document.activeElement).toBe(triggers[0]);
    await press('End');
    expect(document.activeElement).toBe(triggers[3]);
  });

  it('applique la variante aux sections', async () => {
    const { fixture, host, element } = await setup();
    host.variant.set('separated');
    await fixture.whenStable();
    expect(element.querySelector('gestio-accordion-item')?.classList).toContain(
      'gestio-accordion-item--separated',
    );
  });
});
