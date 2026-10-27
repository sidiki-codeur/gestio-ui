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
        path: 'champ-de-formulaire',
        title: 'Champ de formulaire — Gestio UI',
        loadComponent: () =>
          import('./pages/form-field/form-field-page').then((m) => m.FormFieldPage),
      },
      {
        path: 'case-a-cocher',
        title: 'Case à cocher — Gestio UI',
        loadComponent: () => import('./pages/checkbox/checkbox-page').then((m) => m.CheckboxPage),
      },
      {
        path: 'boutons-radio',
        title: 'Boutons radio — Gestio UI',
        loadComponent: () => import('./pages/radio/radio-page').then((m) => m.RadioPage),
      },
      {
        path: 'interrupteur',
        title: 'Interrupteur — Gestio UI',
        loadComponent: () => import('./pages/switch/switch-page').then((m) => m.SwitchPage),
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
        path: 'alerte',
        title: 'Alerte — Gestio UI',
        loadComponent: () => import('./pages/alert/alert-page').then((m) => m.AlertPage),
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
        path: 'pagination',
        title: 'Pagination — Gestio UI',
        loadComponent: () =>
          import('./pages/pagination/pagination-page').then((m) => m.PaginationPage),
      },
      {
        path: 'modale',
        title: 'Modale — Gestio UI',
        loadComponent: () => import('./pages/dialog/dialog-page').then((m) => m.DialogPage),
      },
      {
        path: 'menu',
        title: 'Menu déroulant — Gestio UI',
        loadComponent: () => import('./pages/menu/menu-page').then((m) => m.MenuPage),
      },
      {
        path: 'notifications',
        title: 'Notifications — Gestio UI',
        loadComponent: () => import('./pages/toast/toast-page').then((m) => m.ToastPage),
      },
      {
        path: 'info-bulle',
        title: 'Info-bulle — Gestio UI',
        loadComponent: () => import('./pages/tooltip/tooltip-page').then((m) => m.TooltipPage),
      },
      {
        path: 'chargement',
        title: 'Skeleton et spinner — Gestio UI',
        loadComponent: () => import('./pages/loading/loading-page').then((m) => m.LoadingPage),
      },
      {
        path: 'onglets',
        title: 'Onglets — Gestio UI',
        loadComponent: () => import('./pages/tabs/tabs-page').then((m) => m.TabsPage),
      },
    ],
  },
  {
    path: 'blocs',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'etat-vide' },
      {
        path: 'etat-vide',
        title: 'État vide — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/empty-state/empty-state-page').then((m) => m.EmptyStatePage),
      },
      {
        path: 'en-tete-de-page',
        title: 'En-tête de page — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/page-header/page-header-page').then((m) => m.PageHeaderPage),
      },
      {
        path: 'carte-statistique',
        title: 'Carte statistique — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/stat-card/stat-card-page').then((m) => m.StatCardPage),
      },
      {
        path: 'flux-activite',
        title: 'Flux d’activité — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/activity-feed/activity-feed-page').then((m) => m.ActivityFeedPage),
      },
      {
        path: 'calendrier',
        title: 'Calendrier — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/calendar/calendar-page').then((m) => m.CalendarPage),
      },
      {
        path: 'agenda',
        title: 'Agenda — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/event-calendar/event-calendar-page').then(
            (m) => m.EventCalendarPage,
          ),
      },
      {
        path: 'boutons-sociaux',
        title: 'Boutons sociaux — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/social-button/social-button-page').then((m) => m.SocialButtonPage),
      },
      {
        path: 'connexion',
        title: 'Connexion — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/login-form/login-form-page').then((m) => m.LoginFormPage),
      },
      {
        path: 'inscription',
        title: 'Inscription — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/signup-form/signup-form-page').then((m) => m.SignupFormPage),
      },
      {
        path: 'mot-de-passe-oublie',
        title: 'Mot de passe oublié — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/forgot-password-form/forgot-password-form-page').then(
            (m) => m.ForgotPasswordFormPage,
          ),
      },
      {
        path: 'code-otp',
        title: 'Code OTP — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/otp-input/otp-input-page').then((m) => m.OtpInputPage),
      },
      {
        path: 'carte-produit',
        title: 'Carte produit — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/product-card/product-card-page').then((m) => m.ProductCardPage),
      },
      {
        path: 'carrousel',
        title: 'Carrousel — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/carousel/carousel-page').then((m) => m.CarouselPage),
      },
      {
        path: 'note-et-avis',
        title: 'Note et avis — Gestio UI',
        loadComponent: () => import('./pages/blocks/rating/rating-page').then((m) => m.RatingPage),
      },
      {
        path: 'selecteur-quantite',
        title: 'Sélecteur de quantité — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/quantity-input/quantity-input-page').then(
            (m) => m.QuantityInputPage,
          ),
      },
      {
        path: 'recapitulatif-panier',
        title: 'Récapitulatif de panier — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/cart-summary/cart-summary-page').then((m) => m.CartSummaryPage),
      },
      {
        path: 'grille-tarifaire',
        title: 'Grille tarifaire — Gestio UI',
        loadComponent: () =>
          import('./pages/blocks/pricing-table/pricing-table-page').then((m) => m.PricingTablePage),
      },
    ],
  },
  {
    path: '**',
    title: 'Page introuvable — Gestio UI',
    loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
