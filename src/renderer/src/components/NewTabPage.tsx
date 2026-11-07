import React, { useEffect, useState } from 'react'
import type { TopSite } from '../../../preload/index.d'

interface NewTabPageProps {
  onNavigate: (input: string) => void
}

interface Shortcut {
  name: string
  url: string
  icon?: string
  favicon?: string
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚' },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: '🤖' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '📰' },
  { name: 'MDN Web', url: 'https://developer.mozilla.org', icon: '🌐' },
  { name: 'Electron Docs', url: 'https://www.electronjs.org', icon: '⚡' }
]

function hostLabel(site: TopSite): string {
  try {
    return new URL(site.url).hostname.replace(/^www\./, '')
  } catch {
    return site.title || site.url
  }
}

const ShortcutCard: React.FC<{ item: Shortcut; onOpen: (url: string) => void }> = ({ item, onOpen }) => (
  <div
    className="shortcut-card"
    role="link"
    tabIndex={0}
    onClick={() => onOpen(item.url)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen(item.url)
      }
    }}
    title={item.url}
  >
    <div className="shortcut-icon">
      {item.favicon ? (
        <img
          className="shortcut-favicon"
          src={item.favicon}
          alt=""
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        item.icon
      )}
    </div>
    <span className="shortcut-label">{item.name}</span>
  </div>
)

export const NewTabPage: React.FC<NewTabPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('')
  const [topSites, setTopSites] = useState<Shortcut[]>([])

  useEffect(() => {
    let cancelled = false
    window.astrixAPI
      ?.getTopSites(8)
      .then((sites) => {
        if (cancelled) return
        setTopSites(
          sites.map((s) => ({
            name: hostLabel(s),
            url: s.url,
            icon: '🌐',
            favicon: s.favicon
          }))
        )
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    if (query.trim()) onNavigate(query.trim())
  }

  return (
    <div className="newtab-container">
      <div className="newtab-brand">
        <div className="brand-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h1 className="brand-title">Astrix Browser</h1>
        <p className="brand-tagline">
          An independent Chromium-based browser distribution built for speed, security, and privacy.
        </p>
      </div>

      <div className="newtab-search-wrapper">
        <form onSubmit={handleSearch} className="newtab-search-box" role="search">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--text-muted)' }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="newtab-search-input"
            placeholder="Search the web or type a URL..."
            aria-label="Search the web or type a URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </form>
      </div>

      {topSites.length > 0 && (
        <>
          <div className="newtab-section-label">Most visited</div>
          <div className="shortcuts-grid">
            {topSites.slice(0, 4).map((sc) => (
              <ShortcutCard key={sc.url} item={sc} onOpen={onNavigate} />
            ))}
          </div>
        </>
      )}

      <div className="newtab-section-label">Quick links</div>
      <div className="shortcuts-grid">
        {DEFAULT_SHORTCUTS.map((sc) => (
          <ShortcutCard key={sc.name} item={sc} onOpen={onNavigate} />
        ))}
      </div>
    </div>
  )
}
