import React, { useState, useEffect } from 'react'
import type { Tab } from '../../../main/types'

interface ToolbarProps {
  activeTab?: Tab
  isBookmarked: boolean
  activeDownloadCount: number
  onNavigate: (input: string) => void
  onGoBack: () => void
  onGoForward: () => void
  onReload: () => void
  onStop: () => void
  onHome: () => void
  onToggleBookmark: () => void
  onToggleSiteInfo: () => void
  onOpenHistory: () => void
  onOpenDownloads: () => void
  onOpenSettings: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTab,
  isBookmarked,
  activeDownloadCount,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onHome,
  onToggleBookmark,
  onToggleSiteInfo,
  onOpenHistory,
  onOpenDownloads,
  onOpenSettings
}) => {
  const [addressInput, setAddressInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Sync input text with active tab's URL when not currently editing
  useEffect(() => {
    if (!isEditing && activeTab) {
      if (activeTab.url === 'astrix://newtab') {
        setAddressInput('')
      } else {
        setAddressInput(activeTab.url)
      }
    }
  }, [activeTab?.url, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(false)
    if (addressInput.trim()) {
      onNavigate(addressInput.trim())
    }
  }

  const isSecure = activeTab?.url.startsWith('https://')

  return (
    <div className="toolbar-container">
      {/* Back button */}
      <button
        className="toolbar-btn"
        disabled={!activeTab?.canGoBack}
        onClick={onGoBack}
        title="Click to go back (Alt+Left)"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Forward button */}
      <button
        className="toolbar-btn"
        disabled={!activeTab?.canGoForward}
        onClick={onGoForward}
        title="Click to go forward (Alt+Right)"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Reload / Stop button */}
      {activeTab?.isLoading ? (
        <button className="toolbar-btn" onClick={onStop} title="Stop loading this page">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <button className="toolbar-btn" onClick={onReload} title="Reload this page (Ctrl+R)">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      )}

      {/* Home button */}
      <button className="toolbar-btn" onClick={onHome} title="Open Start page">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {/* Omnibox / Address bar */}
      <form className="omnibox-form" onSubmit={handleSubmit}>
        <div className="omnibox-wrapper">
          {/* Site Security Info lock button */}
          <button
            type="button"
            className="omnibox-badge-btn"
            onClick={onToggleSiteInfo}
            title={isSecure ? 'Connection is secure' : 'Site Information'}
          >
            {isSecure ? (
              <svg
                className="omnibox-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg
                className="omnibox-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>

          <input
            type="text"
            className="omnibox-input"
            value={addressInput}
            placeholder="Search with Google, DuckDuckGo or enter web address"
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => setAddressInput(e.target.value)}
          />

          {/* Bookmark Star Button */}
          {activeTab && activeTab.url !== 'astrix://newtab' && (
            <button
              type="button"
              className={`star-btn ${isBookmarked ? 'bookmarked' : ''}`}
              title={isBookmarked ? 'Remove bookmark (Ctrl+D)' : 'Bookmark this tab (Ctrl+D)'}
              onClick={onToggleBookmark}
            >
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill={isBookmarked ? '#fbbf24' : 'none'}
                stroke={isBookmarked ? '#fbbf24' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
        </div>

        {activeTab?.isLoading && <div className="loading-bar" />}
      </form>

      {/* Downloads button */}
      <button
        className="toolbar-btn relative-btn"
        onClick={onOpenDownloads}
        title="Downloads (Ctrl+J)"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {activeDownloadCount > 0 && <span className="dl-badge">{activeDownloadCount}</span>}
      </button>

      {/* History button */}
      <button className="toolbar-btn" onClick={onOpenHistory} title="History (Ctrl+H)">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Settings button */}
      <button className="toolbar-btn" onClick={onOpenSettings} title="Settings">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  )
}
