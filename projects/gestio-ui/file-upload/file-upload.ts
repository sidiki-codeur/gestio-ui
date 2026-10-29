import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Motif de refus d'un fichier. */
export type GestioFileRejectionReason = 'type' | 'size' | 'count' | 'duplicate';

/** Fichier refusé à l'ajout, avec le message affiché et annoncé. */
export interface GestioFileRejection {
  readonly file: File;
  readonly reason: GestioFileRejectionReason;
  readonly message: string;
}

/** Libellés du dépôt de fichiers (internationalisation). */
export interface GestioFileUploadLabels {
  /** Invitation de la zone de dépôt (`multiple`). */
  dropzone: string;
  /** Invitation de la zone de dépôt (un seul fichier). */
  dropzoneSingle: string;
  /** Texte affiché pendant le survol avec des fichiers. */
  dragActive: string;
  /** Bouton d'ouverture du sélecteur natif. */
  browse: string;
  /** Contrainte de taille ; `{size}` est remplacé. */
  maxSize: string;
  /** Contrainte de nombre ; `{count}` est remplacé. */
  maxFiles: string;
  /** Nom de la liste des fichiers. */
  fileList: string;
  /** Nom du bouton de retrait ; `{name}` est remplacé. */
  remove: string;
  /** Nom de la barre de progression ; `{name}` est remplacé. */
  progress: string;
  /** Refus : type ; `{name}` est remplacé. */
  errorType: string;
  /** Refus : taille ; `{name}`, `{size}`, `{max}` sont remplacés. */
  errorSize: string;
  /** Refus : nombre maximal atteint ; `{name}`, `{max}` sont remplacés. */
  errorCount: string;
  /** Refus : un seul fichier accepté ; `{name}` est remplacé. */
  errorSingle: string;
  /** Refus : fichier déjà présent ; `{name}` est remplacé. */
  errorDuplicate: string;
  /** Annonce : un fichier ajouté ; `{name}` est remplacé. */
  addedOne: string;
  /** Annonce : plusieurs fichiers ajoutés ; `{count}` est remplacé. */
  addedMany: string;
  /** Annonce : fichier retiré ; `{name}` est remplacé. */
  removed: string;
}

export const GESTIO_FILE_UPLOAD_LABELS: GestioFileUploadLabels = {
  dropzone: 'Glissez-déposez vos fichiers ici ou',
  dropzoneSingle: 'Glissez-déposez un fichier ici ou',
  dragActive: 'Relâchez pour ajouter les fichiers',
  browse: 'Parcourir',
  maxSize: 'Taille maximale : {size}',
  maxFiles: '{count} fichiers maximum',
  fileList: 'Fichiers sélectionnés',
  remove: 'Retirer {name}',
  progress: 'Envoi de {name}',
  errorType: '« {name} » : type de fichier non accepté.',
  errorSize: '« {name} » : fichier trop volumineux ({size}, maximum {max}).',
  errorCount: '« {name} » : {max} fichiers maximum.',
  errorSingle: '« {name} » : un seul fichier est accepté.',
  errorDuplicate: '« {name} » : fichier déjà ajouté.',
  addedOne: '« {name} » ajouté',
  addedMany: '{count} fichiers ajoutés',
  removed: '« {name} » retiré',
};

const SIZE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * Dépôt de fichiers : zone de glisser-déposer et bouton « Parcourir » sur un
 * `<input type="file">` natif (masqué visuellement mais focalisable), validation
 * (type, taille, nombre), liste des fichiers avec retrait et progression optionnelle.
 *
 * ```html
 * <gestio-file-upload
 *   label="Factures"
 *   accept=".pdf,application/pdf"
 *   multiple
 *   [maxSize]="10 * 1024 * 1024"
 *   [maxFiles]="5"
 *   [progress]="avancement()"
 *   formControlName="factures"
 *   (rejected)="onRefus($event)"
 * />
 * ```
 *
 * Valeur : `File[]` (ControlValueAccessor : Reactive Forms, `ngModel`, Signal Forms
 * `[formField]`) ou `[(files)]` hors formulaire. Les refus sont affichés sous la
 * zone et annoncés aux lecteurs d'écran.
 */
