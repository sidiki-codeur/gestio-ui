import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioTextarea } from './textarea';

@Component({
  imports: [GestioTextarea, ReactiveFormsModule],
  template: `<gestio-textarea
    label="Commentaire"
    [rows]="3"
    [maxlength]="20"
    showCount
    [formControl]="comment"
  />`,
})
class Host {
  readonly comment = new FormControl('Bonjour', { nonNullable: true });
}

describe('GestioTextarea', () => {
  it('propage la valeur, met à jour le compteur et gère disabled', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const count = () => fixture.nativeElement.querySelector('.gestio-field__count').textContent;

    expect(textarea.value).toBe('Bonjour');
    expect(textarea.rows).toBe(3);
    expect(textarea.getAttribute('maxlength')).toBe('20');
    expect(count()).toContain('7 / 20');

    textarea.value = 'Bonjour à tous';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(host.comment.value).toBe('Bonjour à tous');
    expect(count()).toContain('14 / 20');

    host.comment.disable();
    await fixture.whenStable();
    expect(textarea.disabled).toBe(true);
  });
});
