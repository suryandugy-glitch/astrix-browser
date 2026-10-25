import React, { useState, useEffect } from 'react'
import { Tab } from '../../../main/types'

interface ToolbarProps {
  activeTab?: Tab
  onNavigate: (input: string) => void
  onGoBack: () => void
  onGoForward: () => void
  onReload: () => void
  onStop: () => void
  onHome: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTab,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onHome
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
        title="Click to go back"
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
        title="Click to go forward"
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
        <button className="toolbar-btn" onClick={onReload} title="Reload this page">
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
          {isSecure ? (
            <svg
              className="omnibox-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              title="Secure Connection"
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

          <input
            type="text"
            className="omnibox-input"
            value={addressInput}
            placeholder="Search with Google or enter web address"
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => setAddressInput(e.target.value)}
          />
        </div>

        {activeTab?.isLoading && <div className="loading-bar" />}
      </form>
    </div>
  )
}
