import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { GestioOtpInput } from './otp-input';

@Component({
  imports: [GestioOtpInput],
  template: `
    <gestio-otp-input
      [length]="length()"
      [error]="error()"
      [disabled]="disabled()"
      [(value)]="code"
      (completed)="completed.push($event)"
    />
  `,
})
class Host {
  readonly length = signal(6);
  readonly code = signal('');
  readonly error = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly completed: string[] = [];
}

@Component({
  imports: [GestioOtpInput, FormField, ReactiveFormsModule],
  template: `
    <gestio-otp-input class="signal" [length]="4" [formField]="f.code" />
    <gestio-otp-input class="reactive" [length]="4" [formControl]="control" />
  `,
})
class FormsHost {
  readonly model = signal({ code: '12' });
  readonly f = form(this.model, (path) => {
    required(path.code);
    minLength(path.code, 4);
  });
  readonly control = new FormControl('98');
}

describe('GestioOtpInput', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cells = () => Array.from(el.querySelectorAll<HTMLInputElement>('.gestio-otp__cell'));
    const type = async (index: number, value: string) => {
      const cell = cells()[index];
      cell.focus();
      cell.value = value;
      cell.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const key = async (index: number, key: string) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      cells()[index].dispatchEvent(event);
      await fixture.whenStable();
      return event;
    };
    return { fixture, host: fixture.componentInstance, el, cells, type, key };
  }

  it('rend un groupe étiqueté avec une case nommée par chiffre', async () => {
    const { el, cells } = await setup();
    const group = el.querySelector('[role="group"]')!;
    const label = el.querySelector(`#${group.getAttribute('aria-labelledby')}`)!;
    expect(label.textContent).toContain('Code de vérification');
    expect(cells().length).toBe(6);
    expect(cells()[1].getAttribute('aria-label')).toBe('Chiffre 2 sur 6');
    expect(cells()[0].getAttribute('autocomplete')).toBe('one-time-code');
    expect(cells()[1].getAttribute('autocomplete')).toBe('off');
    expect(cells()[0].getAttribute('inputmode')).toBe('numeric');
  });

  it('avance à la case suivante et met à jour la valeur', async () => {
    const { host, cells, type } = await setup();
    await type(0, '4');
    expect(host.code()).toBe('4');
    expect(document.activeElement).toBe(cells()[1]);
    await type(1, 'x');
    expect(host.code()).toBe('4');
    expect(cells()[1].value).toBe('');
  });

  it('Retour arrière efface puis recule ; flèches, Début et Fin déplacent le focus', async () => {
    const { host, cells, type, key } = await setup();
    await type(0, '1');
    await type(1, '2');
    expect(document.activeElement).toBe(cells()[2]);

    await key(2, 'Backspace');
    expect(host.code()).toBe('1');
    expect(document.activeElement).toBe(cells()[1]);

    await key(1, 'ArrowLeft');
    expect(document.activeElement).toBe(cells()[0]);
    await key(0, 'End');
    expect(document.activeElement).toBe(cells()[5]);
    await key(5, 'Home');
    expect(document.activeElement).toBe(cells()[0]);
    await key(0, 'ArrowRight');
    expect(document.activeElement).toBe(cells()[1]);
  });

  it('bloque les caractères non numériques', async () => {
    const { key } = await setup();
    expect((await key(0, 'a')).defaultPrevented).toBe(true);
    expect((await key(0, '7')).defaultPrevented).toBe(false);
  });

  it('colle un code complet et émet completed', async () => {
    const { fixture, host, cells } = await setup();
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: () => '482 913' },
    });
    cells()[2].dispatchEvent(paste);
    await fixture.whenStable();

    expect(host.code()).toBe('482913');
    expect(cells().map((c) => c.value)).toEqual(['4', '8', '2', '9', '1', '3']);
    expect(host.completed).toEqual(['482913']);
    expect(document.activeElement).toBe(cells()[5]);
  });

  it('répartit un remplissage automatique saisi dans la première case', async () => {
    const { host, type } = await setup();
    await type(0, '135790');
    expect(host.code()).toBe('135790');
    expect(host.completed).toEqual(['135790']);
  });

  it('affiche la valeur du modèle et l’état d’erreur', async () => {
    const { fixture, host, el, cells } = await setup();
    host.code.set('12');
    host.error.set('Code incorrect.');
    await fixture.whenStable();
    expect(cells().map((c) => c.value)).toEqual(['1', '2', '', '', '', '']);
    expect(cells()[0].getAttribute('aria-invalid')).toBe('true');
    const group = el.querySelector('[role="group"]')!;
    const error = el.querySelector(`#${group.getAttribute('aria-describedby')}`)!;
    expect(error.textContent).toContain('Code incorrect.');
  });

  it('désactive toutes les cases', async () => {
    const { fixture, host, cells } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    expect(cells().every((c) => c.disabled)).toBe(true);
  });

  it('fonctionne avec [formField] et formControl', async () => {
    const fixture = TestBed.createComponent(FormsHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const values = (selector: string) =>
      Array.from(el.querySelectorAll<HTMLInputElement>(`${selector} .gestio-otp__cell`)).map(
        (c) => c.value,
      );
    expect(values('.signal')).toEqual(['1', '2', '', '']);
    expect(values('.reactive')).toEqual(['9', '8', '', '']);

    const signalCell = el.querySelectorAll<HTMLInputElement>('.signal .gestio-otp__cell')[2];
    signalCell.value = '3';
    signalCell.dispatchEvent(new Event('input'));
    const reactiveCell = el.querySelectorAll<HTMLInputElement>('.reactive .gestio-otp__cell')[2];
    reactiveCell.value = '7';
    reactiveCell.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.model().code).toBe('123');
    expect(fixture.componentInstance.control.value).toBe('987');
  });
});
