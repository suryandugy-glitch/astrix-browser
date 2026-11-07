import React from 'react'
import type { DownloadRecord } from '../../../main/downloadManager'

interface DownloadsModalProps {
  onClose: () => void
  downloads: DownloadRecord[]
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({ onClose, downloads }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleOpenFolder = (id: string) => {
    if (window.astrixAPI) {
      window.astrixAPI.openDownloadFolder(id)
    }
  }

  const handlePause = (id: string) => {
    window.astrixAPI?.pauseDownload(id)
  }

  const handleResume = (id: string) => {
    window.astrixAPI?.resumeDownload(id)
  }

  const handleClearFinished = () => {
    window.astrixAPI?.clearFinishedDownloads()
  }

  const hasFinished = downloads.some((d) => d.state !== 'progressing')

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
          {hasFinished && (
            <button className="btn-secondary" onClick={handleClearFinished}>
              Clear finished
            </button>
          )}
          <button className="modal-close-btn" onClick={onClose} aria-label="Close downloads">
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
                    <span className={`download-status status-${dl.state}`}>
                      {dl.state === 'progressing' && dl.isPaused ? 'paused' : dl.state}
                    </span>
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
                  {dl.state === 'progressing' && !dl.isPaused && (
                    <button className="btn-secondary" onClick={() => handlePause(dl.id)}>
                      Pause
                    </button>
                  )}
                  {dl.state === 'progressing' && dl.isPaused && (
                    <button className="btn-secondary" onClick={() => handleResume(dl.id)}>
                      Resume
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
