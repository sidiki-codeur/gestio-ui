import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GestioButton } from '@gestiolabs336/ui/button';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-not-found-page',
  imports: [RouterLink, GestioButton, PageHeader],
  template: `
    <div class="sc-not-found">
      <sc-page-header heading="Page introuvable" eyebrow="Erreur 404">
        L’adresse demandée n’existe pas ou a été déplacée.
      </sc-page-header>
      <a gestioButton routerLink="/">Retour à l’introduction</a>
    </div>
  `,
})
export class NotFoundPage {}
