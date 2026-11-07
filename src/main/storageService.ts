import { app } from 'electron'
import { join } from 'path'
import { loadJson, saveJson } from './jsonStore'
import { DEFAULT_PREFERENCES, sanitizePreferences, isStorableUrl, cleanText, cleanFavicon } from './validators'
import type { PreferencesShape } from './validators'
import { parseBookmarksHtml, exportBookmarksHtml } from './bookmarkIO'
import type { Decision } from './permissionPolicy'
import { recordVisit, computeTopSites } from './historyUtils'

export interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
  createdAt: number
}

export interface HistoryItem {
  id: string
  title: string
  url: string
  favicon?: string
  visitedAt: number
}

export type UserPreferences = PreferencesShape

export interface SitePermission {
  origin: string
  permission: string
  decision: Decision
}

const SCHEMA_VERSION = 1

const STARTER_BOOKMARKS = (): Bookmark[] => [
  {
    id: 'bm-github',
    title: 'GitHub',
    url: 'https://github.com',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    createdAt: Date.now()
  },
  {
    id: 'bm-wiki',
    title: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    favicon: 'https://www.wikipedia.org/static/favicon/wikipedia.ico',
    createdAt: Date.now()
  },
  {
    id: 'bm-hn',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com',
    favicon: 'https://news.ycombinator.com/favicon.ico',
    createdAt: Date.now()
  }
]

const newId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

export class StorageService {
  private bookmarksPath: string
  private historyPath: string
  private preferencesPath: string
  private permissionsPath: string

  private bookmarks: Bookmark[] = []
  private history: HistoryItem[] = []
  private preferences: UserPreferences = { ...DEFAULT_PREFERENCES }
  private permissions: Record<string, Record<string, Decision>> = {}

  constructor(dataDir: string = app.getPath('userData')) {
    this.bookmarksPath = join(dataDir, 'bookmarks.json')
    this.historyPath = join(dataDir, 'history.json')
    this.preferencesPath = join(dataDir, 'preferences.json')
    this.permissionsPath = join(dataDir, 'permissions.json')
    this.loadAll()
  }

  private safeSave<T>(path: string, data: T, label: string): void {
    try {
      saveJson(path, data, SCHEMA_VERSION)
    } catch (e) {
      console.error(`Failed to save ${label}:`, e)
    }
  }

  private loadAll(): void {
    const bm = loadJson<unknown>(this.bookmarksPath, null, SCHEMA_VERSION)
    if (Array.isArray(bm.data)) {
      this.bookmarks = bm.data.filter(
        (b): b is Bookmark => !!b && typeof b.url === 'string' && typeof b.id === 'string'
      )
    } else {
      this.bookmarks = bm.existed ? [] : STARTER_BOOKMARKS()
      if (!bm.existed) this.saveBookmarks()
    }

    const hist = loadJson<unknown>(this.historyPath, [], SCHEMA_VERSION)
    this.history = Array.isArray(hist.data)
      ? hist.data.filter((h): h is HistoryItem => !!h && typeof h.url === 'string')
      : []

    const prefs = loadJson<unknown>(this.preferencesPath, null, SCHEMA_VERSION)
    this.preferences = { ...DEFAULT_PREFERENCES, ...sanitizePreferences(prefs.data) }
    if (!prefs.existed) this.savePreferences()

    const perms = loadJson<unknown>(this.permissionsPath, {}, SCHEMA_VERSION)
    this.permissions =
      perms.data && typeof perms.data === 'object' && !Array.isArray(perms.data)
        ? (perms.data as Record<string, Record<string, Decision>>)
        : {}
  }

  // --- Bookmarks ---
  public getBookmarks(): Bookmark[] {
    return [...this.bookmarks]
  }

  public addBookmark(title: string, url: string, favicon?: string): Bookmark | null {
    if (!isStorableUrl(url)) return null
    const cleanTitle = cleanText(title)
    const icon = cleanFavicon(favicon)

    const existing = this.bookmarks.find((b) => b.url === url)
    if (existing) {
      existing.title = cleanTitle || existing.title
      if (icon) existing.favicon = icon
      this.saveBookmarks()
      return existing
    }

    const bookmark: Bookmark = {
      id: newId('bm'),
      title: cleanTitle || url,
      url,
      favicon: icon,
      createdAt: Date.now()
    }
    this.bookmarks.unshift(bookmark)
    this.saveBookmarks()
    return bookmark
  }

