/**
 * Permission policy for web content. Pure, no Electron imports.
 *
 * Decision order:
 *  1. A permission in ALWAYS_DENY is never granted.
 *  2. A permission in SAFE_BY_DEFAULT is granted (needed for normal pages to work).
 *  3. Otherwise the stored per-site choice is used.
 *  4. With no stored choice the answer is "deny".
 */

export type Decision = 'allow' | 'deny'

export const SAFE_BY_DEFAULT = new Set<string>(['fullscreen', 'clipboard-sanitized-write'])

export const ALWAYS_DENY = new Set<string>(['openExternal', 'window-management', 'hid', 'serial', 'usb'])

export const PROMPTABLE = [
  'media',
  'geolocation',
  'notifications',
  'clipboard-read',
  'pointerLock',
  'idle-detection',
  'midi'
] as const

export function originOf(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.origin
  } catch {
    return null
  }
}

export function decidePermission(
  permission: string,
  requestingUrl: string,
  stored: Record<string, Record<string, Decision>>
): Decision {
  if (ALWAYS_DENY.has(permission)) return 'deny'
  if (SAFE_BY_DEFAULT.has(permission)) return 'allow'
  const origin = originOf(requestingUrl)
  if (!origin) return 'deny'
  return stored[origin]?.[permission] === 'allow' ? 'allow' : 'deny'
}
