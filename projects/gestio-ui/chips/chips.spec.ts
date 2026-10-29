import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { GestioFormField } from '@gestiolabs336/ui/form-field';
import { GestioChip } from './chip';
import { GestioChipInput } from './chip-input';

@Component({
  imports: [GestioChip],
  template: `
    <gestio-chip class="static" variant="info">Facturation</gestio-chip>
    <gestio-chip class="removable" removable (removed)="removed.set(removed() + 1)"
      >Urgent</gestio-chip
    >
    <gestio-chip
      class="filter"
      removable
      [labels]="{ remove: 'Remove {label} now' }"
      [(selected)]="late"
      (removed)="removed.set(removed() + 1)"
      >En retard</gestio-chip
    >
  `,
})
class ChipHost {
  readonly late = signal(false);
  readonly removed = signal(0);
}

@Component({
  imports: [GestioChipInput, ReactiveFormsModule],
  template: `
    <gestio-chip-input
      label="Étiquettes"
      placeholder="Ajouter"
      hint="Trois au maximum"
      [maxChips]="3"
      [formControl]="tags"
      (added)="added.push($event)"
      (removed)="removedTags.push($event)"
    />
  `,
})
class InputHost {
  readonly tags = new FormControl<string[]>(['Facturation'], { nonNullable: true });
  readonly added: string[] = [];
  readonly removedTags: string[] = [];
}

