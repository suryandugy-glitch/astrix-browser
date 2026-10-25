import { app, BrowserWindow, ipcMain, session, Menu } from 'electron'
import { join } from 'path'
import { TabManager } from './tabManager'
import { StorageService, UserPreferences } from './storageService'
import { DownloadManager } from './downloadManager'
import { SearchEngine } from './types'

let mainWindow: BrowserWindow | null = null
let tabManager: TabManager | null = null
let storageService: StorageService | null = null
let downloadManager: DownloadManager | null = null

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
  storageService = new StorageService()
  downloadManager = new DownloadManager()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 700,
    minHeight: 500,
    title: 'Astrix Browser',
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1e24',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  tabManager = new TabManager(mainWindow, storageService)
  downloadManager.setMainWindow(mainWindow)

  // Security: Deny unreviewed permission requests by default
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
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
  ipcMain.handle('tab:create', (_event, url?: string) => tabManager?.createTab(url))
  ipcMain.handle('tab:duplicate', (_event, id?: string) => tabManager?.duplicateTab(id))
  ipcMain.handle('tab:switch', (_event, tabId: string) => tabManager?.switchTab(tabId))
  ipcMain.handle('tab:close', (_event, tabId?: string) => tabManager?.closeTab(tabId))
  ipcMain.handle('tab:close-others', (_event, tabId: string) =>
    tabManager?.closeOtherTabs(tabId)
  )
  ipcMain.handle('tab:navigate', (_event, tabId: string, input: string) =>
    tabManager?.navigate(tabId, input)
  )
  ipcMain.handle('tab:go-back', (_event, tabId?: string) => tabManager?.goBack(tabId))
  ipcMain.handle('tab:go-forward', (_event, tabId?: string) => tabManager?.goForward(tabId))
  ipcMain.handle('tab:reload', (_event, tabId?: string) => tabManager?.reload(tabId))
  ipcMain.handle('tab:reload-ignore-cache', (_event, tabId?: string) =>
    tabManager?.reloadIgnoringCache(tabId)
  )
  ipcMain.handle('tab:stop', (_event, tabId?: string) => tabManager?.stop(tabId))
  ipcMain.handle('tab:zoom-in', (_event, tabId?: string) => tabManager?.zoomIn(tabId))
  ipcMain.handle('tab:zoom-out', (_event, tabId?: string) => tabManager?.zoomOut(tabId))
  ipcMain.handle('tab:reset-zoom', (_event, tabId?: string) => tabManager?.resetZoom(tabId))
  ipcMain.handle('tab:toggle-mute', (_event, tabId?: string) => tabManager?.toggleMute(tabId))
  ipcMain.handle('tab:toggle-devtools', (_event, tabId?: string) =>
    tabManager?.toggleDevTools(tabId)
  )
  ipcMain.handle('tab:print', (_event, tabId?: string) => tabManager?.printPage(tabId))
  ipcMain.handle('tab:set-search-engine', (_event, engine: SearchEngine) =>
    tabManager?.setSearchEngine(engine)
  )
  ipcMain.handle('tab:get-state', () => {
    return (
      tabManager?.getState() ?? {
        tabs: [],
        activeTabId: '',
        activeSearchEngine: 'google'
      }
    )
  })

  // --- Find in Page ---
  ipcMain.handle(
    'find:start',
    (_event, text: string, forward: boolean, findNext: boolean) => {
      tabManager?.findInPage(text, forward, findNext)
    }
  )
  ipcMain.handle('find:stop', () => {
    tabManager?.stopFindInPage()
  })

  // --- Bookmarks ---
  ipcMain.handle('bookmarks:get', () => storageService?.getBookmarks() ?? [])
  ipcMain.handle('bookmarks:add', (_event, title: string, url: string, favicon?: string) => {
    return storageService?.addBookmark(title, url, favicon)
  })
  ipcMain.handle('bookmarks:remove', (_event, idOrUrl: string) => {
    return storageService?.removeBookmark(idOrUrl) ?? false
  })
  ipcMain.handle('bookmarks:is-bookmarked', (_event, url: string) => {
    return storageService?.isBookmarked(url) ?? false
  })

  // --- History ---
  ipcMain.handle('history:get', (_event, query?: string) => {
    return storageService?.getHistory(query) ?? []
  })
  ipcMain.handle('history:clear', () => {
    storageService?.clearHistory()
  })
  ipcMain.handle('history:remove', (_event, id: string) => {
    storageService?.removeHistoryItem(id)
  })

  // --- Downloads ---
  ipcMain.handle('downloads:get', () => downloadManager?.getDownloads() ?? [])
  ipcMain.handle('downloads:cancel', (_event, id: string) => downloadManager?.cancel(id))
  ipcMain.handle('downloads:pause', (_event, id: string) => downloadManager?.pause(id))
  ipcMain.handle('downloads:resume', (_event, id: string) => downloadManager?.resume(id))
  ipcMain.handle('downloads:open-folder', (_event, id: string) =>
    downloadManager?.openInFolder(id)
  )

  // --- Preferences ---
  ipcMain.handle('preferences:get', () => storageService?.getPreferences())
  ipcMain.handle('preferences:update', (_event, partial: Partial<UserPreferences>) => {
    const updated = storageService?.updatePreferences(partial)
    tabManager?.updateToolbarHeightFromPreferences()
    return updated
  })
}

app.whenReady().then(() => {
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
