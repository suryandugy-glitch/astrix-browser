import { app, BrowserWindow, ipcMain, session, Menu } from 'electron'
import { join } from 'path'
import { TabManager } from './tabManager'
import { SearchEngine } from './types'

let mainWindow: BrowserWindow | null = null
let tabManager: TabManager | null = null

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
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => tabManager?.closeTab()
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
        { role: 'selectAll' }
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

  tabManager = new TabManager(mainWindow)

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
  })
}

// Register IPC handlers for tab operations
function registerIpcHandlers(): void {
  ipcMain.handle('tab:create', (_event, url?: string) => {
    return tabManager?.createTab(url)
  })

  ipcMain.handle('tab:switch', (_event, tabId: string) => {
    tabManager?.switchTab(tabId)
  })

  ipcMain.handle('tab:close', (_event, tabId?: string) => {
    tabManager?.closeTab(tabId)
  })

  ipcMain.handle('tab:navigate', (_event, tabId: string, input: string) => {
    tabManager?.navigate(tabId, input)
  })

  ipcMain.handle('tab:go-back', (_event, tabId?: string) => {
    tabManager?.goBack(tabId)
  })

  ipcMain.handle('tab:go-forward', (_event, tabId?: string) => {
    tabManager?.goForward(tabId)
  })

  ipcMain.handle('tab:reload', (_event, tabId?: string) => {
    tabManager?.reload(tabId)
  })

  ipcMain.handle('tab:reload-ignore-cache', (_event, tabId?: string) => {
    tabManager?.reloadIgnoringCache(tabId)
  })

  ipcMain.handle('tab:stop', (_event, tabId?: string) => {
    tabManager?.stop(tabId)
  })

  ipcMain.handle('tab:zoom-in', (_event, tabId?: string) => {
    tabManager?.zoomIn(tabId)
  })

  ipcMain.handle('tab:zoom-out', (_event, tabId?: string) => {
    tabManager?.zoomOut(tabId)
  })

  ipcMain.handle('tab:reset-zoom', (_event, tabId?: string) => {
    tabManager?.resetZoom(tabId)
  })

  ipcMain.handle('tab:toggle-mute', (_event, tabId?: string) => {
    tabManager?.toggleMute(tabId)
  })

  ipcMain.handle('tab:toggle-devtools', (_event, tabId?: string) => {
    tabManager?.toggleDevTools(tabId)
  })

  ipcMain.handle('tab:set-search-engine', (_event, engine: SearchEngine) => {
    tabManager?.setSearchEngine(engine)
  })

  ipcMain.handle('tab:get-state', () => {
    return (
      tabManager?.getState() ?? {
        tabs: [],
        activeTabId: '',
        activeSearchEngine: 'google'
      }
    )
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
