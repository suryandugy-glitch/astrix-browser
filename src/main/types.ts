export type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'brave'

export interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  zoomFactor: number
  isAudible: boolean
  isMuted: boolean
}

export interface TabState {
  tabs: Tab[]
  activeTabId: string
  activeSearchEngine: SearchEngine
}
