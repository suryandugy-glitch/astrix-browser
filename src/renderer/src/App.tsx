import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { TabState } from '../../main/types'
import type { Bookmark, UserPreferences } from '../../main/storageService'
import type { DownloadRecord } from '../../main/downloadManager'
import type { FindResult } from '../../preload/index.d'
import { TabBar } from './components/TabBar'
import { Toolbar } from './components/Toolbar'
import { BookmarksBar } from './components/BookmarksBar'
import { FindInPage } from './components/FindInPage'
import { HistoryModal } from './components/HistoryModal'
import { DownloadsModal } from './components/DownloadsModal'
import { SettingsModal } from './components/SettingsModal'
import { SiteInfoModal } from './components/SiteInfoModal'
import { NewTabPage } from './components/NewTabPage'

const DEFAULT_PREFERENCES: UserPreferences = {
  searchEngine: 'google',
  showBookmarksBar: true,
  homepage: 'astrix://newtab',
  theme: 'dark'
}

export const App: React.FC = () => {
  const [tabState, setTabState] = useState<TabState>({
    tabs: [],
    activeTabId: '',
    activeSearchEngine: 'google'
  })

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)

  // Always points at the latest toggle handler, so the menu shortcut (Ctrl+D) never uses stale state.
  const toggleBookmarkRef = useRef<() => void>(() => undefined)

  // Apply the theme to <html>. "system" follows the OS setting live.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (): void => {
      const effective =
        preferences.theme === 'system' ? (media.matches ? 'dark' : 'light') : preferences.theme
      document.documentElement.setAttribute('data-theme', effective)
    }
    apply()
    if (preferences.theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
    return undefined
  }, [preferences.theme])

  // Modals & Panels
  const [showHistory, setShowHistory] = useState(false)
  const [showDownloads, setShowDownloads] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSiteInfo, setShowSiteInfo] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [findResult, setFindResult] = useState<FindResult>({
    activeMatchOrdinal: 0,
    matches: 0,
    finalUpdate: true
  })

  // Initial data loading
  useEffect(() => {
    if (window.astrixAPI) {
      window.astrixAPI.getState().then((state) => {
        if (state && state.tabs.length > 0) setTabState(state)
      })

      window.astrixAPI.getBookmarks().then(setBookmarks)
      window.astrixAPI.getDownloads().then(setDownloads)
      window.astrixAPI.getPreferences().then((p) => {
        if (p) setPreferences(p)
      })

      // Subscriptions
      const unsubTabs = window.astrixAPI.onTabsUpdated((newState) => {
        setTabState(newState)
      })

      const unsubDl = window.astrixAPI.onDownloadsUpdated((newDls) => {
        setDownloads(newDls)
      })

      const unsubFindRes = window.astrixAPI.onFindResult((res) => {
        setFindResult(res)
      })

      const unsubFindToggle = window.astrixAPI.onFindToggle(() => {
        setShowFind((prev) => !prev)
      })

      const unsubHistoryToggle = window.astrixAPI.onHistoryToggle(() => {
        setShowHistory((prev) => !prev)
      })

      const unsubBookmarkToggle = window.astrixAPI.onBookmarkToggle(() => {
        toggleBookmarkRef.current()
      })

      const unsubPrefs = window.astrixAPI.onPreferencesChanged((p) => {
        setPreferences(p)
      })

      return () => {
        unsubTabs?.()
        unsubDl?.()
        unsubFindRes?.()
        unsubFindToggle?.()
        unsubHistoryToggle?.()
        unsubBookmarkToggle?.()
        unsubPrefs?.()
      }
    } else {
      // Fallback preview
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
  const isBookmarked = activeTab
    ? bookmarks.some((b) => b.url === activeTab.url)
    : false

  const activeDownloadCount = downloads.filter((d) => d.state === 'progressing').length

  // --- Handlers ---
  const handleCreateTab = (url?: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.createTab(url)
    }
  }

  const handleDuplicateTab = (id: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.duplicateTab(id)
    }
  }

  const handleSwitchTab = (tabId: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.switchTab(tabId)
    }
  }

  const handleCloseTab = (tabId: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.closeTab(tabId)
    }
  }

  const handleCloseOtherTabs = (tabId: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.closeOtherTabs(tabId)
    }
  }

  const handleNavigate = (input: string) => {
    if (!tabState.activeTabId) return
    if (window.astrixAPI) {
      window.astrixAPI.navigate(tabState.activeTabId, input)
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

  const handleToggleMute = (tabId: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.toggleMute(tabId)
    }
  }

  const handleHome = () => {
    handleNavigate(preferences.homepage || 'astrix://newtab')
  }

  // Bookmarks
  const handleToggleBookmark = useCallback(async () => {
    if (!activeTab || activeTab.url === 'astrix://newtab' || !window.astrixAPI) return

    if (isBookmarked) {
      await window.astrixAPI.removeBookmark(activeTab.url)
    } else {
      await window.astrixAPI.addBookmark(
        activeTab.title || activeTab.url,
        activeTab.url,
        activeTab.favicon
      )
    }
    const updated = await window.astrixAPI.getBookmarks()
    setBookmarks(updated)
  }, [activeTab, isBookmarked])

  toggleBookmarkRef.current = () => {
    void handleToggleBookmark()
  }

  const refreshBookmarks = useCallback(async () => {
    if (window.astrixAPI) setBookmarks(await window.astrixAPI.getBookmarks())
  }, [])

  const handleRemoveBookmark = async (id: string) => {
    if (window.astrixAPI) {
      await window.astrixAPI.removeBookmark(id)
      setBookmarks((prev) => prev.filter((b) => b.id !== id))
    }
  }

  // Preferences
  const handleUpdatePreferences = async (partial: Partial<UserPreferences>) => {
    if (window.astrixAPI) {
      const updated = await window.astrixAPI.updatePreferences(partial)
      setPreferences(updated)
    }
  }

  // Find in page
  const handleFind = (text: string, forward: boolean, findNext: boolean) => {
    if (window.astrixAPI) {
      window.astrixAPI.findStart(text, forward, findNext)
    }
  }

  const handleCloseFind = () => {
    setShowFind(false)
    if (window.astrixAPI) {
      window.astrixAPI.findStop()
    }
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
          onDuplicateTab={handleDuplicateTab}
          onCloseOtherTabs={handleCloseOtherTabs}
          onReloadTab={(id) => window.astrixAPI?.reload(id)}
          onToggleMute={handleToggleMute}
        />
        <Toolbar
          activeTab={activeTab}
          isBookmarked={isBookmarked}
          activeDownloadCount={activeDownloadCount}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onReload={handleReload}
          onStop={handleStop}
          onHome={handleHome}
          onToggleBookmark={handleToggleBookmark}
          onToggleSiteInfo={() => setShowSiteInfo((prev) => !prev)}
          onOpenHistory={() => setShowHistory(true)}
          onOpenDownloads={() => setShowDownloads(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
        {preferences.showBookmarksBar && bookmarks.length > 0 && (
          <BookmarksBar
            bookmarks={bookmarks}
            onNavigate={handleNavigate}
            onRemoveBookmark={handleRemoveBookmark}
          />
        )}
      </header>

      {/* Floating Find in Page Bar */}
      {showFind && (
        <FindInPage
          onFind={handleFind}
          onClose={handleCloseFind}
          findResult={findResult}
        />
      )}

      {/* Site Info Card */}
      {showSiteInfo && activeTab && (
        <SiteInfoModal
          url={activeTab.url}
          title={activeTab.title}
          onClose={() => setShowSiteInfo(false)}
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onNavigate={handleNavigate}
        />
      )}

      {/* Downloads Modal */}
      {showDownloads && (
        <DownloadsModal
          onClose={() => setShowDownloads(false)}
          downloads={downloads}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onBookmarksChanged={refreshBookmarks}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* When active tab is on astrix://newtab, show the rich new-tab page */}
      {isShowingNewTab && <NewTabPage onNavigate={handleNavigate} />}
    </>
  )
}
