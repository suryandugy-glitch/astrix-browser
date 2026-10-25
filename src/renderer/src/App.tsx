import React, { useEffect, useState } from 'react'
import { Tab, TabState } from '../../main/types'
import { TabBar } from './components/TabBar'
import { Toolbar } from './components/Toolbar'
import { NewTabPage } from './components/NewTabPage'

export const App: React.FC = () => {
  const [tabState, setTabState] = useState<TabState>({
    tabs: [],
    activeTabId: '',
    activeSearchEngine: 'google'
  })

  useEffect(() => {
    // If running inside Electron with astrixAPI exposed
    if (window.astrixAPI) {
      window.astrixAPI.getState().then((state) => {
        if (state && state.tabs.length > 0) {
          setTabState(state)
        }
      })

      const unsubscribe = window.astrixAPI.onTabsUpdated((newState) => {
        setTabState(newState)
      })

      return () => {
        unsubscribe?.()
      }
    } else {
      // Fallback preview state if launched outside Electron
      setTabState({
        tabs: [
          {
            id: 'mock-1',
            title: 'New Tab',
            url: 'astrix://newtab',
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            zoomFactor: 1.0,
            isAudible: false,
            isMuted: false
          }
        ],
        activeTabId: 'mock-1',
        activeSearchEngine: 'google'
      })
    }
  }, [])

  const activeTab = tabState.tabs.find((t) => t.id === tabState.activeTabId)

  const handleCreateTab = (url?: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.createTab(url)
    } else {
      const newTab: Tab = {
        id: `mock-${Date.now()}`,
        title: url ? 'Loading...' : 'New Tab',
        url: url || 'astrix://newtab',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        zoomFactor: 1.0,
        isAudible: false,
        isMuted: false
      }
      setTabState((prev) => ({
        ...prev,
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id
      }))
    }
  }

  const handleSwitchTab = (tabId: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.switchTab(tabId)
    } else {
      setTabState((prev) => ({ ...prev, activeTabId: tabId }))
    }
  }

  const handleCloseTab = (tabId: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.closeTab(tabId)
    } else {
      setTabState((prev) => {
        const filtered = prev.tabs.filter((t) => t.id !== tabId)
        return {
          ...prev,
          tabs: filtered,
          activeTabId: filtered.length > 0 ? filtered[0].id : ''
        }
      })
    }
  }

  const handleNavigate = (input: string) => {
    if (!tabState.activeTabId) return
    if (window.astrixAPI) {
      window.astrixAPI.navigate(tabState.activeTabId, input)
    } else {
      setTabState((prev) => ({
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.id === prev.activeTabId ? { ...t, url: input, title: input } : t
        )
      }))
    }
  }

  const handleGoBack = () => {
    if (tabState.activeTabId && window.astrixAPI) {
      window.astrixAPI.goBack(tabState.activeTabId)
    }
  }

  const handleGoForward = () => {
    if (tabState.activeTabId && window.astrixAPI) {
      window.astrixAPI.goForward(tabState.activeTabId)
    }
  }

  const handleReload = () => {
    if (tabState.activeTabId && window.astrixAPI) {
      window.astrixAPI.reload(tabState.activeTabId)
    }
  }

  const handleStop = () => {
    if (tabState.activeTabId && window.astrixAPI) {
      window.astrixAPI.stop(tabState.activeTabId)
    }
  }

  const handleHome = () => {
    handleNavigate('astrix://newtab')
  }

  const isShowingNewTab = !activeTab || activeTab.url === 'astrix://newtab'

  return (
    <>
      <header className="browser-header">
        <TabBar
          tabs={tabState.tabs}
          activeTabId={tabState.activeTabId}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onNewTab={() => handleCreateTab()}
        />
        <Toolbar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onReload={handleReload}
          onStop={handleStop}
          onHome={handleHome}
        />
      </header>

      {/* When active tab is on astrix://newtab, show the rich new-tab page */}
      {isShowingNewTab && <NewTabPage onNavigate={handleNavigate} />}
    </>
  )
}
