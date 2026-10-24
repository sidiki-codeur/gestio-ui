import { Component, input } from '@angular/core';

/** En-tête de page : surtitre, titre principal et introduction. */
@Component({
  selector: 'sc-page-header',
  template: `
    <header class="sc-page-header">
      @if (eyebrow()) {
        <p class="sc-page-header__eyebrow">{{ eyebrow() }}</p>
      }
      <h1 class="sc-page-header__title" tabindex="-1">{{ heading() }}</h1>
      <p class="sc-page-header__lead"><ng-content /></p>
    </header>
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly eyebrow = input<string>();
}