@Component({
  imports: [GestioChipInput, GestioFormField, FormField],
  template: `
    <gestio-form-field label="Destinataires" hint="Adresses e-mail">
      <gestio-chip-input [formField]="f.recipients" />
    </gestio-form-field>
  `,
})
class SignalHost {
  readonly model = signal({ recipients: ['compta@atelier-moreau.fr'] });
  readonly f = form(this.model);
}

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('GestioChip', () => {
  async function setup() {
    const fixture = TestBed.createComponent(ChipHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('affiche une puce simple avec sa variante, sans bouton', async () => {
    const { el } = await setup();
    const chip = el.querySelector('.static') as HTMLElement;
    expect(chip.classList).toContain('gestio-chip--info');
    expect(chip.querySelector('button')).toBeNull();
    expect(chip.textContent?.trim()).toBe('Facturation');
  });

  it('nomme le bouton de suppression « Retirer X » et émet removed', async () => {
    const { fixture, host, el } = await setup();
    const button = el.querySelector('.removable button') as HTMLButtonElement;
    const names = button
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((id) => el.querySelector(`#${id}`)!.textContent!.trim());
    expect(names.join(' ')).toBe('Retirer Urgent');
    expect(button.getAttribute('type')).toBe('button');

    button.click();
    await fixture.whenStable();
    expect(host.removed()).toBe(1);
  });

  it('accepte un modèle de libellé personnalisé', async () => {
    const { el } = await setup();
    const button = el.querySelector('.filter .gestio-chip__remove') as HTMLButtonElement;
    const names = button
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((id) => el.querySelector(`#${id}`)!.textContent!.trim());
    expect(names.join(' ')).toBe('Remove En retard now');
  });

  it('bascule une puce de filtre avec aria-pressed', async () => {
    const { fixture, host, el } = await setup();
    const toggle = el.querySelector('.filter .gestio-chip__toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    await fixture.whenStable();
    expect(host.late()).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('.filter')!.classList).toContain('is-selected');
  });

  it('retire une puce de filtre avec Suppr', async () => {
    const { fixture, host, el } = await setup();
    const toggle = el.querySelector('.filter .gestio-chip__toggle') as HTMLButtonElement;
    const event = keydown(toggle, 'Delete');
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(host.removed()).toBe(1);
  });
});

describe('GestioChipInput', () => {
  async function setup() {
    const fixture = TestBed.createComponent(InputHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const chips = () =>
      Array.from(el.querySelectorAll('.gestio-chip__label')).map((c) => c.textContent!.trim());
    const live = () => el.querySelector('[aria-live]')!.textContent!.trim();
    const settle = async () => {
      await Promise.resolve();
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, el, input, chips, live, settle };
  }

  it('relie le libellé, la consigne et l’aide au champ', async () => {
    const { el, input } = await setup();
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    const described = input
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => el.querySelector(`#${id}`)!.textContent!.trim());
    expect(described[0]).toContain('Entrée ou virgule');
    expect(described[1]).toBe('Trois au maximum');
    expect(el.querySelector('ul')!.getAttribute('aria-label')).toBe('Valeurs saisies');
  });

  it('ajoute avec Entrée et annonce l’ajout', async () => {
    const { host, input, chips, live, settle } = await setup();
    type(input, '  Urgent ');
    const event = keydown(input, 'Enter');
    await settle();
    expect(event.defaultPrevented).toBe(true);
    expect(host.tags.value).toEqual(['Facturation', 'Urgent']);
    expect(chips()).toEqual(['Facturation', 'Urgent']);
    expect(input.value).toBe('');
    expect(host.added).toEqual(['Urgent']);
    expect(live()).toBe('Urgent ajouté');
  });

  it('laisse Entrée soumettre le formulaire quand le champ est vide', async () => {
    const { input } = await setup();
    expect(keydown(input, 'Enter').defaultPrevented).toBe(false);
  });

  it('ajoute à la virgule et découpe un collage', async () => {
    const { host, input, settle } = await setup();
    type(input, 'Litige,');
    await settle();
    expect(host.tags.value).toEqual(['Facturation', 'Litige']);
    expect(input.value).toBe('');

    type(input, 'Relance, Export');
    await settle();
    expect(host.tags.value).toEqual(['Facturation', 'Litige', 'Relance']);
    expect(input.value).toBe(' Export');
  });

  it('refuse les doublons (casse ignorée) et respecte maxChips', async () => {
    const { host, input, live, settle } = await setup();
    type(input, 'facturation');
    keydown(input, 'Enter');
    await settle();
    expect(host.tags.value).toEqual(['Facturation']);
    expect(live()).toBe('facturation est déjà présent');
    expect(input.value).toBe('facturation');

    type(input, 'A,B,C,');
    await settle();
    expect(host.tags.value).toEqual(['Facturation', 'A', 'B']);
    expect(live()).toBe('Limite de 3 atteinte');
  });

  it('retire la dernière puce avec Retour arrière dans le champ vide', async () => {
    const { host, input, live, settle } = await setup();
    const event = keydown(input, 'Backspace');
    await settle();
    expect(event.defaultPrevented).toBe(true);
    expect(host.tags.value).toEqual([]);
    expect(host.removedTags).toEqual(['Facturation']);
    expect(live()).toBe('Facturation retiré');

    type(input, 'x');
    expect(keydown(input, 'Backspace').defaultPrevented).toBe(false);
  });

  it('retire une puce par son bouton et rend le focus au champ', async () => {
    const { fixture, host, el, input, chips } = await setup();
    const button = el.querySelector('.gestio-chip__remove') as HTMLButtonElement;
    button.focus();
    button.click();
    await fixture.whenStable();
    expect(host.tags.value).toEqual([]);
    expect(chips()).toEqual([]);
    expect(document.activeElement).toBe(input);
  });

  it('suit le FormControl (écriture, désactivation, touched)', async () => {
    const { fixture, host, input, chips } = await setup();
    host.tags.setValue(['A', 'B']);
    await fixture.whenStable();
    expect(chips()).toEqual(['A', 'B']);

    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(host.tags.touched).toBe(true);

    host.tags.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });

  it('fonctionne avec [formField] dans un gestio-form-field', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.hasAttribute('aria-label')).toBe(false);
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(el.querySelector(`#${ids[ids.length - 1]}`)!.textContent).toContain('Adresses e-mail');
    expect(el.querySelector('.gestio-chip__label')!.textContent).toContain('compta@');

    type(input, 'direction@atelier-moreau.fr');
    keydown(input, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.model().recipients).toEqual([
      'compta@atelier-moreau.fr',
      'direction@atelier-moreau.fr',
    ]);
  });
});
