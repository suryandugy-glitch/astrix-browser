import React from 'react'

interface SiteInfoModalProps {
  url: string
  title: string
  onClose: () => void
}

export const SiteInfoModal: React.FC<SiteInfoModalProps> = ({ url, title, onClose }) => {
  const isHttps = url.startsWith('https://')
  const isInternal = url.startsWith('astrix://')

  let hostname = url
  try {
    hostname = new URL(url).hostname
  } catch {}

  return (
    <div className="site-info-backdrop" onClick={onClose}>
      <div className="site-info-card" onClick={(e) => e.stopPropagation()}>
        <div className="site-info-header">
          <div className="site-info-icon-wrapper">
            {isHttps ? (
              <span className="badge-secure">🔒</span>
            ) : isInternal ? (
              <span className="badge-internal">⚡</span>
            ) : (
              <span className="badge-insecure">⚠️</span>
            )}
          </div>
          <div>
            <h3 className="site-info-title">{hostname || 'Current Page'}</h3>
            <span className="site-info-subtitle">
              {isHttps
                ? 'Connection is secure'
                : isInternal
                ? 'Internal Astrix page'
                : 'Connection is not secure'}
            </span>
          </div>
        </div>

        <div className="site-info-body">
          <div className="site-info-item">
            <span className="site-info-key">Protocol</span>
            <span className="site-info-val">
              {isHttps ? 'HTTPS (TLS Encrypted)' : isInternal ? 'Astrix Core Protocol' : 'HTTP (Unencrypted)'}
            </span>
          </div>

          <div className="site-info-item">
            <span className="site-info-key">Permissions</span>
            <span className="site-info-val">Default Deny (Camera, Mic, Location)</span>
          </div>

          <div className="site-info-item">
            <span className="site-info-key">Node.js Sandbox</span>
            <span className="site-info-val" style={{ color: '#10b981' }}>
              Isolated & Sandboxed
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
