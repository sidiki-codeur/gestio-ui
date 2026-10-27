/*
 * @gestiolabs336/ui/blocks/calendar
 */

export * from './calendar';
export type { GestioWeekday } from './date-utils';
/** Usage interne aux blocs Gestio UI (partagé avec event-calendar). */
export {
  addDays as ɵaddDays,
  addMonths as ɵaddMonths,
  capitalize as ɵcapitalize,
  compareDays as ɵcompareDays,
  dateKey as ɵdateKey,
  isSameDay as ɵisSameDay,
  isSameMonth as ɵisSameMonth,
  monthWeeks as ɵmonthWeeks,
  startOfDay as ɵstartOfDay,
  startOfMonth as ɵstartOfMonth,
  weekdayNames as ɵweekdayNames,
} from './date-utils';
