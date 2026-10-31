/**
 * Where a tapped notification may lead. Reminders carry an in-app path ('/veni'); admin
 * broadcasts later may carry the scheme form ('vinco://forum'). Anything unknown opens Today,
 * so a bad or hostile link can never open an arbitrary screen.
 */
const APP_SCHEME = 'vinco://';

/** Screens a notification may open. */
const ALLOWED_PATHS = [
  '/veni',
  '/vidi',
  '/vici',
  '/settings',
  '/permissions',
  '/forum',
  '/plan',
  '/guard',
  '/aurora',
] as const;

export type NotificationPath = (typeof ALLOWED_PATHS)[number];

export const DEFAULT_NOTIFICATION_PATH: NotificationPath = '/veni';

/** The in-app path for a notification's url, or Today when it is missing or not allowed. */
export function toNotificationPath(url: unknown): NotificationPath {
  if (typeof url !== 'string') return DEFAULT_NOTIFICATION_PATH;
  const trimmed = url.trim();
  const withoutScheme = trimmed.startsWith(APP_SCHEME) ? trimmed.slice(APP_SCHEME.length) : trimmed;
  // Query strings and fragments are not passed on: none of the allowed screens needs them.
  const bare = withoutScheme.split(/[?#]/)[0] ?? '';
  const path = `/${bare.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  return (ALLOWED_PATHS as readonly string[]).includes(path)
    ? (path as NotificationPath)
    : DEFAULT_NOTIFICATION_PATH;
}
