import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GestioKanban,
  GestioKanbanCard,
  GestioKanbanColumn,
  GestioKanbanMoveEvent,
} from './kanban';

interface Ticket {
  id: number;
  title: string;
}

@Component({
  imports: [GestioKanban, GestioKanbanCard],
  template: `
    <gestio-kanban [(columns)]="columns" [enforceWip]="enforce()" (moved)="events.push($event)">
      <ng-template gestioKanbanCard [gestioKanbanCardOf]="columns()" let-ticket let-index="index">
        <span class="ticket">#{{ ticket.id }} {{ ticket.title }} ({{ index }})</span>
      </ng-template>
    </gestio-kanban>
  `,
})
class Host {
  readonly kanban = viewChild.required(GestioKanban);
  readonly enforce = signal(false);
  readonly events: GestioKanbanMoveEvent<Ticket>[] = [];
  readonly columns = signal<readonly GestioKanbanColumn<Ticket>[]>([
    {
      id: 'todo',
      title: 'À faire',
      items: [
        { id: 1, title: 'Relancer le client' },
        { id: 2, title: 'Mettre à jour le devis' },
      ],
    },
    {
      id: 'doing',
      title: 'En cours',
      items: [{ id: 3, title: 'Corriger la facture' }],
      wipLimit: 1,
    },
    { id: 'done', title: 'Terminé', items: [] },
  ]);
}

