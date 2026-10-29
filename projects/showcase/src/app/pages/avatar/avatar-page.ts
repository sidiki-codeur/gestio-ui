import { Component } from '@angular/core';
import { GestioAvatar, GestioAvatarGroup, GestioAvatarStatus } from '@gestiolabs336/ui/avatar';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Member {
  readonly id: number;
  readonly name: string;
  readonly photo?: string;
  readonly status: GestioAvatarStatus;
}

/** Image de démonstration embarquée (aucune requête réseau). */
const DEMO_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c7d2fe"/><circle cx="32" cy="25" r="12" fill="#4338ca"/><path d="M10 64c3-14 12-21 22-21s19 7 22 21z" fill="#4338ca"/></svg>`,
  );

@Component({
  selector: 'sc-avatar-page',
  imports: [GestioAvatar, GestioAvatarGroup, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Avatar" eyebrow="Composants">
      <code>gestio-avatar</code> représente une personne ou une organisation : photo, à défaut
      initiales calculées depuis le nom, à défaut icône. Le texte alternatif est le nom ; la couleur
      de fond est déduite du nom et reste stable.
    </sc-page-header>

    <sc-example
      heading="Image, initiales et icône"
      description="La troisième image est introuvable : l’avatar bascule automatiquement sur les initiales."
      [code]="fallbackCode"
    >
      <div class="sc-row">
        <gestio-avatar name="Claire Moreau" [src]="photo" />
        <gestio-avatar name="Jean-Pierre Martin" />
        <gestio-avatar name="Inès Benali" src="/images/introuvable.jpg" />
        <gestio-avatar name="Hugo Lefèvre" />
        <gestio-avatar />
      </div>
    </sc-example>

    <sc-example heading="Tailles et formes" [code]="sizesCode">
      <div class="sc-row">
        @for (size of sizes; track size) {
          <gestio-avatar name="Zoé Petit" [size]="size" />
        }
      </div>
      <div class="sc-row">
        @for (size of sizes; track size) {
          <gestio-avatar name="Atelier Moreau SARL" shape="square" [size]="size" />
        }
      </div>
    </sc-example>

    <sc-example
      heading="Statut de présence"
      description="Chaque statut a une forme de pastille distincte et un texte lu par les lecteurs d’écran."
      [code]="statusCode"
      stacked
    >
      <ul class="sc-avatar-list">
        @for (member of team; track member.id) {
          <li>
            <gestio-avatar [name]="member.name" [src]="member.photo" [status]="member.status" />
            <span>{{ member.name }}</span>
          </li>
        }
      </ul>
    </sc-example>

    <sc-example
      heading="Groupe d’avatars"
      description="Au-delà de max, une pastille « +N » résume les personnes restantes ; total compte celles qui ne sont pas chargées."
      [code]="groupCode"
    >
      <div class="sc-stack">
        <gestio-avatar-group [max]="3" ariaLabel="Équipe du projet Refonte ERP">
          @for (member of team; track member.id) {
            <gestio-avatar [name]="member.name" [src]="member.photo" />
          }
        </gestio-avatar-group>
        <gestio-avatar-group [max]="4" [total]="27" size="sm" ariaLabel="Abonnés au dossier">
          @for (member of team; track member.id) {
            <gestio-avatar [name]="member.name" />
          }
        </gestio-avatar-group>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-avatar et gestio-avatar-group" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          L’avatar utilise un <code>&lt;img&gt;</code> natif (chargement différé) plutôt que
          <code>NgOptimizedImage</code> : les URL d’avatars sont dynamiques et peuvent venir de
          n’importe quel domaine. Sans <code>name</code>, l’avatar est décoratif ; s’il se trouve à
          côté du nom affiché, c’est souvent le bon choix pour éviter une double lecture.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-avatar-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-4) var(--gestio-space-6);
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        display: flex;
        align-items: center;
        gap: var(--gestio-space-2);
        color: var(--gestio-color-text);
      }
    }
  `,
})
export class AvatarPage {
  protected readonly photo = DEMO_PHOTO;
  protected readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
  protected readonly team: Member[] = [
    { id: 1, name: 'Claire Moreau', photo: DEMO_PHOTO, status: 'online' },
    { id: 2, name: 'Jean-Pierre Martin', status: 'away' },
    { id: 3, name: 'Inès Benali', status: 'busy' },
    { id: 4, name: 'Hugo Lefèvre', status: 'offline' },
    { id: 5, name: 'Zoé Petit', status: 'online' },
    { id: 6, name: 'Karim Haddad', status: 'away' },
  ];

  protected readonly fallbackCode = `<gestio-avatar name="Claire Moreau" src="/photos/cmoreau.jpg" />
