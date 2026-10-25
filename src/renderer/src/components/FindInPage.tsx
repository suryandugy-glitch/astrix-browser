import React, { useState, useEffect, useRef } from 'react'
import { FindResult } from '../../../preload/index.d'

interface FindInPageProps {
  onFind: (text: string, forward: boolean, findNext: boolean) => void
  onClose: () => void
  findResult: FindResult
}

export const FindInPage: React.FC<FindInPageProps> = ({ onFind, onClose, findResult }) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onFind(val, true, false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onFind(query, !e.shiftKey, true)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="find-in-page-box">
      <input
        ref={inputRef}
        type="text"
        className="find-input"
        placeholder="Find in page..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <span className="find-count">
        {query ? `${findResult.activeMatchOrdinal} / ${findResult.matches}` : '0 / 0'}
      </span>

      <button
        className="find-btn"
        title="Previous match (Shift+Enter)"
        onClick={() => onFind(query, false, true)}
        disabled={!query || findResult.matches === 0}
      >
        ▲
      </button>

      <button
        className="find-btn"
        title="Next match (Enter)"
        onClick={() => onFind(query, true, true)}
        disabled={!query || findResult.matches === 0}
      >
        ▼
      </button>

      <button className="find-btn close-find" title="Close (Escape)" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}
