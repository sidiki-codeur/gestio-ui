export interface NavItem {
  readonly path: string;
  readonly label: string;
}

export interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

export const NAVIGATION: readonly NavSection[] = [
  {
    title: 'Démarrer',
    items: [
      { path: '/', label: 'Introduction' },
      { path: '/fondations', label: 'Fondations' },
      { path: '/mises-en-page', label: 'Mises en page' },
      { path: '/formulaire', label: 'Formulaire complet' },
    ],
  },
  {
    title: 'Composants',
    items: [
      { path: '/composants/bouton', label: 'Bouton' },
      { path: '/composants/champ-de-saisie', label: 'Champ de saisie' },
      { path: '/composants/zone-de-texte', label: 'Zone de texte' },
      { path: '/composants/case-a-cocher', label: 'Case à cocher' },
      { path: '/composants/selecteur', label: 'Sélecteur' },
      { path: '/composants/carte', label: 'Carte' },
      { path: '/composants/badge', label: 'Badge' },
      { path: '/composants/tableau', label: 'Tableau' },
      { path: '/composants/datagrid', label: 'Datagrid' },
      { path: '/composants/modale', label: 'Modale' },
      { path: '/composants/notifications', label: 'Notifications' },
      { path: '/composants/onglets', label: 'Onglets' },
    ],
  },
];
