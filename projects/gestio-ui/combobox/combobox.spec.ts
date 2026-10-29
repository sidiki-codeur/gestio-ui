import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { GestioFormField } from '@gestiolabs336/ui/form-field';
import { GestioCombobox, GestioComboboxOption } from './combobox';

interface Client {
  id: number;
  name: string;
  city: string;
  archived?: boolean;
}

const CLIENTS: Client[] = [
  { id: 1, name: 'Atelier Moreau', city: 'Lyon' },
  { id: 2, name: 'Études Durand', city: 'Nantes' },
  { id: 3, name: 'Boulangerie Petit', city: 'Lille', archived: true },
  { id: 4, name: 'Cabinet Étienne', city: 'Paris' },
];

@Component({
  imports: [GestioCombobox, ReactiveFormsModule],
  template: `
    <gestio-combobox
      label="Client"
      placeholder="Rechercher un client"
      clearable
      valueKey="id"
      [options]="clients"
      [displayWith]="name"
      [descriptionWith]="city"
      [disabledWith]="archived"
      [formControl]="client"
    />
  `,
})
class SingleHost {
  readonly clients = CLIENTS;
  readonly client = new FormControl<number | null>(null);
  readonly name = (client: Client) => client.name;
  readonly city = (client: Client) => client.city;
  readonly archived = (client: Client) => client.archived === true;
}

@Component({
  imports: [GestioCombobox, ReactiveFormsModule],
  template: `
    <gestio-combobox
      label="Étiquettes"
      multiple
      [options]="tags"
      [labels]="{ added: '{label} ajoutée' }"
      [formControl]="selected"
    />
  `,
})
class MultipleHost {
  readonly tags = ['Urgent', 'Facturation', 'Litige', 'Relance'];
  readonly selected = new FormControl<string[]>(['Litige'], { nonNullable: true });
}

@Component({
  imports: [GestioCombobox],
  template: `
    <gestio-combobox
      ariaLabel="Rechercher un article"
      [filter]="false"
      [searchDebounce]="0"
      [loading]="loading()"
      [options]="results()"
      (search)="queries.push($event)"
    />
  `,
})
class ServerHost {
  readonly loading = signal(false);
  readonly results = signal<GestioComboboxOption<string>[]>([
    { label: 'Clavier', value: 'KB' },
    { label: 'Souris', value: 'MS', description: 'Sans fil' },
  ]);
  readonly queries: string[] = [];
}

@Component({
  imports: [GestioCombobox, GestioFormField, FormField],
  template: `
    <gestio-form-field label="Pays" hint="Pays de facturation">
      <gestio-combobox valueKey="value" [options]="countries" [formField]="f.country" />
    </gestio-form-field>
  `,
})
class SignalHost {
  readonly countries: GestioComboboxOption<string>[] = [
    { label: 'France', value: 'FR' },
    { label: 'Belgique', value: 'BE' },
  ];
  readonly model = signal({ country: 'BE' as string | null });
  readonly f = form(this.model);
}

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

