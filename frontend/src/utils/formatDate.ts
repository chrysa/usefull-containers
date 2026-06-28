/**
 * Date formatting helpers bound to the active i18n locale rather than the
 * browser/OS locale. Pass the current language from
 * `useTranslation().i18n.language` so a user reading the app in English does
 * not see French-formatted dates (and vice-versa).
 */

const EMPTY = "—";

export function formatDate(
  iso: string | null,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return EMPTY;
  return new Date(iso).toLocaleDateString(locale, options);
}

export function formatDateTime(iso: string | null, locale?: string): string {
  if (!iso) return EMPTY;
  return new Date(iso).toLocaleString(locale);
}
