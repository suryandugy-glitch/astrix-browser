import { Tab, TabState } from '../main/types'

export interface AstrixAPI {
  createTab: (url?: string) => Promise<Tab>
  switchTab: (tabId: string) => Promise<void>
  closeTab: (tabId: string) => Promise<void>
  navigate: (tabId: string, input: string) => Promise<void>
  goBack: (tabId: string) => Promise<void>
  goForward: (tabId: string) => Promise<void>
  reload: (tabId: string) => Promise<void>
  stop: (tabId: string) => Promise<void>
  getState: () => Promise<TabState>
  onTabsUpdated: (callback: (state: TabState) => void) => () => void
}

declare global {
  interface Window {
    astrixAPI: AstrixAPI
  }
}
