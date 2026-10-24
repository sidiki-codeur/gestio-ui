import { Component, booleanAttribute, input } from '@angular/core';
import { CodeBlock } from './code-block';

/** Bloc d'exemple : titre, aperçu interactif et code correspondant. */
@Component({
  selector: 'sc-example',
  imports: [CodeBlock],
  template: `
    <section class="sc-example" [attr.aria-labelledby]="headingId">
      <div class="sc-example__head">
        <h2 class="sc-example__title" [id]="headingId">{{ heading() }}</h2>
        @if (description()) {
          <p class="sc-example__description">{{ description() }}</p>
        }
      </div>
      <div class="sc-example__preview" [class.is-stacked]="stacked()">
        <ng-content />
      </div>
      @if (code()) {
        <sc-code-block [code]="code()!" [language]="language()" />
      }
    </section>
  `,
})
export class Example {
  private static nextId = 0;

  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly code = input<string>();
  readonly language = input('html');
  /** Empile le contenu verticalement au lieu d'une rangée. */
  readonly stacked = input(false, { transform: booleanAttribute });

  protected readonly headingId = `sc-example-${Example.nextId++}`;
}
