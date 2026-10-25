import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioSwitch } from './switch';

@Component({
  imports: [GestioSwitch, ReactiveFormsModule],
  template: `
    <gestio-switch
      label="Relances automatiques"
      description="Un e-mail 3 jours avant l’échéance"
      [formControl]="reminders"
    />
    <gestio-switch ariaLabel="Mode sombre" labelPosition="start" [(checked)]="dark" />
  `,
})
class Host {
  readonly reminders = new FormControl(false, { nonNullable: true });
  readonly dark = signal(true);
}

describe('GestioSwitch', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const inputs = Array.from(el.querySelectorAll('input')) as HTMLInputElement[];
    return { fixture, host: fixture.componentInstance, el, inputs };
  }

  it('utilise un input natif avec role="switch"', async () => {
    const { el, inputs } = await setup();
    expect(inputs[0].type).toBe('checkbox');
    expect(inputs[0].getAttribute('role')).toBe('switch');
    expect(
      el.querySelector(`#${inputs[0].getAttribute('aria-describedby')}`)?.textContent,
    ).toContain('3 jours');
    expect(inputs[1].getAttribute('aria-label')).toBe('Mode sombre');
  });

  it('propage la valeur dans les deux sens', async () => {
    const { fixture, host, el, inputs } = await setup();
    (el.querySelector('label') as HTMLLabelElement).click();
    expect(host.reminders.value).toBe(true);

    host.reminders.setValue(false);
    await fixture.whenStable();
    expect(inputs[0].checked).toBe(false);

    expect(inputs[1].checked).toBe(true);
    inputs[1].click();
    expect(host.dark()).toBe(false);
  });

  it('applique setDisabledState', async () => {
    const { fixture, host, inputs } = await setup();
    host.reminders.disable();
    await fixture.whenStable();
    expect(inputs[0].disabled).toBe(true);
  });
});
