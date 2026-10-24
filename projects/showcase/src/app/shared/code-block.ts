import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';

type CopyState = 'idle' | 'copied' | 'error';

/** Extrait de code avec bouton de copie et retour accessible. */
@Component({
  selector: 'sc-code-block',
  template: `
    <div class="sc-code">
      <div class="sc-code__bar">
        <span class="sc-code__lang">{{ language() }}</span>
        <button
          type="button"
          class="sc-code__copy"
          [class.is-copied]="state() === 'copied'"
          [class.is-error]="state() === 'error'"
          (click)="copy()"
        >
          @switch (state()) {
            @case ('copied') {
              Copié
            }
            @case ('error') {
              Échec de la copie
            }
            @default {
              Copier
            }
          }
          <span class="sc-sr-only"> le code {{ language() }}</span>
        </button>
      </div>
      <pre
        class="sc-code__pre"
        tabindex="0"
        [attr.aria-label]="'Code ' + language()"
      ><code>{{ code() }}</code></pre>
      <span class="sc-sr-only" aria-live="polite">{{ announcement() }}</span>
    </div>
  `,
})
export class CodeBlock {
  private readonly document = inject(DOCUMENT);

  readonly code = input.required<string>();
  readonly language = input('html');

  protected readonly state = signal<CopyState>('idle');
  protected readonly announcement = signal('');
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resetTimer));
  }

  protected async copy(): Promise<void> {
    const text = this.code();
    let ok = false;
    try {
      if (this.document.defaultView?.navigator.clipboard) {
        await this.document.defaultView.navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ok = this.legacyCopy(text);
      }
    } catch {
      ok = this.legacyCopy(text);
    }

    this.state.set(ok ? 'copied' : 'error');
    this.announcement.set(ok ? 'Code copié dans le presse-papiers' : 'La copie a échoué');
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.state.set('idle');
      this.announcement.set('');
    }, 2000);
  }

  /** Repli pour les contextes non sécurisés (HTTP hors localhost). */
  private legacyCopy(text: string): boolean {
    const textarea = this.document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    this.document.body.appendChild(textarea);
    textarea.select();
    try {
      return this.document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}
