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
      { path: '/composants/champ-de-formulaire', label: 'Champ de formulaire' },
      { path: '/composants/case-a-cocher', label: 'Case à cocher' },
      { path: '/composants/boutons-radio', label: 'Boutons radio' },
      { path: '/composants/interrupteur', label: 'Interrupteur' },
      { path: '/composants/selecteur', label: 'Sélecteur' },
      { path: '/composants/carte', label: 'Carte' },
      { path: '/composants/badge', label: 'Badge' },
      { path: '/composants/alerte', label: 'Alerte' },
      { path: '/composants/tableau', label: 'Tableau' },
      { path: '/composants/datagrid', label: 'Datagrid' },
      { path: '/composants/pagination', label: 'Pagination' },
      { path: '/composants/modale', label: 'Modale' },
      { path: '/composants/menu', label: 'Menu déroulant' },
      { path: '/composants/notifications', label: 'Notifications' },
      { path: '/composants/info-bulle', label: 'Info-bulle' },
      { path: '/composants/chargement', label: 'Skeleton et spinner' },
      { path: '/composants/onglets', label: 'Onglets' },
    ],
  },
];