describe('GestioKanban', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('gestio-kanban') as HTMLElement;
    const cards = () => [...el.querySelectorAll<HTMLElement>('.gestio-kanban__card')];
    const titles = (c: number) =>
      [...el.querySelectorAll('.gestio-kanban__column')[c].querySelectorAll('.ticket')].map((t) =>
        t.textContent!.trim(),
      );
    const status = () => el.querySelector('[role="status"]')!.textContent!.trim();
    const key = (target: Element, k: string, shiftKey = false) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true }));
    return { fixture, host: fixture.componentInstance, el, cards, titles, status, key };
  }

  it('rend les colonnes nommées, les compteurs et le gabarit de carte', async () => {
    const { el, titles } = await setup();
    const columns = el.querySelectorAll('.gestio-kanban__column');
    expect(columns).toHaveLength(3);
    const heading = columns[0].querySelector('[role="heading"]')!;
    expect(heading.getAttribute('aria-level')).toBe('3');
    expect(columns[0].getAttribute('aria-labelledby')).toBe(heading.id);
    expect(columns[0].querySelector('ul')!.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(titles(0)).toEqual(['#1 Relancer le client (0)', '#2 Mettre à jour le devis (1)']);
    expect(columns[1].querySelector('.gestio-kanban__count')!.textContent).toContain(
      '1 cartes sur une limite de 1',
    );
    expect(columns[2].querySelector('.gestio-kanban__empty')!.textContent!.trim()).toBe(
      'Aucune carte',
    );
  });

  it('utilise une tabulation itinérante et des descriptions clavier', async () => {
    const { el, cards } = await setup();
    expect(cards().map((c) => c.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    const description = el.querySelector(`#${cards()[0].getAttribute('aria-describedby')}`)!;
    expect(description.textContent).toContain('Maj + flèches');
    expect(cards()[0].querySelector('.gestio-kanban__move')!.getAttribute('aria-label')).toBe(
      'Déplacer « Relancer le client »',
    );
  });

  it('parcourt les cartes avec les flèches', async () => {
    const { fixture, cards, key } = await setup();
    cards()[0].focus();
    key(cards()[0], 'ArrowDown');
    await fixture.whenStable();
    expect(document.activeElement).toBe(cards()[1]);
    key(cards()[1], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(cards()[2]);
    expect(cards()[2].getAttribute('tabindex')).toBe('0');
  });

  it('déplace une carte au clavier, émet moved et annonce le résultat', async () => {
    const { fixture, host, cards, titles, status, key } = await setup();
    cards()[0].focus();
    key(cards()[0], 'ArrowDown', true);
    await fixture.whenStable();
    expect(titles(0)).toEqual(['#2 Mettre à jour le devis (0)', '#1 Relancer le client (1)']);
    expect(host.events.at(-1)).toEqual({
      item: { id: 1, title: 'Relancer le client' },
      from: 'todo',
      to: 'todo',
      previousIndex: 0,
      currentIndex: 1,
    });
    expect(document.activeElement).toBe(cards()[1]);

    key(cards()[1], 'ArrowRight', true);
    await fixture.whenStable();
    expect(titles(1)).toEqual(['#3 Corriger la facture (0)', '#1 Relancer le client (1)']);
    expect(host.columns()[1].items).toHaveLength(2);
    expect(status()).toBe('Carte « Relancer le client » déplacée vers En cours, position 2 sur 2.');
    expect(document.activeElement?.textContent).toContain('Relancer le client');
  });

  it('signale le dépassement de la limite WIP', async () => {
    const { fixture, el, cards, key } = await setup();
    cards()[0].focus();
    key(cards()[0], 'ArrowRight', true);
    await fixture.whenStable();
    const column = el.querySelectorAll('.gestio-kanban__column')[1];
    expect(column.classList).toContain('gestio-kanban__column--over');
    expect(column.querySelector('.gestio-kanban__over')!.textContent).toContain('Limite dépassée');
  });

  it('refuse l’entrée dans une colonne pleine avec enforceWip', async () => {
    const { fixture, host, cards, titles, status, key } = await setup();
    host.enforce.set(true);
    await fixture.whenStable();
    cards()[0].focus();
    key(cards()[0], 'ArrowRight', true);
    await fixture.whenStable();
    expect(titles(1)).toEqual(['#3 Corriger la facture (0)']);
    expect(host.events).toHaveLength(0);
    expect(status()).toContain('En cours a atteint sa limite de 1 cartes');
  });

  it('ignore les touches venant du contenu de la carte', async () => {
    const { fixture, host, cards, key } = await setup();
    key(cards()[0].querySelector('.ticket')!, 'ArrowDown', true);
    await fixture.whenStable();
    expect(host.events).toHaveLength(0);
  });

  it('propose les déplacements dans un menu', async () => {
    const { fixture, host, el, cards, titles } = await setup();
    cards()[1].querySelector<HTMLButtonElement>('.gestio-kanban__move')!.click();
    await fixture.whenStable();
    const items = [...document.querySelectorAll<HTMLButtonElement>('[gestiomenuitem]')];
    expect(
      items.map((b) => b.querySelector('.gestio-menu-item__label')!.textContent!.trim()),
    ).toEqual(['Monter', 'Descendre', 'Vers « En cours »', 'Vers « Terminé »']);
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    items[3].click();
    await fixture.whenStable();
    expect(titles(2)).toEqual(['#2 Mettre à jour le devis (0)']);
    expect(host.events.at(-1)?.to).toBe('done');
    expect(el.querySelector('[role="status"]')!.textContent).toContain(
      'vers Terminé, position 1 sur 1',
    );
  });

  it('applique un dépôt du glisser-déposer', async () => {
    const { fixture, host, titles } = await setup();
    const kanban = host.kanban() as unknown as {
      onDrop(event: Partial<CdkDragDrop<number>>): void;
    };
    kanban.onDrop({
      previousContainer: { data: 0 } as CdkDragDrop<number>['previousContainer'],
      container: { data: 2 } as CdkDragDrop<number>['container'],
      previousIndex: 0,
      currentIndex: 0,
    });
    await fixture.whenStable();
    expect(titles(2)).toEqual(['#1 Relancer le client (0)']);
    expect(host.events.at(-1)).toMatchObject({ from: 'todo', to: 'done', currentIndex: 0 });
  });
});