@Component({
  selector: 'gestio-file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioFileUpload), multi: true },
  ],
  host: { class: 'gestio-file-upload' },
})
export class GestioFileUpload implements ControlValueAccessor {
  private readonly injector = inject(Injector);

  /** Fichiers sélectionnés (`[(files)]` hors formulaire). */
  readonly files = model<File[]>([]);
  /** Libellé visible du champ. */
  readonly label = input<string>();
  /** Nom accessible sans libellé visible. */
  readonly ariaLabel = input<string>();
  /** Texte d'aide sous la zone. */
  readonly hint = input<string>();
  /** Message d'erreur externe (validation du formulaire). Active l'état invalide. */
  readonly error = input<string | null>();
  /** Types acceptés, comme l'attribut natif : `.pdf,image/*,application/zip`. */
  readonly accept = input<string>('');
  /** Autorise plusieurs fichiers. Sinon un nouveau fichier remplace le précédent. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Taille maximale d'un fichier, en octets. */
  readonly maxSize = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Nombre maximal de fichiers (avec `multiple`). */
  readonly maxFiles = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Avancement de l'envoi par nom de fichier, de 0 à 100. */
  readonly progress = input<Record<string, number>>({});
  /** Indicateur visuel de champ obligatoire. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Identifiant de l'`<input type="file">` natif. Généré automatiquement si absent. */
  readonly inputId = input<string>();
  /** Locale des tailles et pourcentages (`Intl`). */
  readonly locale = input('fr-FR');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioFileUploadLabels>>({});

  /** Fichiers refusés lors d'un ajout (type, taille, nombre, doublon). */
  readonly rejected = output<GestioFileRejection[]>();

  private readonly generatedId = gestioUniqueId('gestio-file-upload');
  protected readonly controlId = computed(() => this.inputId() ?? this.generatedId);
  protected readonly labelId = `${this.generatedId}-label`;
  protected readonly browseId = `${this.generatedId}-browse`;
  protected readonly constraintsId = `${this.generatedId}-constraints`;
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;
  protected readonly rejectionsId = `${this.generatedId}-rejections`;

  protected readonly text = computed<GestioFileUploadLabels>(() => ({
    ...GESTIO_FILE_UPLOAD_LABELS,
    ...this.labels(),
  }));

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly dragging = signal(false);
  protected readonly rejections = signal<readonly GestioFileRejection[]>([]);
  protected readonly announcement = signal('');

  protected readonly constraints = computed(() => {
    const parts: string[] = [];
    const maxSize = this.maxSize();
    const maxFiles = this.maxFiles();
    if (maxSize !== null)
      parts.push(interpolate(this.text().maxSize, { size: this.formatSize(maxSize) }));
    if (maxFiles !== null && this.multiple()) {
      parts.push(interpolate(this.text().maxFiles, { count: maxFiles }));
    }
    return parts.join(' · ');
  });

