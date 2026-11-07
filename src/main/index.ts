import { app, BrowserWindow, ipcMain, session, Menu, dialog, nativeTheme } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { TabManager } from './tabManager'
import { StorageService, UserPreferences } from './storageService'
import { DownloadManager } from './downloadManager'
import type { SearchEngine } from './types'
import { decidePermission, originOf } from './permissionPolicy'
import type { Decision } from './permissionPolicy'
import { isSearchEngine } from './validators'

let mainWindow: BrowserWindow | null = null
let tabManager: TabManager | null = null
let storageService: StorageService | null = null
let downloadManager: DownloadManager | null = null

const WINDOW_BG: Record<string, string> = { dark: '#1e1f29', light: '#f4f5f8' }

function applyTheme(theme: 'dark' | 'light' | 'system'): void {
  nativeTheme.themeSource = theme
  if (mainWindow && !mainWindow.isDestroyed()) {
    const effective = theme === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : theme
    mainWindow.setBackgroundColor(WINDOW_BG[effective])
  }
}

/** Only the browser UI window may call IPC handlers. Web pages never can. */
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  return !!mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents
}

function handle(
  channel: string,
  listener: (event: IpcMainInvokeEvent, ...args: any[]) => unknown
): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedSender(event)) {
      console.warn(`Rejected IPC "${channel}" from untrusted sender`)
      return undefined
    }
    return listener(event, ...args)
  })
}

function setupPermissions(): void {
  const ses = session.defaultSession
  const decide = (permission: string, url: string): Decision =>
    decidePermission(permission, url, storageService?.getPermissionStore() ?? {})

  ses.setPermissionRequestHandler((_wc, permission, callback, details) => {
    const decision = decide(permission, details.requestingUrl)
    if (decision === 'deny') {
      console.info(`Denied permission "${permission}" for ${details.requestingUrl}`)
    }
    callback(decision === 'allow')
  })

  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    return decide(permission, requestingOrigin) === 'allow'
  })
}

function setupApplicationMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: any[] = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => tabManager?.createTab()
        },
        {
          label: 'Duplicate Tab',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => tabManager?.duplicateTab()
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => tabManager?.closeTab()
        },
        { type: 'separator' },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => tabManager?.printPage()
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find in Page...',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('find:toggle')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => tabManager?.reload()
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => tabManager?.reloadIgnoringCache()
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => tabManager?.resetZoom()
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => tabManager?.zoomIn()
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => tabManager?.zoomOut()
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => tabManager?.toggleDevTools()
        }
      ]
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => tabManager?.goBack()
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => tabManager?.goForward()
        },
        { type: 'separator' },
        {
          label: 'Show Full History',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow?.webContents.send('history:toggle')
        }
      ]
    },
    {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Bookmark Current Tab',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow?.webContents.send('bookmark:toggle-current')
        },
        {
          label: 'Show Bookmarks Bar',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => {
            if (storageService && tabManager) {
              const current = storageService.getPreferences().showBookmarksBar
              storageService.updatePreferences({ showBookmarksBar: !current })
              tabManager.updateToolbarHeightFromPreferences()
              mainWindow?.webContents.send(
                'preferences:changed',
                storageService.getPreferences()
              )
            }
          }
        }
      ]
    },
    {
      label: 'Tabs',
      submenu: [
        {
          label: 'Next Tab',
          accelerator: 'CmdOrCtrl+Tab',
          click: () => tabManager?.switchNextTab()
        },
        {
          label: 'Previous Tab',
          accelerator: 'CmdOrCtrl+Shift+Tab',
          click: () => tabManager?.switchPreviousTab()
        },
        { type: 'separator' },
        ...[1, 2, 3, 4, 5, 6, 7, 8].map((num) => ({
          label: `Tab ${num}`,
          accelerator: `CmdOrCtrl+${num}`,
          click: () => tabManager?.switchTabByIndex(num - 1)
        }))
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  const storage = new StorageService()
  storageService = storage
  downloadManager = new DownloadManager()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 700,
    minHeight: 500,
    title: 'Astrix Browser',
    show: false,
    autoHideMenuBar: true,
    backgroundColor: WINDOW_BG[storage.getPreferences().theme] ?? WINDOW_BG.dark,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })
  applyTheme(storage.getPreferences().theme)

  tabManager = new TabManager(mainWindow, storage)
  downloadManager.setMainWindow(mainWindow)

  // Security: per-site permission policy (deny by default)
  setupPermissions()

  // The UI window itself must never navigate away or open windows.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (!devUrl || !url.startsWith(devUrl)) event.preventDefault()
  })

  setupApplicationMenu()

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    tabManager?.createTab()
  })

  // Load renderer UI
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    tabManager = null
    storageService = null
    downloadManager = null
  })
}

