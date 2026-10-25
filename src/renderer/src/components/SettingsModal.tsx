import React from 'react'
import { UserPreferences } from '../../../main/storageService'
import { SearchEngine } from '../../../main/types'

interface SettingsModalProps {
  preferences: UserPreferences
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content-list settings-body">
          {/* Search Engine */}
          <div className="setting-group">
            <label className="setting-label">Default Search Engine</label>
            <p className="setting-desc">
              Search engine used when entering queries in the omnibox address bar.
            </p>
            <select
              className="setting-select"
              value={preferences.searchEngine}
              onChange={(e) =>
                onUpdatePreferences({ searchEngine: e.target.value as SearchEngine })
              }
            >
              <option value="google">Google (Default)</option>
              <option value="duckduckgo">DuckDuckGo (Privacy Focused)</option>
              <option value="brave">Brave Search</option>
              <option value="bing">Microsoft Bing</option>
            </select>
          </div>

          {/* Bookmarks Bar Visibility */}
          <div className="setting-group toggle-group">
            <div>
              <label className="setting-label">Show Bookmarks Bar</label>
              <p className="setting-desc">Display the bookmarks bar beneath the main navigation bar.</p>
            </div>
            <input
              type="checkbox"
              className="setting-toggle"
              checked={preferences.showBookmarksBar}
              onChange={(e) => onUpdatePreferences({ showBookmarksBar: e.target.checked })}
            />
          </div>

          {/* Homepage */}
          <div className="setting-group">
            <label className="setting-label">On Startup / New Tab</label>
            <p className="setting-desc">Initial page loaded when opening a new tab.</p>
            <input
              type="text"
              className="setting-input"
              value={preferences.homepage}
              onChange={(e) => onUpdatePreferences({ homepage: e.target.value })}
              placeholder="astrix://newtab or custom URL"
            />
          </div>

          {/* Clear Browsing Data */}
          <div className="setting-group">
            <label className="setting-label">Privacy & Browsing Data</label>
            <p className="setting-desc">Clear browsing history, cached pages, and cookies.</p>
            <button
              className="btn-danger"
              onClick={async () => {
                if (confirm('Clear entire browsing history and cache?')) {
                  if (window.astrixAPI) {
                    await window.astrixAPI.clearHistory()
                    alert('Browsing history cleared successfully.')
                  }
                }
              }}
            >
              Clear Browsing Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
