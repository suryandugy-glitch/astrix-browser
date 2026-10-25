import { BrowserWindow, BrowserView } from 'electron'
import { Tab, TabState } from './types'
import { normalizeInputToUrl } from './urlUtils'

export class TabManager {
  private mainWindow: BrowserWindow
  private tabs: Map<string, { tab: Tab; view: BrowserView }> = new Map()
  private activeTabId: string = ''
  private toolbarHeight: number = 78

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
      activeTabId: this.activeTabId
    }
  }

  private notifyStateChange(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    this.mainWindow.webContents.send('tab:state-changed', this.getState())
  }

  public createTab(initialUrl?: string): Tab {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const normalizedUrl = initialUrl ? normalizeInputToUrl(initialUrl) : 'astrix://newtab'
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
      canGoForward: false
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
        // Ignored if view was not attached
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

  public closeTab(tabId: string): void {
    if (!this.tabs.has(tabId)) return

    const tabIds = Array.from(this.tabs.keys())
    const index = tabIds.indexOf(tabId)
    const entry = this.tabs.get(tabId)!

    try {
      this.mainWindow.removeBrowserView(entry.view)
      // Clean up webContents
      ;(entry.view.webContents as any).destroy?.()
    } catch {
      // Ignored
    }

    this.tabs.delete(tabId)

    // If active tab was closed, select adjacent tab
    if (this.activeTabId === tabId) {
      if (this.tabs.size === 0) {
        // If all tabs were closed, create a fresh new tab
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

    const targetUrl = normalizeInputToUrl(input)
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

    // Attach view if it wasn't attached (e.g. was astrix://newtab)
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
      entry.tab.title = 'Navigation Error'
      this.notifyStateChange()
    })
  }

  public goBack(tabId: string): void {
    const entry = this.tabs.get(tabId)
    if (entry && entry.view.webContents.canGoBack()) {
      entry.view.webContents.goBack()
    }
  }

  public goForward(tabId: string): void {
    const entry = this.tabs.get(tabId)
    if (entry && entry.view.webContents.canGoForward()) {
      entry.view.webContents.goForward()
    }
  }

  public reload(tabId: string): void {
    const entry = this.tabs.get(tabId)
    if (entry && entry.tab.url !== 'astrix://newtab') {
      entry.view.webContents.reload()
    }
  }

  public stop(tabId: string): void {
    const entry = this.tabs.get(tabId)
    if (entry && entry.view.webContents.isLoading()) {
      entry.view.webContents.stop()
      entry.tab.isLoading = false
      this.notifyStateChange()
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