// Register all IPC handlers
function registerIpcHandlers(): void {
  // --- Tabs & Navigation ---
  handle('tab:create', (_event, url?: string) => tabManager?.createTab(url))
  handle('tab:duplicate', (_event, id?: string) => tabManager?.duplicateTab(id))
  handle('tab:switch', (_event, tabId: string) => tabManager?.switchTab(tabId))
  handle('tab:close', (_event, tabId?: string) => tabManager?.closeTab(tabId))
  handle('tab:close-others', (_event, tabId: string) =>
    tabManager?.closeOtherTabs(tabId)
  )
  handle('tab:navigate', (_event, tabId: string, input: string) =>
    tabManager?.navigate(tabId, input)
  )
  handle('tab:go-back', (_event, tabId?: string) => tabManager?.goBack(tabId))
  handle('tab:go-forward', (_event, tabId?: string) => tabManager?.goForward(tabId))
  handle('tab:reload', (_event, tabId?: string) => tabManager?.reload(tabId))
  handle('tab:reload-ignore-cache', (_event, tabId?: string) =>
    tabManager?.reloadIgnoringCache(tabId)
  )
  handle('tab:stop', (_event, tabId?: string) => tabManager?.stop(tabId))
  handle('tab:zoom-in', (_event, tabId?: string) => tabManager?.zoomIn(tabId))
  handle('tab:zoom-out', (_event, tabId?: string) => tabManager?.zoomOut(tabId))
  handle('tab:reset-zoom', (_event, tabId?: string) => tabManager?.resetZoom(tabId))
  handle('tab:toggle-mute', (_event, tabId?: string) => tabManager?.toggleMute(tabId))
  handle('tab:toggle-devtools', (_event, tabId?: string) =>
    tabManager?.toggleDevTools(tabId)
  )
  handle('tab:print', (_event, tabId?: string) => tabManager?.printPage(tabId))
  handle('tab:set-search-engine', (_event, engine: SearchEngine) => {
    if (isSearchEngine(engine)) tabManager?.setSearchEngine(engine)
  })
  handle('tab:get-state', () => {
    return (
      tabManager?.getState() ?? {
        tabs: [],
        activeTabId: '',
        activeSearchEngine: 'google'
      }
    )
  })

  // --- Find in Page ---
  handle(
    'find:start',
    (_event, text: string, forward: boolean, findNext: boolean) => {
      tabManager?.findInPage(text, forward, findNext)
    }
  )
  handle('find:stop', () => {
    tabManager?.stopFindInPage()
  })

  // --- Bookmarks ---
  handle('bookmarks:get', () => storageService?.getBookmarks() ?? [])
  handle('bookmarks:add', (_event, title: string, url: string, favicon?: string) => {
    return storageService?.addBookmark(title, url, favicon)
  })
  handle('bookmarks:remove', (_event, idOrUrl: string) => {
    return storageService?.removeBookmark(idOrUrl) ?? false
  })
  handle('bookmarks:is-bookmarked', (_event, url: string) => {
    return storageService?.isBookmarked(url) ?? false
  })

  // --- History ---
  handle('history:get', (_event, query?: string) => {
    return storageService?.getHistory(query) ?? []
  })
  handle('history:clear', () => {
    storageService?.clearHistory()
  })
  handle('history:remove', (_event, id: string) => {
    storageService?.removeHistoryItem(id)
  })

  // --- Downloads ---
  handle('downloads:get', () => downloadManager?.getDownloads() ?? [])
  handle('downloads:cancel', (_event, id: string) => downloadManager?.cancel(id))
  handle('downloads:pause', (_event, id: string) => downloadManager?.pause(id))
  handle('downloads:resume', (_event, id: string) => downloadManager?.resume(id))
  handle('downloads:open-folder', (_event, id: string) =>
    downloadManager?.openInFolder(id)
  )

  // --- Preferences ---
  handle('preferences:get', () => storageService?.getPreferences())
  handle('preferences:update', (_event, partial: unknown) => {
    // Input is sanitized inside StorageService; unknown keys and bad values are dropped.
    const updated = storageService?.updatePreferences(partial)
    if (updated) applyTheme(updated.theme)
    tabManager?.updateToolbarHeightFromPreferences()
    return updated
  })

  // --- Bookmark import / export ---
  handle('bookmarks:import', async () => {
    if (!mainWindow || !storageService) return 0
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import bookmarks',
      filters: [{ name: 'Bookmarks HTML', extensions: ['html', 'htm'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return 0
    try {
      const html = readFileSync(result.filePaths[0], 'utf-8')
      return storageService.importBookmarksHtml(html)
    } catch (e) {
      console.error('Bookmark import failed:', e)
      return 0
    }
  })
  handle('bookmarks:export', async () => {
    if (!mainWindow || !storageService) return false
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export bookmarks',
      defaultPath: 'astrix-bookmarks.html',
      filters: [{ name: 'Bookmarks HTML', extensions: ['html'] }]
    })
    if (result.canceled || !result.filePath) return false
    try {
      writeFileSync(result.filePath, storageService.exportBookmarksHtml(), 'utf-8')
      return true
    } catch (e) {
      console.error('Bookmark export failed:', e)
      return false
    }
  })

  // --- New tab page data ---
  handle('history:top-sites', (_event, limit?: number) =>
    storageService?.getTopSites(typeof limit === 'number' ? Math.min(Math.max(limit, 1), 20) : 8) ?? []
  )

  // --- Downloads housekeeping ---
  handle('downloads:clear-finished', () => downloadManager?.clearFinished())

  // --- Site permissions ---
  handle('permissions:list', () => storageService?.listSitePermissions() ?? [])
  handle('permissions:remove', (_event, origin: string, permission: string) => {
    if (typeof origin === 'string' && typeof permission === 'string' && originOf(origin)) {
      storageService?.removeSitePermission(origin, permission)
    }
  })
  handle('permissions:clear', () => storageService?.clearSitePermissions())

  // --- Clear browsing data ---
  handle(
    'data:clear',
    async (_event, options: { history?: boolean; cookies?: boolean; cache?: boolean; permissions?: boolean }) => {
      const opts = options ?? {}
      const ses = session.defaultSession
      if (opts.history === true) storageService?.clearHistory()
      if (opts.cookies === true) {
        await ses.clearStorageData({
          storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage']
        })
      }
      if (opts.cache === true) {
        await ses.clearCache()
      }
      if (opts.permissions === true) storageService?.clearSitePermissions()
      return true
    }
  )
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  if (!gotSingleInstanceLock) return
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
