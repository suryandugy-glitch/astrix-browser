import React from 'react'
import { DownloadRecord } from '../../../main/downloadManager'

interface DownloadsModalProps {
  onClose: () => void
  downloads: DownloadRecord[]
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({ onClose, downloads }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleOpenFolder = (id: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.openDownloadFolder(id)
    }
  }

  const handleCancel = (id: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.cancelDownload(id)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Downloads</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content-list">
          {downloads.length === 0 ? (
            <div className="empty-state">No downloads yet.</div>
          ) : (
            downloads.map((dl) => (
              <div key={dl.id} className="download-row">
                <div className="download-icon">📥</div>
                <div className="download-details">
                  <span className="download-filename">{dl.filename}</span>
                  <div className="download-subtext">
                    <span>
                      {formatBytes(dl.receivedBytes)}{' '}
                      {dl.totalBytes > 0 ? `/ ${formatBytes(dl.totalBytes)}` : ''}
                    </span>
                    <span className={`download-status status-${dl.state}`}>{dl.state}</span>
                  </div>

                  {dl.state === 'progressing' && (
                    <div className="dl-progress-track">
                      <div className="dl-progress-fill" style={{ width: `${dl.percent}%` }} />
                    </div>
                  )}
                </div>

                <div className="download-actions">
                  {dl.state === 'completed' && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleOpenFolder(dl.id)}
                      title="Show in folder"
                    >
                      Show in Folder
                    </button>
                  )}
                  {dl.state === 'progressing' && (
                    <button
                      className="btn-danger"
                      onClick={() => handleCancel(dl.id)}
                      title="Cancel download"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