async function render<T>(component: new () => T) {
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector('input') as HTMLInputElement;
  const settle = async () => {
    await Promise.resolve();
    await fixture.whenStable();
  };
  const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
  const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
  const labels = () =>
    options().map(
      (o) =>
        o.querySelector('.gestio-combobox__option-label')?.textContent?.trim() ??
        o.textContent!.trim(),
    );
  const press = async (key: string, init?: KeyboardEventInit) => {
    const event = keydown(input, key, init);
    await settle();
    return event;
  };
  const type = async (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  return {
    fixture,
    host: fixture.componentInstance,
    el,
    input,
    settle,
    listbox,
    options,
    labels,
    press,
    type,
  };
}

describe('GestioCombobox', () => {
  afterEach(() => document.querySelector('.cdk-overlay-container')?.replaceChildren());

  it('expose le motif ARIA combobox et ouvre la liste à la flèche bas', async () => {
    const { el, input, listbox, options, press } = await render(SingleHost);
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-controls')).toBe(false);
    expect(listbox()).toBeNull();

    await press('ArrowDown');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(listbox()!.getAttribute('aria-labelledby')).toBe(label.id);
    expect(options()).toHaveLength(4);
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
    expect(options()[2].getAttribute('aria-disabled')).toBe('true');
    expect(options()[1].textContent).toContain('Nantes');
  });

  it('filtre sans tenir compte de la casse ni des accents', async () => {
    const { labels, type, input, options } = await render(SingleHost);
    await type('ETU');
    expect(labels()).toEqual(['Études Durand']);
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);

    await type('etienne');
    expect(labels()).toEqual(['Cabinet Étienne']);
  });

  it('choisit l’option active avec Entrée et préserve le type de la valeur', async () => {
    const { host, input, type, press, listbox } = await render(SingleHost);
    await type('dur');
    const event = await press('Enter');
    expect(event.defaultPrevented).toBe(true);
    expect(host.client.value).toBe(2);
    expect(input.value).toBe('Études Durand');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(listbox()).toBeNull();
  });

  it('se déplace avec les flèches, Début et Fin en sautant les options désactivées', async () => {
    const { input, options, press } = await render(SingleHost);
    const active = () =>
      options().findIndex((o) => o.id === input.getAttribute('aria-activedescendant'));
    await press('ArrowDown');
    await press('ArrowDown');
    expect(active()).toBe(1);
    await press('ArrowDown');
    expect(active()).toBe(3); // Boulangerie Petit (archivée) est ignorée
    await press('ArrowDown');
    expect(active()).toBe(3); // pas de bouclage
    expect(await press('Home').then((e) => e.defaultPrevented)).toBe(true);
    expect(active()).toBe(0);
    await press('End');
    expect(active()).toBe(3);
    expect(options()[3].classList).toContain('is-active');
  });

  it('ouvre sur la dernière option avec flèche haut', async () => {
    const { input, options, press } = await render(SingleHost);
    await press('ArrowUp');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[3].id);
  });

  it('affiche la valeur écrite par le formulaire et la sélectionne à l’ouverture', async () => {
    const { fixture, host, input, options, press } = await render(SingleHost);
    host.client.setValue(4);
    await fixture.whenStable();
    expect(input.value).toBe('Cabinet Étienne');

    await press('ArrowDown');
    expect(options()[3].getAttribute('aria-selected')).toBe('true');
    expect(options()[0].getAttribute('aria-selected')).toBe('false');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[3].id);
  });

  it('Échap ferme la liste et restaure le texte, puis efface la valeur (clearable)', async () => {
    const { fixture, host, input, type, press, listbox } = await render(SingleHost);
    host.client.setValue(1);
    await fixture.whenStable();
    await type('zzz');
    const close = await press('Escape');
    expect(close.defaultPrevented).toBe(true);
    expect(listbox()).toBeNull();
    expect(input.value).toBe('Atelier Moreau');
    expect(host.client.value).toBe(1);

    await press('Escape');
    expect(host.client.value).toBeNull();
    expect(input.value).toBe('');
  });

  it('affiche « Aucun résultat » et annonce le nombre de résultats', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const { el, type, options, settle } = await render(SingleHost);
      await type('xyz');
      expect(options()).toHaveLength(1);
      expect(options()[0].textContent).toContain('Aucun résultat');
      expect(options()[0].getAttribute('aria-disabled')).toBe('true');

      vi.advanceTimersByTime(1000);
      await settle();
      expect(el.querySelector('[aria-live]')!.textContent).toContain('Aucun résultat');

      await type('ie');
      vi.advanceTimersByTime(1000);
      await settle();
      expect(el.querySelector('[aria-live]')!.textContent).toContain('3 résultats disponibles');
    } finally {
      vi.useRealTimers();
    }
  });

  it('choisit une option au clic, sans quitter le champ', async () => {
    const { host, input, options, press, settle } = await render(SingleHost);
    await press('ArrowDown');
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    options()[1].dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);

    options()[2].click(); // désactivée
    await settle();
    expect(host.client.value).toBeNull();

    options()[0].click();
    await settle();
    expect(host.client.value).toBe(1);
    expect(document.activeElement).toBe(input);
  });

  it('vide la valeur quand le texte est effacé puis le champ quitté', async () => {
    const { fixture, host, input, type, settle } = await render(SingleHost);
    host.client.setValue(1);
    await fixture.whenStable();
    await type('');
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await settle();
    expect(host.client.value).toBeNull();
    expect(host.client.touched).toBe(true);
  });

  it('bouton d’effacement et bouton d’ouverture', async () => {
    const { fixture, host, el, input, listbox, settle } = await render(SingleHost);
    expect(el.querySelector('.gestio-combobox__clear')).toBeNull();
    host.client.setValue(2);
    await fixture.whenStable();

    const clear = el.querySelector('.gestio-combobox__clear') as HTMLButtonElement;
    expect(clear.getAttribute('aria-label')).toBe('Effacer la sélection');
    clear.click();
    await settle();
    expect(host.client.value).toBeNull();
    expect(input.value).toBe('');

    const toggle = el.querySelector('.gestio-combobox__toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('tabindex')).toBe('-1');
    toggle.click();
    await settle();
    expect(listbox()).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('se désactive avec le FormControl', async () => {
    const { fixture, host, input, el } = await render(SingleHost);
    host.client.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
    expect((el.querySelector('.gestio-combobox__toggle') as HTMLButtonElement).disabled).toBe(true);
  });

  describe('multiple', () => {
    it('ajoute et retire des valeurs, affichées en puces', async () => {
      const { el, host, input, listbox, options, press, type, settle } = await render(MultipleHost);
      const chips = () =>
        Array.from(el.querySelectorAll('.gestio-combobox__chip-label')).map((c) =>
          c.textContent!.trim(),
        );
      expect(chips()).toEqual(['Litige']);

      await press('ArrowDown');
      expect(listbox()!.getAttribute('aria-multiselectable')).toBe('true');
      expect(options()[2].getAttribute('aria-selected')).toBe('true');

      await type('fact');
      await press('Enter');
      expect(host.selected.value).toEqual(['Litige', 'Facturation']);
      expect(chips()).toEqual(['Litige', 'Facturation']);
      // La liste reste ouverte, la recherche est réinitialisée.
      expect(listbox()).not.toBeNull();
      expect(input.value).toBe('');
      expect(el.querySelector('[aria-live]')!.textContent).toBe('Facturation ajoutée');

      // Entrée sur une valeur déjà choisie la retire.
      await press('Home');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Enter');
      expect(host.selected.value).toEqual(['Facturation']);
      await settle();
      expect(el.querySelector('[aria-live]')!.textContent).toBe('Litige retiré');
    });

    it('retire la dernière valeur avec Retour arrière et par le bouton de la puce', async () => {
      const { fixture, el, host, press } = await render(MultipleHost);
      host.selected.setValue(['Urgent', 'Relance']);
      await fixture.whenStable();
      const remove = el.querySelectorAll<HTMLButtonElement>('.gestio-combobox__chip-remove');
      expect(remove[0].getAttribute('aria-label')).toBe('Retirer Urgent');
      expect(el.querySelector('.gestio-combobox__values')!.getAttribute('aria-label')).toBe(
        'Valeurs sélectionnées',
      );

      await press('Backspace');
      expect(host.selected.value).toEqual(['Urgent']);

      remove[0].click();
      await fixture.whenStable();
      expect(host.selected.value).toEqual([]);
    });
  });

  it('recherche serveur : search temporisé, chargement, pas de filtrage local', async () => {
    const { fixture, host, input, labels, options, type, listbox } = await render(ServerHost);
    expect(input.getAttribute('aria-label')).toBe('Rechercher un article');
    await type('zzz');
    expect(labels()).toEqual(['Clavier', 'Souris']);
    expect(options()[1].textContent).toContain('Sans fil');

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(host.queries).toEqual(['zzz']);

    host.loading.set(true);
    await fixture.whenStable();
    expect(listbox()!.getAttribute('aria-busy')).toBe('true');
    expect(options()).toHaveLength(1);
    expect(options()[0].textContent).toContain('Chargement');
    expect(listbox()!.getAttribute('aria-label')).toBe('Rechercher un article');
  });

  it('fonctionne avec [formField] dans un gestio-form-field', async () => {
    const { fixture, el, input, press, type, listbox } = await render(SignalHost);
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.value).toBe('Belgique');
    expect(input.hasAttribute('aria-label')).toBe(false);
    const hintId = input.getAttribute('aria-describedby')!;
    expect(el.querySelector(`#${hintId}`)!.textContent).toContain('Pays de facturation');

    await press('ArrowDown');
    expect(listbox()!.getAttribute('aria-labelledby')).toBe(label.id);
    await type('fra');
    await press('Enter');
    expect(fixture.componentInstance.model().country).toBe('FR');
  });
});
