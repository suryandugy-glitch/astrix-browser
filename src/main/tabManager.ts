import { BrowserWindow, BrowserView } from 'electron'
import { Tab, TabState, SearchEngine } from './types'
import { normalizeInputToUrl, generateErrorPageHtml, isAllowedWebContentUrl } from './urlUtils'
import { StorageService } from './storageService'
import { setupWebContextMenu } from './contextMenu'

export class TabManager {
  private mainWindow: BrowserWindow
  private storageService: StorageService
  private tabs: Map<string, { tab: Tab; view: BrowserView }> = new Map()
  private activeTabId: string = ''
  /** Tabs currently showing the built-in error page (their URL is a data: URL internally). */
  private errorTabs: Set<string> = new Set()
  private toolbarHeight: number = 110 // default with bookmarks bar (78px without)

  constructor(mainWindow: BrowserWindow, storageService: StorageService) {
    this.mainWindow = mainWindow
    this.storageService = storageService
    this.updateToolbarHeightFromPreferences()
    this.setupWindowListeners()
  }

  public updateToolbarHeightFromPreferences(): void {
    const prefs = this.storageService.getPreferences()
    this.toolbarHeight = prefs.showBookmarksBar ? 110 : 78
    this.updateActiveViewBounds()
  }

  private setupWindowListeners(): void {
    this.mainWindow.on('resize', () => {
      this.updateActiveViewBounds()
    })
  }

  public getState(): TabState {
    const prefs = this.storageService.getPreferences()
    return {
      tabs: Array.from(this.tabs.values()).map((entry) => ({ ...entry.tab })),
      activeTabId: this.activeTabId,
      activeSearchEngine: prefs.searchEngine
    }
  }

  public setSearchEngine(engine: SearchEngine): void {
    this.storageService.updatePreferences({ searchEngine: engine })
    this.notifyStateChange()
  }

  private notifyStateChange(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    this.mainWindow.webContents.send('tab:state-changed', this.getState())
  }

