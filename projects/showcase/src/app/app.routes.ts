import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Gestio UI — Introduction',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'fondations',
    title: 'Fondations — Gestio UI',
    loadComponent: () =>
      import('./pages/foundations/foundations-page').then((m) => m.FoundationsPage),
  },
  {
    path: 'mises-en-page',
    title: 'Mises en page — Gestio UI',
    loadComponent: () => import('./pages/layout/layout-page').then((m) => m.LayoutPage),
  },
  {
    path: 'formulaire',
    title: 'Formulaire complet — Gestio UI',
    loadComponent: () => import('./pages/form/form-page').then((m) => m.FormPage),
  },
  {
    path: 'composants',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'bouton' },
      {
        path: 'bouton',
        title: 'Bouton — Gestio UI',
        loadComponent: () => import('./pages/button/button-page').then((m) => m.ButtonPage),
      },
      {
        path: 'champ-de-saisie',
        title: 'Champ de saisie — Gestio UI',
        loadComponent: () => import('./pages/input/input-page').then((m) => m.InputPage),
      },
      {
        path: 'zone-de-texte',
        title: 'Zone de texte — Gestio UI',
        loadComponent: () => import('./pages/textarea/textarea-page').then((m) => m.TextareaPage),
      },
      {
        path: 'case-a-cocher',
        title: 'Case à cocher — Gestio UI',
        loadComponent: () => import('./pages/checkbox/checkbox-page').then((m) => m.CheckboxPage),
      },
      {
        path: 'selecteur',
        title: 'Sélecteur — Gestio UI',
        loadComponent: () => import('./pages/select/select-page').then((m) => m.SelectPage),
      },
      {
        path: 'carte',
        title: 'Carte — Gestio UI',
        loadComponent: () => import('./pages/card/card-page').then((m) => m.CardPage),
      },
      {
        path: 'badge',
        title: 'Badge — Gestio UI',
        loadComponent: () => import('./pages/badge/badge-page').then((m) => m.BadgePage),
      },
      {
        path: 'tableau',
        title: 'Tableau — Gestio UI',
        loadComponent: () => import('./pages/table/table-page').then((m) => m.TablePage),
      },
      {
        path: 'datagrid',
        title: 'Datagrid — Gestio UI',
        loadComponent: () => import('./pages/datagrid/datagrid-page').then((m) => m.DataGridPage),
      },
      {
        path: 'modale',
        title: 'Modale — Gestio UI',
        loadComponent: () => import('./pages/dialog/dialog-page').then((m) => m.DialogPage),
      },
      {
        path: 'notifications',
        title: 'Notifications — Gestio UI',
        loadComponent: () => import('./pages/toast/toast-page').then((m) => m.ToastPage),
      },
      {
        path: 'onglets',
        title: 'Onglets — Gestio UI',
        loadComponent: () => import('./pages/tabs/tabs-page').then((m) => m.TabsPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Page introuvable — Gestio UI',
    loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
