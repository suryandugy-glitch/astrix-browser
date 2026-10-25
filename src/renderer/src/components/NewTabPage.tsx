import React, { useState } from 'react'

interface NewTabPageProps {
  onNavigate: (input: string) => void
}

const SHORTCUTS = [
  { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚' },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: '🤖' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '📰' },
  { name: 'MDN Web', url: 'https://developer.mozilla.org', icon: '🌐' },
  { name: 'Electron Docs', url: 'https://www.electronjs.org', icon: '⚡' }
]

export const NewTabPage: React.FC<NewTabPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onNavigate(query.trim())
    }
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
        <form onSubmit={handleSearch} className="newtab-search-box">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#9aa0b0' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="newtab-search-input"
            placeholder="Search the web or type a URL..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </form>
      </div>

      <div className="shortcuts-grid">
        {SHORTCUTS.map((sc) => (
          <div
            key={sc.name}
            className="shortcut-card"
            onClick={() => onNavigate(sc.url)}
            title={`Navigate to ${sc.name}`}
          >
            <div className="shortcut-icon">{sc.icon}</div>
            <span className="shortcut-label">{sc.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
