import React, { useState, useEffect } from 'react'
import type { HistoryItem } from '../../../main/storageService'

interface HistoryModalProps {
  onClose: () => void
  onNavigate: (url: string) => void
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onNavigate }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [search, setSearch] = useState('')

  const loadHistory = async (query?: string) => {
    if (window.astrixAPI) {
      const items = await window.astrixAPI.getHistory(query)
      setHistory(items)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearch(q)
    loadHistory(q)
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear your entire browsing history?')) {
      if (window.astrixAPI) {
        await window.astrixAPI.clearHistory()
        setHistory([])
      }
    }
  }

  const handleRemoveItem = async (id: string) => {
    if (window.astrixAPI) {
      await window.astrixAPI.removeHistoryItem(id)
      setHistory((prev) => prev.filter((item) => item.id !== id))
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Browsing History</h2>
          <div className="modal-actions">
            {history.length > 0 && (
              <button className="btn-danger" onClick={handleClearAll}>
                Clear All
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="modal-search-bar">
          <input
            type="text"
            className="modal-search-input"
            placeholder="Search history..."
            value={search}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>

        <div className="modal-content-list">
          {history.length === 0 ? (
            <div className="empty-state">No browsing history found.</div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.visitedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
              return (
                <div key={item.id} className="history-row">
                  <span className="history-time">{dateStr}</span>
                  <div
                    className="history-info"
                    onClick={() => {
                      onNavigate(item.url)
                      onClose()
                    }}
                  >
                    <span className="history-title">{item.title || item.url}</span>
                    <span className="history-url">{item.url}</span>
                  </div>
                  <button
                    className="history-delete-btn"
                    title="Remove from history"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    ✕
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
