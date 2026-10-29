import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form } from '@angular/forms/signals';
import { GestioSlider, GestioSliderValue } from './slider';

@Component({
  imports: [GestioSlider, ReactiveFormsModule],
  template: `
    <gestio-slider
      id="single"
      label="Remise"
      hint="Plafonnée à 50 %"
      [min]="0"
      [max]="50"
      [step]="5"
      [formatOptions]="{ style: 'unit', unit: 'percent' }"
      showTicks
      [formControl]="discount"
    />
    <gestio-slider
      id="range"
      label="Budget"
      range
      [min]="0"
      [max]="1000"
      [step]="10"
      [formatOptions]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
      [formControl]="budget"
    />
  `,
})
class Host {
  readonly discount = new FormControl<number>(10, { nonNullable: true });
  readonly budget = new FormControl<GestioSliderValue>([200, 600], { nonNullable: true });
}

@Component({
  imports: [GestioSlider, FormsModule],
  template: `<gestio-slider ariaLabel="Volume" [(ngModel)]="volume" [disabled]="locked()" />`,
})
class NgModelHost {
  readonly volume = signal(40);
  readonly locked = signal(false);
}

@Component({
  imports: [GestioSlider, FormField],
  template: `<gestio-slider
    label="Seuil d’alerte"
    [min]="0"
    [max]="200"
    [formField]="f.threshold"
  />`,
})
class SignalFormHost {
  readonly model = signal({ threshold: 120, locked: false });
  readonly f = form(this.model, (path) => {
    disabled(path.threshold, ({ valueOf }) => valueOf(path.locked));
  });
}

function setValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function key(input: HTMLInputElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  return event;
}

function pointer(target: HTMLElement, type: string, clientX: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
}

/** Piste simulée de 200 px de large à partir de x = 100. */
function mockTrack(slider: Element): void {
  const track = slider.querySelector('.gestio-slider__track') as HTMLElement;
  track.getBoundingClientRect = () =>
    ({ left: 100, right: 300, width: 200, top: 0, bottom: 6, height: 6 }) as DOMRect;
}

