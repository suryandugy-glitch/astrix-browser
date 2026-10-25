import { Tab, TabState, SearchEngine } from '../main/types'
import { Bookmark, HistoryItem, UserPreferences } from '../main/storageService'
import { DownloadRecord } from '../main/downloadManager'

export interface FindResult {
  activeMatchOrdinal: number
  matches: number
  finalUpdate: boolean
}

export interface AstrixAPI {
  // Tabs & Navigation
  createTab: (url?: string) => Promise<Tab>
  duplicateTab: (id?: string) => Promise<Tab | undefined>
  switchTab: (tabId: string) => Promise<void>
  closeTab: (tabId?: string) => Promise<void>
  closeOtherTabs: (tabId: string) => Promise<void>
  navigate: (tabId: string, input: string) => Promise<void>
  goBack: (tabId?: string) => Promise<void>
  goForward: (tabId?: string) => Promise<void>
  reload: (tabId?: string) => Promise<void>
  reloadIgnoringCache: (tabId?: string) => Promise<void>
  stop: (tabId?: string) => Promise<void>
  zoomIn: (tabId?: string) => Promise<void>
  zoomOut: (tabId?: string) => Promise<void>
  resetZoom: (tabId?: string) => Promise<void>
  toggleMute: (tabId?: string) => Promise<void>
  toggleDevTools: (tabId?: string) => Promise<void>
  print: (tabId?: string) => Promise<void>
  setSearchEngine: (engine: SearchEngine) => Promise<void>
  getState: () => Promise<TabState>
  onTabsUpdated: (callback: (state: TabState) => void) => () => void

  // Find in page
  findStart: (text: string, forward?: boolean, findNext?: boolean) => Promise<void>
  findStop: () => Promise<void>
  onFindResult: (callback: (result: FindResult) => void) => () => void

  // Bookmarks
  getBookmarks: () => Promise<Bookmark[]>
  addBookmark: (title: string, url: string, favicon?: string) => Promise<Bookmark>
  removeBookmark: (idOrUrl: string) => Promise<boolean>
  isBookmarked: (url: string) => Promise<boolean>

  // History
  getHistory: (query?: string) => Promise<HistoryItem[]>
  clearHistory: () => Promise<void>
  removeHistoryItem: (id: string) => Promise<void>

  // Downloads
  getDownloads: () => Promise<DownloadRecord[]>
  cancelDownload: (id: string) => Promise<void>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  openDownloadFolder: (id: string) => Promise<void>
  onDownloadsUpdated: (callback: (downloads: DownloadRecord[]) => void) => () => void

  // Preferences
  getPreferences: () => Promise<UserPreferences>
  updatePreferences: (partial: Partial<UserPreferences>) => Promise<UserPreferences>

  // Shortcut events from Main
  onFindToggle: (callback: () => void) => () => void
  onHistoryToggle: (callback: () => void) => () => void
  onBookmarkToggle: (callback: () => void) => () => void
}

declare global {
  interface Window {
    astrixAPI: AstrixAPI
  }
}
