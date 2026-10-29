import { InjectionToken, Signal } from '@angular/core';
import type { GestioAvatar, GestioAvatarSize } from './avatar';

/** Contrat interne entre `gestio-avatar-group` et ses `gestio-avatar`. */
export interface ɵGestioAvatarGroupHost {
  readonly size: Signal<GestioAvatarSize | undefined>;
  isHidden(avatar: GestioAvatar): boolean;
}

/** Usage interne : fourni par `gestio-avatar-group`. */
export const ɵGESTIO_AVATAR_GROUP = new InjectionToken<ɵGestioAvatarGroupHost>(
  'GESTIO_AVATAR_GROUP',
);
