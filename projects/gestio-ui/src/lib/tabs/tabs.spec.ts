import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioTab } from './tab';
import { GestioTabs } from './tabs';

@Component({
  imports: [GestioTabs, GestioTab],
  template: `
    <gestio-tabs ariaLabel="Fiche client" [(selectedIndex)]="selected">
      <gestio-tab label="Informations"><button class="inner">Modifier</button></gestio-tab>
      <gestio-tab label="Factures">Liste des factures</gestio-tab>
      <gestio-tab label="Archives" disabled>Archives</gestio-tab>
      <gestio-tab label="Notes">Notes internes</gestio-tab>
    </gestio-tabs>
  `,
})
class Host {
  readonly selected = signal(0);
}

describe('GestioTabs', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = Array.from(element.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
    const panels = Array.from(element.querySelectorAll('[role="tabpanel"]')) as HTMLElement[];
    const list = element.querySelector('[role="tablist"]') as HTMLElement;
    const press = async (key: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, tabs, panels, list, press };
  }

  it('relie onglets et panneaux avec les rôles ARIA', async () => {
    const { tabs, panels, list } = await setup();
    expect(list.getAttribute('aria-label')).toBe('Fiche client');
    expect(tabs).toHaveLength(4);
    tabs.forEach((tab, index) => {
      expect(tab.getAttribute('aria-controls')).toBe(panels[index].id);
      expect(panels[index].getAttribute('aria-labelledby')).toBe(tab.id);
    });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('gère un tabindex itinérant et masque les panneaux inactifs', async () => {
    const { tabs, panels } = await setup();
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(panels.map((panel) => panel.hidden)).toEqual([false, true, true, true]);
    expect(tabs[2].disabled).toBe(true);
  });

  it('se déplace avec les flèches en ignorant les onglets désactivés', async () => {
    const { host, tabs, panels, press } = await setup();
    tabs[0].focus();

    await press('ArrowRight');
    expect(host.selected()).toBe(1);
    expect(document.activeElement).toBe(tabs[1]);

    await press('ArrowRight');
    expect(host.selected()).toBe(3);
    expect(document.activeElement).toBe(tabs[3]);
    expect(panels[3].hidden).toBe(false);

    await press('ArrowRight');
    expect(host.selected()).toBe(0);

    await press('ArrowLeft');
    expect(host.selected()).toBe(3);
  });

  it('va au premier et au dernier onglet avec Début et Fin', async () => {
    const { host, tabs, press } = await setup();
    tabs[0].focus();

    await press('End');
    expect(host.selected()).toBe(3);
    expect(tabs[3].tabIndex).toBe(0);

    await press('Home');
    expect(host.selected()).toBe(0);
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('sélectionne au clic et émet le changement', async () => {
    const { fixture, host, tabs } = await setup();
    tabs[1].click();
    await fixture.whenStable();
    expect(host.selected()).toBe(1);

    tabs[2].click();
    await fixture.whenStable();
    expect(host.selected()).toBe(1);
  });

  it('se rabat sur le premier onglet actif si l’index demandé est désactivé', async () => {
    const { fixture, host, tabs } = await setup();
    host.selected.set(2);
    await fixture.whenStable();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });
});
