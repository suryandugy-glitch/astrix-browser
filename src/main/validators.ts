import type { SearchEngine } from './types'

/**
 * Pure validation helpers. No Electron imports so they can be unit tested with plain Node.
 */

export type ThemePreference = 'dark' | 'light' | 'system'

export interface PreferencesShape {
  searchEngine: SearchEngine
  showBookmarksBar: boolean
  homepage: string
  theme: ThemePreference
}

export const SEARCH_ENGINE_IDS: readonly SearchEngine[] = ['google', 'duckduckgo', 'bing', 'brave']
export const THEMES: readonly ThemePreference[] = ['dark', 'light', 'system']

export const DEFAULT_PREFERENCES: PreferencesShape = {
  searchEngine: 'google',
  showBookmarksBar: true,
  homepage: 'astrix://newtab',
  theme: 'dark'
}

export function isSearchEngine(value: unknown): value is SearchEngine {
  return typeof value === 'string' && (SEARCH_ENGINE_IDS as readonly string[]).includes(value)
}

export function isTheme(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function isValidHomepage(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (v === 'astrix://newtab') return true
  if (v.length === 0 || v.length > 2048) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Takes untrusted input (from IPC or disk) and returns only the valid preference fields.
 * Unknown keys and invalid values are dropped, never thrown on.
 */
export function sanitizePreferences(input: unknown): Partial<PreferencesShape> {
  const out: Partial<PreferencesShape> = {}
  if (typeof input !== 'object' || input === null) return out
  const obj = input as Record<string, unknown>
  if (isSearchEngine(obj.searchEngine)) out.searchEngine = obj.searchEngine
  if (typeof obj.showBookmarksBar === 'boolean') out.showBookmarksBar = obj.showBookmarksBar
  if (isTheme(obj.theme)) out.theme = obj.theme
  if (isValidHomepage(obj.homepage)) out.homepage = obj.homepage.trim()
  return out
}

/** Validates a bookmark/history URL before it is stored. */
export function isStorableUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Trims and limits free text such as titles. */
export function cleanText(value: unknown, max = 300): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
}

/** Only http(s) or data:image favicons are kept. */
export function cleanFavicon(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 4096) return undefined
  if (/^https?:\/\//i.test(value)) return value
  return undefined
}
