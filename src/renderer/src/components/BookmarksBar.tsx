import React from 'react'
import { Bookmark } from '../../../main/storageService'

interface BookmarksBarProps {
  bookmarks: Bookmark[]
  onNavigate: (url: string) => void
  onRemoveBookmark: (id: string) => void
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onRemoveBookmark
}) => {
  return (
    <div className="bookmarks-bar">
      <div className="bookmarks-list">
        {bookmarks.map((bm) => (
          <div
            key={bm.id}
            className="bookmark-chip"
            onClick={() => onNavigate(bm.url)}
            title={`${bm.title}\n${bm.url}`}
            onContextMenu={(e) => {
              e.preventDefault()
              if (confirm(`Remove bookmark "${bm.title}"?`)) {
                onRemoveBookmark(bm.id)
              }
            }}
          >
            {bm.favicon ? (
              <img
                src={bm.favicon}
                alt=""
                className="bookmark-fav"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <svg
                className="bookmark-fav"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
            <span className="bookmark-name">{bm.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
