import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GESTIO_FORM_FIELD_IMPORTS } from './form-field';

@Component({
  imports: [GESTIO_FORM_FIELD_IMPORTS],
  template: `
    <gestio-form-field label="Échéance" hint="jj/mm/aaaa" [error]="error()" required>
      <input gestioFieldControl type="date" class="due" />
    </gestio-form-field>
    <gestio-form-field label="Pays">
      <select gestioFieldControl id="pays">
        <option>France</option>
      </select>
    </gestio-form-field>
    <gestio-form-field label="Couleur">
      <div gestioFieldControl role="radiogroup" class="custom"></div>
    </gestio-form-field>
  `,
})
class Host {
  readonly error = signal<string | null>(null);
}

describe('GestioFormField', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('relie le libellé et l’aide au contrôle natif', async () => {
    const { el } = await setup();
    const input = el.querySelector('input.due') as HTMLInputElement;
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(input.id).toBeTruthy();
    expect(label.htmlFor).toBe(input.id);
    expect(label.textContent).toContain('*');
    const hint = el.querySelector(`#${input.getAttribute('aria-describedby')}`);
    expect(hint?.textContent).toContain('jj/mm/aaaa');
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('ajoute l’erreur à la description et pose aria-invalid', async () => {
    const { fixture, host, el } = await setup();
    host.error.set('Date obligatoire');
    await fixture.whenStable();
    const input = el.querySelector('input.due') as HTMLInputElement;
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(el.querySelector(`#${ids[1]}`)?.textContent).toContain('Date obligatoire');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('conserve un id existant', async () => {
    const { el } = await setup();
    const labels = el.querySelectorAll('label');
    expect(el.querySelector('select')!.id).toBe('pays');
    expect(labels[1].htmlFor).toBe('pays');
  });

  it('utilise aria-labelledby pour un élément non étiquetable', async () => {
    const { el } = await setup();
    const custom = el.querySelector('.custom') as HTMLElement;
    const labels = el.querySelectorAll('label');
    expect(labels[2].hasAttribute('for')).toBe(false);
    expect(custom.getAttribute('aria-labelledby')).toBe(labels[2].id);
  });
});
