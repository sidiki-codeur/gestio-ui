import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Component, Injector, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioAppShell } from '@gestiolabs336/ui/layout';
import { GestioToaster } from '@gestiolabs336/ui/toast';
import { filter } from 'rxjs';
import { DesignService } from './core/design.service';
import { NAVIGATION } from './core/navigation';
import { ThemeService } from './core/theme.service';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
    GestioAppShell,
    GestioToaster,
    GestioBadge,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  protected readonly theme = inject(ThemeService);
  protected readonly design = inject(DesignService);
  protected readonly navigation = NAVIGATION;
  /** Tiroir de navigation (petits écrans), géré par gestio-app-shell. */
  protected readonly menuOpen = signal(false);

  constructor() {
    let firstNavigation = true;
    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen.set(false);
        if (firstNavigation) {
          firstNavigation = false;
          return;
        }
        // Après une navigation, le focus est placé sur le titre de la nouvelle page.
        afterNextRender(
          () => {
            const heading = this.document.querySelector<HTMLElement>('main h1');
            heading?.focus({ preventScroll: true });
          },
          { injector: this.injector },
        );
      });
  }
}
