import React, { useState } from 'react'
import { Tab } from '../../../main/types'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onSwitchTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onDuplicateTab: (id: string) => void
  onCloseOtherTabs: (id: string) => void
  onReloadTab: (id: string) => void
  onToggleMute: (id: string) => void
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  onDuplicateTab,
  onCloseOtherTabs,
  onReloadTab,
  onToggleMute
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    tabId: string
  } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId
    })
  }

  const closeMenu = () => setContextMenu(null)

  return (
    <div className="tab-bar-container" onClick={closeMenu}>
      <div className="tabs-list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              className={`tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSwitchTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              title={tab.title}
            >
              {tab.favicon ? (
                <img
                  src={tab.favicon}
                  alt=""
                  className="tab-favicon"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <svg
                  className="tab-favicon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              )}

              <span className="tab-title">{tab.title || 'New Tab'}</span>

              {/* Audible / Mute icon */}
              {tab.isAudible && (
                <button
                  className="tab-audio-btn"
                  title={tab.isMuted ? 'Unmute tab' : 'Mute tab'}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleMute(tab.id)
                  }}
                >
                  {tab.isMuted ? '🔇' : '🔊'}
                </button>
              )}

              <button
                className="tab-close-btn"
                title="Close Tab (Ctrl+W)"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
              >
                <svg
                  viewBox="0 0 24 24"
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
            </div>
          )
        })}
      </div>

      <button className="tab-new-btn" onClick={onNewTab} title="New Tab (Ctrl+T)">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Tab Context Menu */}
      {contextMenu?.visible && (
        <div
          className="tab-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="ctx-item"
            onClick={() => {
              onReloadTab(contextMenu.tabId)
              closeMenu()
            }}
          >
            Reload
          </div>
          <div
            className="ctx-item"
            onClick={() => {
              onDuplicateTab(contextMenu.tabId)
              closeMenu()
            }}
          >
            Duplicate
          </div>
          <div
            className="ctx-item"
            onClick={() => {
              onToggleMute(contextMenu.tabId)
              closeMenu()
            }}
          >
            Mute / Unmute
          </div>
          <div className="ctx-divider" />
          <div
            className="ctx-item"
            onClick={() => {
              onCloseOtherTabs(contextMenu.tabId)
              closeMenu()
            }}
          >
            Close Other Tabs
          </div>
          <div
            className="ctx-item ctx-danger"
            onClick={() => {
              onCloseTab(contextMenu.tabId)
              closeMenu()
            }}
          >
            Close Tab
          </div>
        </div>
      )}
    </div>
  )
}
