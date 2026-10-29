import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form } from '@angular/forms/signals';
import { GestioFileRejection, GestioFileUpload } from './file-upload';

function pdf(name: string, size = 1024, type = 'application/pdf'): File {
  return new File([new Uint8Array(size)], name, { type, lastModified: 1 });
}

/** Remplace les espaces insécables produits par Intl. */
function plain(text: string | null | undefined): string {
  return (text ?? '').replace(/[  ]/g, ' ');
}

/** Simule une sélection dans le sélecteur natif. */
function choose(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change'));
}

function drop(zone: HTMLElement, files: File[]): Event {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files, types: ['Files'] } });
  zone.dispatchEvent(event);
  return event;
}

@Component({
  imports: [GestioFileUpload],
  template: `
    <gestio-file-upload
      label="Factures"
      hint="Factures fournisseurs du mois"
      accept=".pdf,application/pdf"
      multiple
      [maxSize]="2048"
      [maxFiles]="2"
      [progress]="progress()"
      [disabled]="disabled()"
      [(files)]="files"
      (rejected)="rejections.set($event)"
    />
  `,
})
class Host {
  readonly files = signal<File[]>([]);
  readonly progress = signal<Record<string, number>>({});
  readonly disabled = signal(false);
  readonly rejections = signal<GestioFileRejection[]>([]);
}

@Component({
  imports: [GestioFileUpload, ReactiveFormsModule],
  template: `<gestio-file-upload ariaLabel="Justificatif" [formControl]="control" />`,
})
class ReactiveHost {
  readonly control = new FormControl<File[]>([], { nonNullable: true });
}

@Component({
  imports: [GestioFileUpload, FormField],
  template: `<gestio-file-upload
    ariaLabel="Pièces jointes"
    multiple
    [formField]="f.attachments"
  />`,
})
class SignalHost {
  readonly model = signal<{ attachments: File[]; locked: boolean }>({
    attachments: [],
    locked: false,
  });
  readonly f = form(this.model, (path) => {
    disabled(path.attachments, ({ valueOf }) => valueOf(path.locked));
  });
}