  public createTab(initialUrl?: string): Tab {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const prefs = this.storageService.getPreferences()
    const targetUrl = initialUrl || prefs.homepage || 'astrix://newtab'
    let normalizedUrl: string
    try {
      normalizedUrl = normalizeInputToUrl(targetUrl, prefs.searchEngine)
    } catch (err) {
      // A blocked scheme must never crash tab creation; fall back to the new tab page.
      console.warn('Blocked tab URL, opening new tab page instead:', err)
      normalizedUrl = 'astrix://newtab'
    }
    const isNewTab = normalizedUrl === 'astrix://newtab'

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        spellcheck: true
      }
    })

    const tab: Tab = {
      id,
      url: normalizedUrl,
      title: isNewTab ? 'New Tab' : 'Loading...',
      favicon: undefined,
      isLoading: !isNewTab,
      canGoBack: false,
      canGoForward: false,
      zoomFactor: 1.0,
      isAudible: false,
      isMuted: false
    }

    this.setupViewListeners(id, view)
    setupWebContextMenu(view.webContents, (url) => this.openFromWebContent(url))

    this.tabs.set(id, { tab, view })

    if (!isNewTab) {
      view.webContents.loadURL(normalizedUrl).catch((err) => {
        console.error(`Failed to load URL ${normalizedUrl}:`, err)
      })
    }

    this.switchTab(id)
    return tab
  }

  /** Opens a URL requested by web content (pop-ups, context menu). Only http(s) is allowed. */
  private openFromWebContent(url: string): void {
    if (!isAllowedWebContentUrl(url)) {
      console.warn('Blocked web content request to open:', url)
      return
    }
    this.createTab(url)
  }

  public duplicateTab(tabId?: string): Tab | undefined {
    const targetId = tabId || this.activeTabId
    const entry = this.tabs.get(targetId)
    if (!entry) return undefined
    return this.createTab(entry.tab.url)
  }

  private setupViewListeners(tabId: string, view: BrowserView): void {
    const webContents = view.webContents

    webContents.on('did-start-loading', () => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        entry.tab.isLoading = true
        this.notifyStateChange()
      }
    })

    webContents.on('did-stop-loading', () => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        entry.tab.isLoading = false
        entry.tab.canGoBack = webContents.canGoBack()
        entry.tab.canGoForward = webContents.canGoForward()
        this.notifyStateChange()
      }
    })

    webContents.on('page-title-updated', (_event, title) => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        entry.tab.title = title || 'Untitled'
        this.notifyStateChange()
        // Update history title if already logged
        if (entry.tab.url && !this.errorTabs.has(tabId)) {
          this.storageService.addHistory(entry.tab.title, entry.tab.url, entry.tab.favicon)
        }
      }
    })

    webContents.on('page-favicon-updated', (_event, favicons) => {
      const entry = this.tabs.get(tabId)
      if (entry && favicons.length > 0) {
        entry.tab.favicon = favicons[0]
        this.notifyStateChange()
      }
    })

    webContents.on('did-navigate', (_event, url) => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        if (url.startsWith('data:text/html') && this.errorTabs.has(tabId)) {
          // Internal error page: keep showing the URL that failed.
          entry.tab.canGoBack = webContents.canGoBack()
          entry.tab.canGoForward = webContents.canGoForward()
          this.notifyStateChange()
          return
        }
        this.errorTabs.delete(tabId)
        entry.tab.url = url
        entry.tab.canGoBack = webContents.canGoBack()
        entry.tab.canGoForward = webContents.canGoForward()
        this.notifyStateChange()

        // Record history
        this.storageService.addHistory(entry.tab.title, url, entry.tab.favicon)
      }
    })

    webContents.on('did-navigate-in-page', (_event, url) => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        entry.tab.url = url
        entry.tab.canGoBack = webContents.canGoBack()
        entry.tab.canGoForward = webContents.canGoForward()
        this.notifyStateChange()
      }
    })

    // Navigation failure & error recovery
    webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (isMainFrame && errorCode !== -3) {
        this.errorTabs.add(tabId)
        const entry = this.tabs.get(tabId)
        if (entry && validatedURL) entry.tab.url = validatedURL
        const errorHtml = generateErrorPageHtml(validatedURL, errorDescription, errorCode)
        webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`)
      }
    })

    // Renderer crash: show the error page instead of leaving a blank tab.
    webContents.on('render-process-gone', (_event, details) => {
      const entry = this.tabs.get(tabId)
      this.errorTabs.add(tabId)
      const failed = entry?.tab.url ?? ''
      const html = generateErrorPageHtml(failed, `Page crashed (${details.reason})`, -1)
      webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    })

    // Web content may only navigate to http(s). Blocks javascript:, file:, data: redirects.
    const guardNavigation = (event: { preventDefault: () => void }, url: string): void => {
      if (url.startsWith('data:text/html') && this.errorTabs.has(tabId)) return
      if (!isAllowedWebContentUrl(url)) {
        console.warn('Blocked navigation to', url)
        event.preventDefault()
      }
    }
    webContents.on('will-navigate', (event, url) => guardNavigation(event, url))
    webContents.on('will-redirect', (event, url) => guardNavigation(event, url))

    // Audio status
    webContents.on('media-started-playing', () => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        entry.tab.isAudible = true
        this.notifyStateChange()
      }
    })

    webContents.on('media-paused', () => {
      const entry = this.tabs.get(tabId)
      if (entry) {
        entry.tab.isAudible = false
        this.notifyStateChange()
      }
    })

    // Find in page results
    webContents.on('found-in-page', (_event, result) => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) return
      this.mainWindow.webContents.send('find:result', {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches,
        finalUpdate: result.finalUpdate
      })
    })

    // Pop-up security
    webContents.setWindowOpenHandler(({ url }) => {
      this.openFromWebContent(url)
      return { action: 'deny' }
    })
  }

  public switchTab(tabId: string): void {
    if (!this.tabs.has(tabId)) return

    if (this.activeTabId && this.tabs.has(this.activeTabId)) {
      const prevEntry = this.tabs.get(this.activeTabId)!
      try {
        this.mainWindow.removeBrowserView(prevEntry.view)
      } catch {
        // Ignored
      }
    }

    this.activeTabId = tabId
    const currentEntry = this.tabs.get(tabId)!

    if (currentEntry.tab.url !== 'astrix://newtab') {
      this.mainWindow.addBrowserView(currentEntry.view)
      this.updateActiveViewBounds()
    }

    this.notifyStateChange()
  }

  public switchTabByIndex(index: number): void {
    const tabIds = Array.from(this.tabs.keys())
    if (index >= 0 && index < tabIds.length) {
      this.switchTab(tabIds[index])
    }
  }

  public switchNextTab(): void {
    const tabIds = Array.from(this.tabs.keys())
    if (tabIds.length <= 1) return
    const currentIndex = tabIds.indexOf(this.activeTabId)
    const nextIndex = (currentIndex + 1) % tabIds.length
    this.switchTab(tabIds[nextIndex])
  }

  public switchPreviousTab(): void {
    const tabIds = Array.from(this.tabs.keys())
    if (tabIds.length <= 1) return
    const currentIndex = tabIds.indexOf(this.activeTabId)
    const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length
    this.switchTab(tabIds[prevIndex])
  }

  public closeTab(tabId?: string): void {
    const targetId = tabId || this.activeTabId
    if (!this.tabs.has(targetId)) return

    const tabIds = Array.from(this.tabs.keys())
    const index = tabIds.indexOf(targetId)
    const entry = this.tabs.get(targetId)!

    try {
      this.mainWindow.removeBrowserView(entry.view)
      ;(entry.view.webContents as any).destroy?.()
    } catch {
      // Ignored
    }

    this.tabs.delete(targetId)
    this.errorTabs.delete(targetId)

    if (this.activeTabId === targetId) {
      if (this.tabs.size === 0) {
        this.createTab()
        return
      } else {
        const nextIndex = Math.min(index, this.tabs.size - 1)
        const nextTabId = Array.from(this.tabs.keys())[nextIndex]
        this.switchTab(nextTabId)
      }
    } else {
      this.notifyStateChange()
    }
  }

  public closeOtherTabs(tabId: string): void {
    const targetId = tabId || this.activeTabId
    const toClose = Array.from(this.tabs.keys()).filter((id) => id !== targetId)
    for (const id of toClose) {
      this.closeTab(id)
    }
  }

  public navigate(tabId: string, input: string): void {
    const entry = this.tabs.get(tabId)
    if (!entry) return

    const prefs = this.storageService.getPreferences()
    let targetUrl: string
    try {
      targetUrl = normalizeInputToUrl(input, prefs.searchEngine)
    } catch (err) {
      console.warn('Navigation blocked:', err)
      return
    }
    this.errorTabs.delete(tabId)
    entry.tab.url = targetUrl

    if (targetUrl === 'astrix://newtab') {
      entry.tab.title = 'New Tab'
      entry.tab.favicon = undefined
      entry.tab.isLoading = false
      try {
        this.mainWindow.removeBrowserView(entry.view)
      } catch {
        // Ignored
      }
      this.notifyStateChange()
      return
    }

    if (this.activeTabId === tabId) {
      try {
        this.mainWindow.addBrowserView(entry.view)
        this.updateActiveViewBounds()
      } catch {
        // Ignored
      }
    }

    entry.tab.isLoading = true
    this.notifyStateChange()

    entry.view.webContents.loadURL(targetUrl).catch((err) => {
      console.error(`Failed to navigate to ${targetUrl}:`, err)
      entry.tab.isLoading = false
      this.notifyStateChange()
    })
  }

  public goBack(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry && entry.view.webContents.canGoBack()) {
      entry.view.webContents.goBack()
    }
  }

  public goForward(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry && entry.view.webContents.canGoForward()) {
      entry.view.webContents.goForward()
    }
  }

  public reload(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry && entry.tab.url !== 'astrix://newtab') {
      entry.view.webContents.reload()
    }
  }

  public reloadIgnoringCache(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry && entry.tab.url !== 'astrix://newtab') {
      entry.view.webContents.reloadIgnoringCache()
    }
  }

  public stop(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry && entry.view.webContents.isLoading()) {
      entry.view.webContents.stop()
      entry.tab.isLoading = false
      this.notifyStateChange()
    }
  }

  public zoomIn(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry) {
      const newFactor = Math.min(3.0, Number((entry.tab.zoomFactor + 0.1).toFixed(1)))
      entry.tab.zoomFactor = newFactor
      entry.view.webContents.setZoomFactor(newFactor)
      this.notifyStateChange()
    }
  }

  public zoomOut(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry) {
      const newFactor = Math.max(0.3, Number((entry.tab.zoomFactor - 0.1).toFixed(1)))
      entry.tab.zoomFactor = newFactor
      entry.view.webContents.setZoomFactor(newFactor)
      this.notifyStateChange()
    }
  }

  public resetZoom(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry) {
      entry.tab.zoomFactor = 1.0
      entry.view.webContents.setZoomFactor(1.0)
      this.notifyStateChange()
    }
  }

  public toggleMute(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry) {
      const newMuted = !entry.tab.isMuted
      entry.tab.isMuted = newMuted
      entry.view.webContents.setAudioMuted(newMuted)
      this.notifyStateChange()
    }
  }

  public toggleDevTools(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry) {
      if (entry.view.webContents.isDevToolsOpened()) {
        entry.view.webContents.closeDevTools()
      } else {
        entry.view.webContents.openDevTools({ mode: 'right' })
      }
    }
  }

  public printPage(tabId?: string): void {
    const id = tabId || this.activeTabId
    const entry = this.tabs.get(id)
    if (entry && entry.tab.url !== 'astrix://newtab') {
      entry.view.webContents.print()
    }
  }

  // --- Find in Page ---
  public findInPage(text: string, forward: boolean = true, findNext: boolean = false): void {
    if (!this.activeTabId || !this.tabs.has(this.activeTabId)) return
    const entry = this.tabs.get(this.activeTabId)!
    if (entry.tab.url === 'astrix://newtab') return

    if (!text.trim()) {
      entry.view.webContents.stopFindInPage('clearSelection')
      return
    }

    entry.view.webContents.findInPage(text, { forward, findNext })
  }

  public stopFindInPage(): void {
    if (!this.activeTabId || !this.tabs.has(this.activeTabId)) return
    const entry = this.tabs.get(this.activeTabId)!
    entry.view.webContents.stopFindInPage('clearSelection')
  }

  public updateActiveViewBounds(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    if (!this.activeTabId || !this.tabs.has(this.activeTabId)) return

    const entry = this.tabs.get(this.activeTabId)!
    if (entry.tab.url === 'astrix://newtab') return

    const [width, height] = this.mainWindow.getContentSize()
    entry.view.setBounds({
      x: 0,
      y: this.toolbarHeight,
      width: Math.max(0, width),
      height: Math.max(0, height - this.toolbarHeight)
    })
    entry.view.setAutoResize({ width: true, height: true })
  }
}