  protected readonly labelledBy = computed(() =>
    this.label() ? `${this.labelId} ${this.browseId}` : null,
  );

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.constraints()) ids.push(this.constraintsId);
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    if (this.rejections().length) ids.push(this.rejectionsId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly percentFormat = computed(
    () => new Intl.NumberFormat(this.locale(), { style: 'percent', maximumFractionDigits: 0 }),
  );

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly removeButtons = viewChildren<ElementRef<HTMLButtonElement>>('removeButton');

  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.files.set(Array.isArray(value) ? [...(value as File[])] : []);
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  /** Ajoute des fichiers après validation ; les refus sont affichés et émis par `rejected`. */
  addFiles(incoming: readonly File[]): void {
    if (this.isDisabled() || !incoming.length) return;
    const text = this.text();
    const multiple = this.multiple();
    const current = multiple ? this.files() : [];
    const limit = multiple ? (this.maxFiles() ?? Infinity) : 1;
    const maxSize = this.maxSize();
    const accepted: File[] = [];
    const rejections: GestioFileRejection[] = [];
    const reject = (file: File, reason: GestioFileRejectionReason, template: string) =>
      rejections.push({
        file,
        reason,
        message: interpolate(template, {
          name: file.name,
          size: this.formatSize(file.size),
          max: reason === 'size' && maxSize !== null ? this.formatSize(maxSize) : String(limit),
        }),
      });

    for (const file of incoming) {
      if (!this.matchesAccept(file)) {
        reject(file, 'type', text.errorType);
      } else if (maxSize !== null && file.size > maxSize) {
        reject(file, 'size', text.errorSize);
      } else if ([...current, ...accepted].some((other) => sameFile(other, file))) {
        reject(file, 'duplicate', text.errorDuplicate);
      } else if (current.length + accepted.length >= limit) {
        reject(file, 'count', multiple ? text.errorCount : text.errorSingle);
      } else {
        accepted.push(file);
      }
    }

    this.rejections.set(rejections);
    if (rejections.length) this.rejected.emit(rejections);
    if (!accepted.length) return;

    this.commit([...current, ...accepted]);
    this.announce(
      accepted.length === 1
        ? interpolate(text.addedOne, { name: accepted[0].name })
        : interpolate(text.addedMany, { count: accepted.length }),
    );
  }

  /** Retire le fichier à l'index donné. */
  removeFile(index: number): void {
    const file = this.files()[index];
    if (!file || this.isDisabled()) return;
    const remaining = this.files().filter((_, i) => i !== index);
    this.commit(remaining);
    this.rejections.set([]);
    this.announce(interpolate(this.text().removed, { name: file.name }));

    // Le bouton retiré disparaît : le focus passe au fichier voisin ou au champ natif.
    afterNextRender(
      () => {
        const buttons = this.removeButtons();
        const target = buttons[Math.min(index, buttons.length - 1)]?.nativeElement;
        (target ?? this.nativeInput()?.nativeElement)?.focus();
      },
      { injector: this.injector },
    );
  }

  protected formatSize(bytes: number): string {
    let value = Math.max(0, bytes);
    let unit = 0;
    while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
      value /= 1024;
      unit++;
    }
    return new Intl.NumberFormat(this.locale(), {
      style: 'unit',
      unit: SIZE_UNITS[unit],
      unitDisplay: 'short',
      maximumFractionDigits: unit === 0 ? 0 : 1,
    }).format(value);
  }

  protected progressOf(file: File): number | null {
    const value = this.progress()[file.name];
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null;
  }

  protected formatPercent(value: number): string {
    return this.percentFormat().format(value / 100);
  }

  protected interpolate(template: string, name: string): string {
    return interpolate(template, { name });
  }

  protected onNativeChange(element: HTMLInputElement): void {
    this.addFiles(Array.from(element.files ?? []));
    // Permet de sélectionner à nouveau le même fichier.
    element.value = '';
    this.onTouched();
  }

  protected onNativeBlur(): void {
    this.onTouched();
  }

  protected onZoneClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    // Le label et le champ natif ouvrent déjà le sélecteur.
    if (this.isDisabled() || target?.closest('label, input')) return;
    this.nativeInput()?.nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = this.isDisabled() ? 'none' : 'copy';
    if (!this.isDisabled()) this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent, zone: HTMLElement): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !zone.contains(related)) this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.isDisabled()) return;
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
    this.onTouched();
  }

  private commit(files: File[]): void {
    this.files.set(files);
    this.onChange(files);
  }

  private matchesAccept(file: File): boolean {
    const tokens = this.accept()
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);
    if (!tokens.length) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return tokens.some((token) => {
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