  public removeBookmark(idOrUrl: string): boolean {
    const before = this.bookmarks.length
    this.bookmarks = this.bookmarks.filter((b) => b.id !== idOrUrl && b.url !== idOrUrl)
    if (this.bookmarks.length !== before) {
      this.saveBookmarks()
      return true
    }
    return false
  }

  public isBookmarked(url: string): boolean {
    return this.bookmarks.some((b) => b.url === url)
  }

  /** Returns how many new bookmarks were added. */
  public importBookmarksHtml(html: string): number {
    let added = 0
    for (const item of parseBookmarksHtml(html)) {
      if (!isStorableUrl(item.url) || this.isBookmarked(item.url)) continue
      this.bookmarks.push({
        id: newId('bm'),
        title: cleanText(item.title) || item.url,
        url: item.url,
        createdAt: item.createdAt ?? Date.now()
      })
      added++
    }
    if (added > 0) this.saveBookmarks()
    return added
  }

  public exportBookmarksHtml(): string {
    return exportBookmarksHtml(this.bookmarks)
  }

  private saveBookmarks(): void {
    this.safeSave(this.bookmarksPath, this.bookmarks, 'bookmarks')
  }

  // --- History ---
  public getHistory(query?: string): HistoryItem[] {
    if (!query) return [...this.history]
    const q = query.toLowerCase()
    return this.history.filter(
      (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
    )
  }

  public addHistory(title: string, url: string, favicon?: string): void {
    if (!isStorableUrl(url)) return
    this.history = recordVisit(
      this.history,
      { title: cleanText(title), url, favicon: cleanFavicon(favicon) },
      Date.now(),
      () => newId('hist')
    )
    this.saveHistory()
  }

  public clearHistory(): void {
    this.history = []
    this.saveHistory()
  }

  public removeHistoryItem(id: string): void {
    this.history = this.history.filter((h) => h.id !== id)
    this.saveHistory()
  }

  /** Most visited sites, used by the new tab page. */
  public getTopSites(limit = 8): { url: string; title: string; favicon?: string; visits: number }[] {
    return computeTopSites(this.history, limit)
  }

  private saveHistory(): void {
    this.safeSave(this.historyPath, this.history, 'history')
  }

  // --- Preferences ---
  public getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  public updatePreferences(partial: unknown): UserPreferences {
    this.preferences = { ...this.preferences, ...sanitizePreferences(partial) }
    this.savePreferences()
    return { ...this.preferences }
  }

  private savePreferences(): void {
    this.safeSave(this.preferencesPath, this.preferences, 'preferences')
  }

  // --- Site permissions ---
  public getPermissionStore(): Record<string, Record<string, Decision>> {
    return this.permissions
  }

  public listSitePermissions(): SitePermission[] {
    const out: SitePermission[] = []
    for (const [origin, perms] of Object.entries(this.permissions)) {
      for (const [permission, decision] of Object.entries(perms)) {
        out.push({ origin, permission, decision })
      }
    }
    return out.sort((a, b) => a.origin.localeCompare(b.origin))
  }

  public setSitePermission(origin: string, permission: string, decision: Decision): void {
    if (decision !== 'allow' && decision !== 'deny') return
    if (!this.permissions[origin]) this.permissions[origin] = {}
    this.permissions[origin][permission] = decision
    this.savePermissions()
  }

  public removeSitePermission(origin: string, permission: string): void {
    const perms = this.permissions[origin]
    if (!perms) return
    delete perms[permission]
    if (Object.keys(perms).length === 0) delete this.permissions[origin]
    this.savePermissions()
  }

  public clearSitePermissions(): void {
    this.permissions = {}
    this.savePermissions()
  }

  private savePermissions(): void {
    this.safeSave(this.permissionsPath, this.permissions, 'permissions')
  }
}