describe('GestioFileUpload', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input[type="file"]') as HTMLInputElement;
    const zone = el.querySelector('.gestio-file-upload__zone') as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, input, zone };
  }

  it('champ natif nommé par le libellé et « Parcourir », décrit par les contraintes et l’aide', async () => {
    const { el, input } = await setup();
    expect(input.multiple).toBe(true);
    expect(input.getAttribute('accept')).toBe('.pdf,application/pdf');

    const names = input.getAttribute('aria-labelledby')!.split(' ');
    expect(names.map((id) => el.querySelector(`#${id}`)!.textContent!.trim())).toEqual([
      'Factures',
      'Parcourir',
    ]);
    const browse = el.querySelector('label')!;
    expect(browse.htmlFor).toBe(input.id);

    const described = input
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => plain(el.querySelector(`#${id}`)!.textContent).trim());
    expect(described).toEqual([
      'Taille maximale : 2 ko · 2 fichiers maximum',
      'Factures fournisseurs du mois',
    ]);
  });

  it('ajoute des fichiers par le sélecteur, affiche nom et taille formatée et annonce l’ajout', async () => {
    const { fixture, host, el, input } = await setup();
    choose(input, [pdf('facture-0425.pdf', 1536)]);
    await fixture.whenStable();

    expect(host.files().map((file) => file.name)).toEqual(['facture-0425.pdf']);
    expect(input.value).toBe('');
    const item = el.querySelector('li')!;
    expect(item.textContent).toContain('facture-0425.pdf');
    expect(plain(item.textContent)).toContain('1,5 ko');
    expect(el.querySelector('ul')!.getAttribute('aria-label')).toBe('Fichiers sélectionnés');
    expect(el.querySelector('.gestio-sr-only[aria-live]')!.textContent).toBe(
      '« facture-0425.pdf » ajouté',
    );
  });

  it('valide type, taille, doublon et nombre : messages en zone live et sortie rejected', async () => {
    const { fixture, host, el, zone } = await setup();
    const first = pdf('a.pdf');
    drop(zone, [first, pdf('photo.png', 100, 'image/png'), pdf('gros.pdf', 4096)]);
    await fixture.whenStable();
    expect(host.files()).toEqual([first]);
    expect(host.rejections().map((r) => r.reason)).toEqual(['type', 'size']);

    drop(zone, [first, pdf('b.pdf'), pdf('c.pdf')]);
    await fixture.whenStable();
    expect(host.files().map((file) => file.name)).toEqual(['a.pdf', 'b.pdf']);
    expect(host.rejections().map((r) => r.reason)).toEqual(['duplicate', 'count']);

    const region = el.querySelector('.gestio-file-upload__rejections')!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toContain('« a.pdf » : fichier déjà ajouté.');
    expect(region.textContent).toContain('« c.pdf » : 2 fichiers maximum.');
  });

  it('message de taille formaté avec la taille et le maximum', async () => {
    const { fixture, host, zone } = await setup();
    drop(zone, [pdf('gros.pdf', 3 * 1024 * 1024)]);
    await fixture.whenStable();
    expect(plain(host.rejections()[0].message)).toBe(
      '« gros.pdf » : fichier trop volumineux (3 Mo, maximum 2 ko).',
    );
  });

  it('retire un fichier avec un bouton nommé et déplace le focus', async () => {
    const { fixture, host, el, input } = await setup();
    host.files.set([pdf('a.pdf'), pdf('b.pdf')]);
    await fixture.whenStable();

    const buttons = () => [...el.querySelectorAll<HTMLButtonElement>('li button')];
    expect(buttons()[0].getAttribute('aria-label')).toBe('Retirer a.pdf');
    buttons()[0].focus();
    buttons()[0].click();
    await fixture.whenStable();

    expect(host.files().map((file) => file.name)).toEqual(['b.pdf']);
    expect(document.activeElement).toBe(buttons()[0]);

    buttons()[0].click();
    await fixture.whenStable();
    expect(host.files()).toEqual([]);
    expect(el.querySelector('ul')).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('affiche une barre de progression accessible par fichier', async () => {
    const { fixture, host, el } = await setup();
    host.files.set([pdf('a.pdf'), pdf('b.pdf')]);
    host.progress.set({ 'a.pdf': 45 });
    await fixture.whenStable();

    const bars = el.querySelectorAll('[role="progressbar"]');
    expect(bars).toHaveLength(1);
    expect(bars[0].getAttribute('aria-valuenow')).toBe('45');
    expect(plain(bars[0].getAttribute('aria-valuetext'))).toBe('45 %');
    expect(bars[0].getAttribute('aria-label')).toBe('Envoi de a.pdf');
  });

  it('désactivé : champ natif désactivé, dépôt ignoré, boutons de retrait désactivés', async () => {
    const { fixture, host, el, input, zone } = await setup();
    host.files.set([pdf('a.pdf')]);
    host.disabled.set(true);
    await fixture.whenStable();

    expect(input.disabled).toBe(true);
    expect(zone.classList).toContain('is-disabled');
    drop(zone, [pdf('b.pdf')]);
    await fixture.whenStable();
    expect(host.files()).toHaveLength(1);
    expect(el.querySelector<HTMLButtonElement>('li button')!.disabled).toBe(true);
  });

  it('un seul fichier sans multiple : le nouveau remplace l’ancien', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Justificatif');
    expect(el.textContent).toContain('Glissez-déposez un fichier ici ou');

    choose(input, [pdf('a.pdf')]);
    choose(input, [pdf('b.pdf'), pdf('c.pdf')]);
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value.map((file) => file.name)).toEqual(['b.pdf']);
    expect(el.textContent).toContain('« c.pdf » : un seul fichier est accepté.');
  });

  it('Reactive Forms : écrit la valeur, marque touché et applique l’état désactivé', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();
    const { control } = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    control.setValue([pdf('contrat.pdf')]);
    await fixture.whenStable();
    expect(el.querySelector('li')!.textContent).toContain('contrat.pdf');

    choose(el.querySelector('input') as HTMLInputElement, [pdf('avenant.pdf')]);
    expect(control.value[0]).toBeInstanceOf(File);
    expect(control.touched).toBe(true);

    control.disable();
    await fixture.whenStable();
    expect((el.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('Signal Forms : lit et écrit File[] et suit l’état désactivé', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;

    choose(input, [pdf('a.pdf'), pdf('b.pdf')]);
    await fixture.whenStable();
    expect(fixture.componentInstance.model().attachments.map((file) => file.name)).toEqual([
      'a.pdf',
      'b.pdf',
    ]);

    fixture.componentInstance.model.update((value) => ({ ...value, locked: true }));
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });
});
