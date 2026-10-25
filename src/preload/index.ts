import { contextBridge, ipcRenderer } from 'electron'
import { Tab, TabState, SearchEngine } from '../main/types'

const astrixAPI = {
  createTab: (url?: string): Promise<Tab> => {
    return ipcRenderer.invoke('tab:create', url)
  },

  switchTab: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke('tab:switch', tabId)
  },

  closeTab: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:close', tabId)
  },

  navigate: (tabId: string, input: string): Promise<void> => {
    return ipcRenderer.invoke('tab:navigate', tabId, input)
  },

  goBack: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:go-back', tabId)
  },

  goForward: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:go-forward', tabId)
  },

  reload: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:reload', tabId)
  },

  reloadIgnoringCache: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:reload-ignore-cache', tabId)
  },

  stop: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:stop', tabId)
  },

  zoomIn: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:zoom-in', tabId)
  },

  zoomOut: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:zoom-out', tabId)
  },

  resetZoom: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:reset-zoom', tabId)
  },

  toggleMute: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:toggle-mute', tabId)
  },

  toggleDevTools: (tabId?: string): Promise<void> => {
    return ipcRenderer.invoke('tab:toggle-devtools', tabId)
  },

  setSearchEngine: (engine: SearchEngine): Promise<void> => {
    return ipcRenderer.invoke('tab:set-search-engine', engine)
  },

  getState: (): Promise<TabState> => {
    return ipcRenderer.invoke('tab:get-state')
  },

  onTabsUpdated: (callback: (state: TabState) => void): (() => void) => {
    const handler = (_event: any, state: TabState) => callback(state)
    ipcRenderer.on('tab:state-changed', handler)
    return () => {
      ipcRenderer.removeListener('tab:state-changed', handler)
    }
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