describe('GestioSlider', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const single = el.querySelector('#single') as HTMLElement;
    const range = el.querySelector('#range') as HTMLElement;
    const singleInput = single.querySelector('input') as HTMLInputElement;
    const rangeInputs = Array.from(range.querySelectorAll('input')) as HTMLInputElement[];
    return { fixture, host: fixture.componentInstance, single, range, singleInput, rangeInputs };
  }

  it('rend un input range natif associé au libellé, à l’aide et à la valeur formatée', async () => {
    const { single, singleInput } = await setup();
    expect(singleInput.type).toBe('range');
    expect(singleInput.min).toBe('0');
    expect(singleInput.max).toBe('50');
    expect(singleInput.step).toBe('5');
    expect(singleInput.value).toBe('10');
    const label = single.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(singleInput.id);
    expect(singleInput.hasAttribute('aria-label')).toBe(false);
    const hintId = singleInput.getAttribute('aria-describedby')!;
    expect(single.querySelector(`#${hintId}`)!.textContent).toContain('50 %');
    expect(singleInput.getAttribute('aria-valuetext')).toMatch(/^10\s%$/);
    expect(single.querySelector('.gestio-slider__value')!.textContent).toMatch(/10\s%/);
  });

  it('graduations : une par pas, actives jusqu’à la valeur', async () => {
    const { single } = await setup();
    expect(single.querySelectorAll('.gestio-slider__tick').length).toBe(11);
    expect(single.querySelectorAll('.gestio-slider__tick.is-active').length).toBe(3);
    expect(single.querySelector('.gestio-slider__scale')!.textContent).toMatch(/0\s%.*50\s%/);
  });

  it('propage la saisie au contrôle et aligne sur le pas', async () => {
    const { fixture, host, singleInput } = await setup();
    setValue(singleInput, '35');
    expect(host.discount.value).toBe(35);

    host.discount.setValue(45);
    await fixture.whenStable();
    expect(singleInput.value).toBe('45');
    expect(singleInput.getAttribute('aria-valuetext')).toMatch(/^45\s%$/);
  });

  it('Page suivante/précédente : un dixième de l’étendue', async () => {
    const { fixture, host, singleInput } = await setup();
    const event = key(singleInput, 'PageUp');
    expect(event.defaultPrevented).toBe(true);
    expect(host.discount.value).toBe(15);
    key(singleInput, 'PageDown');
    key(singleInput, 'PageDown');
    key(singleInput, 'PageDown');
    expect(host.discount.value).toBe(0);
    await fixture.whenStable();
    expect(singleInput.value).toBe('0');
  });

  it('mode plage : deux poignées nommées dans un groupe, valeur [début, fin]', async () => {
    const { range, rangeInputs } = await setup();
    const group = range.querySelector('[role="group"]')!;
    const labelId = group.getAttribute('aria-labelledby')!;
    expect(range.querySelector(`#${labelId}`)!.textContent).toBe('Budget');
    expect(rangeInputs.length).toBe(2);
    expect(rangeInputs[0].getAttribute('aria-label')).toBe('Budget minimum');
    expect(rangeInputs[1].getAttribute('aria-label')).toBe('Budget maximum');
    expect(rangeInputs.map((i) => i.value)).toEqual(['200', '600']);
    expect(rangeInputs[0].getAttribute('aria-valuetext')).toMatch(/^200\s€$/);
    expect(range.querySelector('.gestio-slider__value')!.textContent).toMatch(/200\s€ – 600\s€/);
    const fill = range.querySelector('.gestio-slider__fill') as HTMLElement;
    expect(fill.style.insetInlineStart).toBe('20%');
    expect(fill.style.inlineSize).toBe('40%');
  });

  it('mode plage : les poignées ne se croisent pas', async () => {
    const { fixture, host, rangeInputs } = await setup();
    setValue(rangeInputs[0], '900');
    expect(host.budget.value).toEqual([600, 600]);
    await fixture.whenStable();
    expect(rangeInputs[0].value).toBe('600');

    setValue(rangeInputs[1], '100');
    expect(host.budget.value).toEqual([600, 600]);
    expect(rangeInputs[1].value).toBe('600');

    setValue(rangeInputs[1], '800');
    expect(host.budget.value).toEqual([600, 800]);
  });

  it('pointeur : clic sur la piste puis glisser déplacent la poignée la plus proche', async () => {
    const { fixture, host, range, rangeInputs } = await setup();
    mockTrack(range);
    const control = range.querySelector('.gestio-slider__control') as HTMLElement;

    // x = 280 ⇒ 90 % ⇒ 900 : poignée haute (la plus proche).
    pointer(control, 'pointerdown', 280);
    expect(host.budget.value).toEqual([200, 900]);
    expect(document.activeElement).toBe(rangeInputs[1]);

    pointer(control, 'pointermove', 240);
    expect(host.budget.value).toEqual([200, 700]);
    pointer(control, 'pointerup', 240);
    expect(host.budget.touched).toBe(true);

    // x = 110 ⇒ 50 : poignée basse.
    pointer(control, 'pointerdown', 110);
    expect(host.budget.value).toEqual([50, 700]);
    pointer(control, 'pointerup', 110);
    await fixture.whenStable();
    expect(rangeInputs[0].value).toBe('50');
  });

  it('marque le contrôle comme touché au blur et applique setDisabledState', async () => {
    const { fixture, host, singleInput } = await setup();
    singleInput.dispatchEvent(new Event('blur'));
    expect(host.discount.touched).toBe(true);
    host.discount.disable();
    await fixture.whenStable();
    expect(singleInput.disabled).toBe(true);

    const control = singleInput.parentElement as HTMLElement;
    mockTrack(control.parentElement!);
    pointer(control, 'pointerdown', 200);
    expect(host.discount.value).toBe(10);
  });

  it('ngModel : nom accessible via ariaLabel, liaison bidirectionnelle et disabled', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Volume');
    expect(input.value).toBe('40');
    setValue(input, '73');
    expect(fixture.componentInstance.volume()).toBe(73);
    fixture.componentInstance.locked.set(true);
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });

  it('Signal Forms : lit, écrit et applique l’état désactivé', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('120');
    expect(input.max).toBe('200');
    setValue(input, '150');
    expect(fixture.componentInstance.model().threshold).toBe(150);
    fixture.componentInstance.model.update((v) => ({ ...v, locked: true }));
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });
});
