import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { SearchEngine } from './types'

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

export interface UserPreferences {
  searchEngine: SearchEngine
  showBookmarksBar: boolean
  homepage: string
  theme: 'dark' | 'light' | 'system'
}

const DEFAULT_PREFERENCES: UserPreferences = {
  searchEngine: 'google',
  showBookmarksBar: true,
  homepage: 'astrix://newtab',
  theme: 'dark'
}

export class StorageService {
  private dataDir: string
  private bookmarksPath: string
  private historyPath: string
  private preferencesPath: string

  private bookmarks: Bookmark[] = []
  private history: HistoryItem[] = []
  private preferences: UserPreferences = DEFAULT_PREFERENCES

  constructor() {
    this.dataDir = app.getPath('userData')
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true })
    }

    this.bookmarksPath = join(this.dataDir, 'bookmarks.json')
    this.historyPath = join(this.dataDir, 'history.json')
    this.preferencesPath = join(this.dataDir, 'preferences.json')

    this.loadAll()
  }

  private loadAll(): void {
    // Load Bookmarks
    try {
      if (existsSync(this.bookmarksPath)) {
        const raw = readFileSync(this.bookmarksPath, 'utf-8')
        this.bookmarks = JSON.parse(raw)
      } else {
        // Default starter bookmarks
        this.bookmarks = [
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
        this.saveBookmarks()
      }
    } catch (e) {
      console.error('Failed to load bookmarks:', e)
      this.bookmarks = []
    }

    // Load History
    try {
      if (existsSync(this.historyPath)) {
        const raw = readFileSync(this.historyPath, 'utf-8')
        this.history = JSON.parse(raw)
      }
    } catch (e) {
      console.error('Failed to load history:', e)
      this.history = []
    }

    // Load Preferences
    try {
      if (existsSync(this.preferencesPath)) {
        const raw = readFileSync(this.preferencesPath, 'utf-8')
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
      } else {
        this.savePreferences()
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
      this.preferences = DEFAULT_PREFERENCES
    }
  }

  // --- Bookmarks Methods ---
  public getBookmarks(): Bookmark[] {
    return [...this.bookmarks]
  }

  public addBookmark(title: string, url: string, favicon?: string): Bookmark {
    // If bookmark for this URL already exists, update it
    const existingIndex = this.bookmarks.findIndex((b) => b.url === url)
    if (existingIndex >= 0) {
      this.bookmarks[existingIndex].title = title || this.bookmarks[existingIndex].title
      if (favicon) this.bookmarks[existingIndex].favicon = favicon
      this.saveBookmarks()
      return this.bookmarks[existingIndex]
    }

    const bookmark: Bookmark = {
      id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || url,
      url,
      favicon,
      createdAt: Date.now()
    }
    this.bookmarks.unshift(bookmark)
    this.saveBookmarks()
    return bookmark
  }

  public removeBookmark(idOrUrl: string): boolean {
    const initialLen = this.bookmarks.length
    this.bookmarks = this.bookmarks.filter((b) => b.id !== idOrUrl && b.url !== idOrUrl)
    if (this.bookmarks.length !== initialLen) {
      this.saveBookmarks()
      return true
    }
    return false
  }

  public isBookmarked(url: string): boolean {
    return this.bookmarks.some((b) => b.url === url)
  }

  private saveBookmarks(): void {
    try {
      writeFileSync(this.bookmarksPath, JSON.stringify(this.bookmarks, null, 2), 'utf-8')
    } catch (e) {
      console.error('Failed to save bookmarks:', e)
    }
  }

  // --- History Methods ---
  public getHistory(query?: string): HistoryItem[] {
    if (!query) return [...this.history]
    const q = query.toLowerCase()
    return this.history.filter(
      (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
    )
  }

  public addHistory(title: string, url: string, favicon?: string): void {
    // Do not record internal or blank pages
    if (!url || url.startsWith('astrix://') || url.startsWith('data:')) return

    const item: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || url,
      url,
      favicon,
      visitedAt: Date.now()
    }
    this.history.unshift(item)
    // Keep at most 2,000 history items
    if (this.history.length > 2000) {
      this.history = this.history.slice(0, 2000)
    }
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

  private saveHistory(): void {
    try {
      writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2), 'utf-8')
    } catch (e) {
      console.error('Failed to save history:', e)
    }
  }

  // --- Preferences Methods ---
  public getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  public updatePreferences(partial: Partial<UserPreferences>): UserPreferences {
    this.preferences = { ...this.preferences, ...partial }
    this.savePreferences()
    return { ...this.preferences }
  }

  private savePreferences(): void {
    try {
      writeFileSync(this.preferencesPath, JSON.stringify(this.preferences, null, 2), 'utf-8')
    } catch (e) {
      console.error('Failed to save preferences:', e)
    }
  }
}
