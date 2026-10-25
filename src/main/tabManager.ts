import { BrowserWindow, BrowserView } from 'electron'
import { Tab, TabState, SearchEngine } from './types'
import { normalizeInputToUrl, generateErrorPageHtml } from './urlUtils'

export class TabManager {
  private mainWindow: BrowserWindow
  private tabs: Map<string, { tab: Tab; view: BrowserView }> = new Map()
  private activeTabId: string = ''
  private toolbarHeight: number = 78
  private activeSearchEngine: SearchEngine = 'google'

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.setupWindowListeners()
  }

  private setupWindowListeners(): void {
    this.mainWindow.on('resize', () => {
      this.updateActiveViewBounds()
    })
  }

  public getState(): TabState {
    return {
      tabs: Array.from(this.tabs.values()).map((entry) => ({ ...entry.tab })),
      activeTabId: this.activeTabId,
      activeSearchEngine: this.activeSearchEngine
    }
  }

  public setSearchEngine(engine: SearchEngine): void {
    this.activeSearchEngine = engine
    this.notifyStateChange()
  }

  private notifyStateChange(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    this.mainWindow.webContents.send('tab:state-changed', this.getState())
  }

  public createTab(initialUrl?: string): Tab {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const normalizedUrl = initialUrl
      ? normalizeInputToUrl(initialUrl, this.activeSearchEngine)
      : 'astrix://newtab'
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
    this.tabs.set(id, { tab, view })

    if (!isNewTab) {
      view.webContents.loadURL(normalizedUrl).catch((err) => {
        console.error(`Failed to load URL ${normalizedUrl}:`, err)
      })
    }

    this.switchTab(id)
    return tab
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
        entry.tab.url = url
        entry.tab.canGoBack = webContents.canGoBack()
        entry.tab.canGoForward = webContents.canGoForward()
        this.notifyStateChange()
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

    // Navigation failure & error handling
    webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Ignore user-aborted navigation (e.g. clicking another link before previous finishes)
      if (isMainFrame && errorCode !== -3) {
        const errorHtml = generateErrorPageHtml(validatedURL, errorDescription, errorCode)
        webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`)
      }
    })

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

    // Pop-up security: redirect target="_blank" and window.open to a managed Astrix tab
    webContents.setWindowOpenHandler(({ url }) => {
      this.createTab(url)
      return { action: 'deny' }
    })
  }

  public switchTab(tabId: string): void {
    if (!this.tabs.has(tabId)) return

    // Detach previous view if one was mounted
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

    // If current tab is not on new tab, attach its view
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

    // If active tab was closed, select adjacent tab
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

  public navigate(tabId: string, input: string): void {
    const entry = this.tabs.get(tabId)
    if (!entry) return

    const targetUrl = normalizeInputToUrl(input, this.activeSearchEngine)
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

    // Attach view if it was not attached
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