<gestio-avatar name="Jean-Pierre Martin" />
<gestio-avatar name="Inès Benali" src="/images/introuvable.jpg" />
<gestio-avatar />`;

  protected readonly sizesCode = `<gestio-avatar name="Zoé Petit" size="xs" />
<gestio-avatar name="Zoé Petit" size="xl" />
<gestio-avatar name="Atelier Moreau SARL" shape="square" size="lg" />`;

  protected readonly statusCode = `<gestio-avatar name="Claire Moreau" status="online" />
<gestio-avatar name="Jean-Pierre Martin" status="away" />
<gestio-avatar name="Inès Benali" status="busy" />
<gestio-avatar name="Hugo Lefèvre" status="offline" [labels]="{ offline: 'Déconnecté' }" />`;

  protected readonly groupCode = `<gestio-avatar-group [max]="3" ariaLabel="Équipe du projet Refonte ERP">
  @for (membre of equipe(); track membre.id) {
    <gestio-avatar [name]="membre.nom" [src]="membre.photo" />
  }
</gestio-avatar-group>

<gestio-avatar-group [max]="4" [total]="27" size="sm" ariaLabel="Abonnés au dossier">…</gestio-avatar-group>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'name',
      type: 'string',
      description: 'Nom : texte alternatif, initiales et couleur de fond.',
    },
    {
      name: 'src',
      type: 'string | null',
      description: 'URL de l’image ; en cas d’erreur, repli sur les initiales.',
    },
    {
      name: 'size',
      type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`,
      default: `'md'`,
      description: 'Taille (24 à 64 px).',
    },
    {
      name: 'shape',
      type: `'circle' | 'square'`,
      default: `'circle'`,
      description: 'Rond (personne) ou carré arrondi (organisation).',
    },
    {
      name: 'status',
      type: `'online' | 'away' | 'busy' | 'offline'`,
      description: 'Statut de présence (pastille + texte accessible).',
    },
    {
      name: 'labels',
      type: 'Partial<GestioAvatarLabels>',
      default: '{}',
      description: 'Textes des statuts.',
    },
    {
      name: 'locale',
      type: 'string',
      default: `'fr-FR'`,
      description: 'Langue des majuscules (avatar) et du nombre « +N » (groupe).',
    },
    {
      name: 'gestio-avatar-group · max',
      type: 'number',
      description: 'Nombre maximal d’avatars affichés.',
    },
    {
      name: 'gestio-avatar-group · total',
      type: 'number',
      description: 'Nombre total de personnes, s’il dépasse les avatars fournis.',
    },
    {
      name: 'gestio-avatar-group · size',
      type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`,
      description: 'Taille imposée aux avatars du groupe.',
    },
    {
      name: 'gestio-avatar-group · ariaLabel',
      type: 'string',
      description: 'Nom accessible du groupe.',
    },
    {
      name: 'gestio-avatar-group · labels',
      type: 'Partial<GestioAvatarGroupLabels>',
      default: '{}',
      description: 'Textes de la pastille : moreOne, more ({count}).',
    },
  ];
}
