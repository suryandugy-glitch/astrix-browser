import { app, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { TabManager } from './tabManager'

let mainWindow: BrowserWindow | null = null
let tabManager: TabManager | null = null

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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Open default initial tab
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

  ipcMain.handle('tab:close', (_event, tabId: string) => {
    tabManager?.closeTab(tabId)
  })

  ipcMain.handle('tab:navigate', (_event, tabId: string, input: string) => {
    tabManager?.navigate(tabId, input)
  })

  ipcMain.handle('tab:go-back', (_event, tabId: string) => {
    tabManager?.goBack(tabId)
  })

  ipcMain.handle('tab:go-forward', (_event, tabId: string) => {
    tabManager?.goForward(tabId)
  })

  ipcMain.handle('tab:reload', (_event, tabId: string) => {
    tabManager?.reload(tabId)
  })

  ipcMain.handle('tab:stop', (_event, tabId: string) => {
    tabManager?.stop(tabId)
  })

  ipcMain.handle('tab:get-state', () => {
    return tabManager?.getState() ?? { tabs: [], activeTabId: '' }
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
