import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, disabled, form } from '@angular/forms/signals';
import { GestioRating } from './rating';
import { GestioReview } from './review';

@Component({
  imports: [GestioRating],
  template: `
    <gestio-rating
      id="display"
      readonly
      showValue
      [value]="4.5"
      [count]="1280"
      ariaLabel="Note moyenne"
    />
    <gestio-rating id="input" label="Votre note" [(value)]="note" [disabled]="locked()" />
  `,
})
class Host {
  readonly note = signal<number | null>(null);
  readonly locked = signal(false);
}

@Component({
  imports: [GestioRating, FormField],
  template: `<gestio-rating ariaLabel="Satisfaction" [formField]="f.score" />`,
})
class FormHost {
  readonly model = signal({ score: 3, locked: false });
  readonly f = form(this.model, (path) => {
    disabled(path.score, ({ valueOf }) => valueOf(path.locked));
  });
}

@Component({
  imports: [GestioReview],
  template: `
    <gestio-review
      author="Claire Moreau"
      date="2026-10-12"
      [rating]="4"
      heading="Très pratique"
      verified
    >
      Livraison rapide.
    </gestio-review>
  `,
})
class ReviewHost {}

describe('GestioRating', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('lecture seule : nom accessible, étoiles fractionnaires, valeur et nombre d’avis', async () => {
    const { el } = await setup();
    const display = el.querySelector('#display')!;
    const img = display.querySelector('[role="img"]')!;
    expect(img.getAttribute('aria-label')).toBe('Note moyenne — Note : 4,5 sur 5');
    const fills = [...display.querySelectorAll<HTMLElement>('.gestio-rating__fill')].map(
      (f) => f.style.width,
    );
    expect(fills).toEqual(['100%', '100%', '100%', '100%', '50%']);
    expect(display.querySelector('.gestio-rating__value')!.textContent).toBe('4,5');
    expect(display.querySelector('.gestio-rating__count')!.textContent).toContain('1 280 avis');
    expect(display.querySelector('input')).toBeNull();
  });

  it('saisie : un groupe de radios nommés, légende, sélection au clic', async () => {
    const { fixture, host, el } = await setup();
    const group = el.querySelector('#input fieldset')!;
    expect(group.querySelector('legend')!.textContent).toContain('Votre note');
    const radios = group.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios.length).toBe(5);
    expect(radios[0].getAttribute('aria-label')).toBe('1 étoile');
    expect(radios[2].getAttribute('aria-label')).toBe('3 étoiles');
    expect(new Set([...radios].map((r) => r.name)).size).toBe(1);

    radios[3].click();
    await fixture.whenStable();
    expect(host.note()).toBe(4);
    expect(radios[3].checked).toBe(true);
  });

  it('aperçu au survol puis retour à la valeur', async () => {
    const { fixture, host, el } = await setup();
    host.note.set(1);
    await fixture.whenStable();
    const options = el.querySelectorAll<HTMLElement>('#input .gestio-rating__option');
    options[2].dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    const filled = () =>
      [...el.querySelectorAll<HTMLElement>('#input .gestio-rating__fill')].filter(
        (f) => f.style.width === '100%',
      ).length;
    expect(filled()).toBe(3);
    el.querySelector('#input fieldset')!.dispatchEvent(new Event('pointerleave'));
    await fixture.whenStable();
    expect(filled()).toBe(1);
  });

  it('désactivé : fieldset désactivé', async () => {
    const { fixture, host, el } = await setup();
    host.locked.set(true);
    await fixture.whenStable();
    expect(el.querySelector<HTMLFieldSetElement>('#input fieldset')!.disabled).toBe(true);
  });

  it('Signal Forms : lit, écrit et applique l’état désactivé', async () => {
    const fixture = TestBed.createComponent(FormHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const radios = el.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios[2].checked).toBe(true);
    expect(el.querySelector('fieldset')!.getAttribute('aria-label')).toBe('Satisfaction');

    radios[4].click();
    expect(fixture.componentInstance.model().score).toBe(5);

    fixture.componentInstance.model.update((v) => ({ ...v, locked: true }));
    await fixture.whenStable();
    expect(el.querySelector('fieldset')!.disabled).toBe(true);
  });
});

describe('GestioReview', () => {
  it('affiche auteur, initiales, date, note, titre et mention vérifiée', async () => {
    const fixture = TestBed.createComponent(ReviewHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const review = el.querySelector('gestio-review')!;
    expect(review.getAttribute('role')).toBe('article');
    expect(review.querySelector('.gestio-review__author')!.textContent).toBe('Claire Moreau');
    expect(review.querySelector('.gestio-review__avatar--initials')!.textContent).toBe('CM');
    const time = review.querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe('2026-10-12');
    expect(time.textContent).toBe('12 octobre 2026');
    expect(review.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Note : 4 sur 5');
    const title = review.querySelector('[role="heading"]')!;
    expect(title.getAttribute('aria-level')).toBe('3');
    expect(title.textContent).toContain('Très pratique');
    expect(review.textContent).toContain('Achat vérifié');
    expect(review.textContent).toContain('Livraison rapide.');
  });
});
