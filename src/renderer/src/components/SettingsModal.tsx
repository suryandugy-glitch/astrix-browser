import React, { useEffect, useState } from 'react'
import type { UserPreferences, SitePermission } from '../../../main/storageService'
import type { SearchEngine } from '../../../main/types'

interface SettingsModalProps {
  preferences: UserPreferences
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void
  onClose: () => void
  onBookmarksChanged: () => void
}

type Theme = UserPreferences['theme']

const THEME_LABELS: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System' }
]

function isValidHomepage(value: string): boolean {
  const v = value.trim()
  if (v === 'astrix://newtab') return true
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
  onBookmarksChanged
}) => {
  const [homepage, setHomepage] = useState(preferences.homepage)
  const [homepageError, setHomepageError] = useState('')
  const [permissions, setPermissions] = useState<SitePermission[]>([])
  const [clear, setClear] = useState({ history: true, cookies: false, cache: false, permissions: false })
  const [note, setNote] = useState('')

  useEffect(() => {
    window.astrixAPI?.listSitePermissions().then(setPermissions)
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const commitHomepage = (): void => {
    const value = homepage.trim()
    if (value === preferences.homepage) {
      setHomepageError('')
      return
    }
    if (!isValidHomepage(value)) {
      setHomepageError('Enter astrix://newtab or a full http(s):// address.')
      return
    }
    setHomepageError('')
    onUpdatePreferences({ homepage: value })
  }

  const handleClearData = async (): Promise<void> => {
    const chosen = Object.entries(clear)
      .filter(([, v]) => v)
      .map(([k]) => k)
    if (chosen.length === 0) {
      setNote('Select at least one item to clear.')
      return
    }
    if (!confirm(`Clear: ${chosen.join(', ')}? This cannot be undone.`)) return
    await window.astrixAPI?.clearBrowsingData(clear)
    if (clear.permissions) setPermissions([])
    setNote('Selected browsing data was cleared.')
  }

  const handleRemovePermission = async (p: SitePermission): Promise<void> => {
    await window.astrixAPI?.removeSitePermission(p.origin, p.permission)
    setPermissions((prev) =>
      prev.filter((x) => !(x.origin === p.origin && x.permission === p.permission))
    )
  }

  const handleImport = async (): Promise<void> => {
    const added = await window.astrixAPI?.importBookmarks()
    onBookmarksChanged()
    setNote(added ? `Imported ${added} new bookmark${added === 1 ? '' : 's'}.` : 'No new bookmarks were imported.')
  }

  const handleExport = async (): Promise<void> => {
    const ok = await window.astrixAPI?.exportBookmarks()
    if (ok) setNote('Bookmarks exported.')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="modal-content-list settings-body">
          <div className="settings-section-title">Appearance</div>
          <div className="setting-group">
            <label className="setting-label" id="theme-label">
              Theme
            </label>
            <div className="theme-options" role="radiogroup" aria-labelledby="theme-label">
              {THEME_LABELS.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={preferences.theme === t.id}
                  className={`theme-chip ${preferences.theme === t.id ? 'active' : ''}`}
                  onClick={() => onUpdatePreferences({ theme: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group toggle-group">
            <div>
              <label className="setting-label" htmlFor="bm-bar-toggle">
                Show Bookmarks Bar
              </label>
              <p className="setting-desc">Display the bookmarks bar beneath the main navigation bar.</p>
            </div>
            <input
              id="bm-bar-toggle"
              type="checkbox"
              className="setting-toggle"
              checked={preferences.showBookmarksBar}
              onChange={(e) => onUpdatePreferences({ showBookmarksBar: e.target.checked })}
            />
          </div>

          <div className="settings-section-title">Search & Startup</div>
          <div className="setting-group">
            <label className="setting-label" htmlFor="search-engine">
              Default Search Engine
            </label>
            <p className="setting-desc">Used when you type a search in the address bar.</p>
            <select
              id="search-engine"
              className="setting-select"
              value={preferences.searchEngine}
              onChange={(e) => onUpdatePreferences({ searchEngine: e.target.value as SearchEngine })}
            >
              <option value="google">Google (Default)</option>
              <option value="duckduckgo">DuckDuckGo (Privacy Focused)</option>
              <option value="brave">Brave Search</option>
              <option value="bing">Microsoft Bing</option>
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label" htmlFor="homepage">
              On Startup / New Tab
            </label>
            <p className="setting-desc">Page opened in a new tab. Press Enter or click away to save.</p>
            <input
              id="homepage"
              type="text"
              className="setting-input"
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              onBlur={commitHomepage}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitHomepage()
              }}
              placeholder="astrix://newtab or https://example.com"
              aria-invalid={homepageError !== ''}
            />
            {homepageError && <div className="setting-error">{homepageError}</div>}
          </div>

          <div className="settings-section-title">Bookmarks</div>
          <div className="setting-group">
            <p className="setting-desc">Import from or export to a standard bookmarks HTML file.</p>
            <div className="setting-row-buttons">
              <button className="btn-secondary" onClick={handleImport}>
                Import…
              </button>
              <button className="btn-secondary" onClick={handleExport}>
                Export…
              </button>
            </div>
          </div>

          <div className="settings-section-title">Privacy</div>
          <div className="setting-group">
            <label className="setting-label">Clear Browsing Data</label>
            <p className="setting-desc">Choose what to remove.</p>
            {(
              [
                ['history', 'Browsing history'],
                ['cookies', 'Cookies and site data'],
                ['cache', 'Cached files'],
                ['permissions', 'Site permissions']
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="setting-check">
                <input
                  type="checkbox"
                  checked={clear[key]}
                  onChange={(e) => setClear((prev) => ({ ...prev, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
            <div className="setting-row-buttons">
              <button className="btn-danger" onClick={handleClearData}>
                Clear Selected Data
              </button>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Site Permissions</label>
            <p className="setting-desc">
              Sites are denied camera, microphone, location and notifications by default.
            </p>
            {permissions.length === 0 ? (
              <p className="setting-desc">No site-specific permissions are stored.</p>
            ) : (
              permissions.map((p) => (
                <div key={`${p.origin}-${p.permission}`} className="perm-row">
                  <span className="perm-origin">{p.origin}</span>
                  <span className="perm-name">
                    {p.permission}: {p.decision}
                  </span>
                  <button className="btn-secondary" onClick={() => handleRemovePermission(p)}>
                    Reset
                  </button>
                </div>
              ))
            )}
          </div>

          {note && (
            <div className="setting-note" role="status">
              {note}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
