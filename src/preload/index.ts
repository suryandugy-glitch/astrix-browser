import { contextBridge, ipcRenderer } from 'electron'
import { Tab, TabState, SearchEngine } from '../main/types'
import { Bookmark, HistoryItem, UserPreferences } from '../main/storageService'
import { DownloadRecord } from '../main/downloadManager'
import { FindResult } from './index.d'

const astrixAPI = {
  // Tabs & Navigation
  createTab: (url?: string): Promise<Tab> => ipcRenderer.invoke('tab:create', url),
  duplicateTab: (id?: string): Promise<Tab | undefined> =>
    ipcRenderer.invoke('tab:duplicate', id),
  switchTab: (tabId: string): Promise<void> => ipcRenderer.invoke('tab:switch', tabId),
  closeTab: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:close', tabId),
  closeOtherTabs: (tabId: string): Promise<void> =>
    ipcRenderer.invoke('tab:close-others', tabId),
  navigate: (tabId: string, input: string): Promise<void> =>
    ipcRenderer.invoke('tab:navigate', tabId, input),
  goBack: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:go-back', tabId),
  goForward: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:go-forward', tabId),
  reload: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:reload', tabId),
  reloadIgnoringCache: (tabId?: string): Promise<void> =>
    ipcRenderer.invoke('tab:reload-ignore-cache', tabId),
  stop: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:stop', tabId),
  zoomIn: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:zoom-in', tabId),
  zoomOut: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:zoom-out', tabId),
  resetZoom: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:reset-zoom', tabId),
  toggleMute: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:toggle-mute', tabId),
  toggleDevTools: (tabId?: string): Promise<void> =>
    ipcRenderer.invoke('tab:toggle-devtools', tabId),
  print: (tabId?: string): Promise<void> => ipcRenderer.invoke('tab:print', tabId),
  setSearchEngine: (engine: SearchEngine): Promise<void> =>
    ipcRenderer.invoke('tab:set-search-engine', engine),
  getState: (): Promise<TabState> => ipcRenderer.invoke('tab:get-state'),
  onTabsUpdated: (callback: (state: TabState) => void): (() => void) => {
    const handler = (_event: any, state: TabState) => callback(state)
    ipcRenderer.on('tab:state-changed', handler)
    return () => ipcRenderer.removeListener('tab:state-changed', handler)
  },

  // Find in page
  findStart: (text: string, forward = true, findNext = false): Promise<void> =>
    ipcRenderer.invoke('find:start', text, forward, findNext),
  findStop: (): Promise<void> => ipcRenderer.invoke('find:stop'),
  onFindResult: (callback: (result: FindResult) => void): (() => void) => {
    const handler = (_event: any, result: FindResult) => callback(result)
    ipcRenderer.on('find:result', handler)
    return () => ipcRenderer.removeListener('find:result', handler)
  },

  // Bookmarks
  getBookmarks: (): Promise<Bookmark[]> => ipcRenderer.invoke('bookmarks:get'),
  addBookmark: (title: string, url: string, favicon?: string): Promise<Bookmark> =>
    ipcRenderer.invoke('bookmarks:add', title, url, favicon),
  removeBookmark: (idOrUrl: string): Promise<boolean> =>
    ipcRenderer.invoke('bookmarks:remove', idOrUrl),
  isBookmarked: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('bookmarks:is-bookmarked', url),

  // History
  getHistory: (query?: string): Promise<HistoryItem[]> =>
    ipcRenderer.invoke('history:get', query),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('history:clear'),
  removeHistoryItem: (id: string): Promise<void> =>
    ipcRenderer.invoke('history:remove', id),

  // Downloads
  getDownloads: (): Promise<DownloadRecord[]> => ipcRenderer.invoke('downloads:get'),
  cancelDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke('downloads:cancel', id),
  pauseDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke('downloads:pause', id),
  resumeDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke('downloads:resume', id),
  openDownloadFolder: (id: string): Promise<void> =>
    ipcRenderer.invoke('downloads:open-folder', id),
  onDownloadsUpdated: (callback: (downloads: DownloadRecord[]) => void): (() => void) => {
    const handler = (_event: any, downloads: DownloadRecord[]) => callback(downloads)
    ipcRenderer.on('download:updated', handler)
    return () => ipcRenderer.removeListener('download:updated', handler)
  },

  // Preferences
  getPreferences: (): Promise<UserPreferences> => ipcRenderer.invoke('preferences:get'),
  updatePreferences: (partial: Partial<UserPreferences>): Promise<UserPreferences> =>
    ipcRenderer.invoke('preferences:update', partial),

  // Shortcuts / Events from Main Menu
  onFindToggle: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('find:toggle', handler)
    return () => ipcRenderer.removeListener('find:toggle', handler)
  },
  onHistoryToggle: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('history:toggle', handler)
    return () => ipcRenderer.removeListener('history:toggle', handler)
  },
  onBookmarkToggle: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('bookmark:toggle-current', handler)
    return () => ipcRenderer.removeListener('bookmark:toggle-current', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('astrixAPI', astrixAPI)
  } catch (error) {
    console.error('Failed to expose astrixAPI into main world:', error)
  }
} else {
  // @ts-ignore
  window.astrixAPI = astrixAPI
}
