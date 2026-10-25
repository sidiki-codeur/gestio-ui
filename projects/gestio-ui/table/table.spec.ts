import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioTable, GestioTableContainer } from './table';

@Component({
  imports: [GestioTable, GestioTableContainer],
  template: `
    <gestio-table-container label="Factures" maxHeight="20rem">
      <table gestioTable striped columnDividers density="compact">
        <caption>
          Factures d’octobre
        </caption>
        <thead>
          <tr>
            <th scope="col">N°</th>
            <th scope="col" class="gestio-table-numeric">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>F-118</td>
            <td class="gestio-table-numeric">1 250,00 €</td>
          </tr>
        </tbody>
      </table>
    </gestio-table-container>
  `,
})
class Host {}

describe('GestioTable', () => {
  it('conserve la sémantique native et applique les modificateurs', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;

    expect(table.caption?.textContent).toContain('octobre');
    expect(table.classList).toContain('gestio-table');
    expect(table.classList).toContain('gestio-table--striped');
    expect(table.classList).toContain('gestio-table--compact');
    expect(table.classList).toContain('gestio-table--hover');
    expect(table.classList).toContain('gestio-table--column-dividers');
    expect(table.rows).toHaveLength(2);
  });

  it('rend le conteneur défilant focalisable et nommé', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const container = fixture.nativeElement.querySelector('gestio-table-container') as HTMLElement;

    expect(container.getAttribute('tabindex')).toBe('0');
    expect(container.getAttribute('role')).toBe('region');
    expect(container.getAttribute('aria-label')).toBe('Factures');
    expect(container.style.maxHeight).toBe('20rem');
  });
});
