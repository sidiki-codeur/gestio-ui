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
  {
    title: 'Blocs',
    items: [
      { path: '/blocs/etat-vide', label: 'État vide' },
      { path: '/blocs/en-tete-de-page', label: 'En-tête de page' },
      { path: '/blocs/carte-statistique', label: 'Carte statistique' },
      { path: '/blocs/flux-activite', label: 'Flux d’activité' },
      { path: '/blocs/calendrier', label: 'Calendrier' },
      { path: '/blocs/agenda', label: 'Agenda' },
      { path: '/blocs/boutons-sociaux', label: 'Boutons sociaux' },
      { path: '/blocs/connexion', label: 'Connexion' },
      { path: '/blocs/inscription', label: 'Inscription' },
      { path: '/blocs/mot-de-passe-oublie', label: 'Mot de passe oublié' },
      { path: '/blocs/code-otp', label: 'Code OTP' },
      { path: '/blocs/carte-produit', label: 'Carte produit' },
      { path: '/blocs/carrousel', label: 'Carrousel' },
      { path: '/blocs/note-et-avis', label: 'Note et avis' },
      { path: '/blocs/selecteur-quantite', label: 'Sélecteur de quantité' },
      { path: '/blocs/recapitulatif-panier', label: 'Récapitulatif de panier' },
      { path: '/blocs/grille-tarifaire', label: 'Grille tarifaire' },
    ],
  },
];
