import type { SearchEngine } from './types'

/**
 * URL normalization, validation, and search provider utilities for Astrix Browser.
 */

const BLOCKED_SCHEMES = ['javascript:', 'file:', 'data:', 'vbscript:', 'blob:', 'filesystem:']

export const SEARCH_ENGINES: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  brave: 'https://search.brave.com/search?q='
}

export function normalizeInputToUrl(
  input: string,
  engine: SearchEngine = 'google'
): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return 'astrix://newtab'
  }

  // Handle internal Astrix schemes
  if (trimmed.startsWith('astrix://')) {
    return trimmed
  }

  // Check for disallowed security risks
  const lower = trimmed.toLowerCase()
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      throw new Error(`Security Exception: Navigation to scheme "${scheme}" is blocked.`)
    }
  }

  // Check if it's already an explicit HTTP or HTTPS URL
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      new URL(trimmed)
      return trimmed
    } catch {
      // If parsing fails, fall through to search
    }
  }

  // Check if it's localhost or an IPv4 address (optionally with port/path)
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `http://${trimmed}`
  }

  // Domain regex: matches patterns like "example.com", "sub.domain.org/path?arg=1"
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/
  if (domainPattern.test(trimmed)) {
    return `https://${trimmed}`
  }

  // Otherwise, route to selected search provider
  const searchBase = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google
  return `${searchBase}${encodeURIComponent(trimmed)}`
}

export function isValidNavigationUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'astrix:'
    )
  } catch {
    return false
  }
}

/**
 * Generates friendly HTML for navigation errors (e.g. DNS failure, connection refused)
 */
export function generateErrorPageHtml(failedUrl: string, errorDescription: string, errorCode: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unable to Load Page - Astrix Browser</title>
  <style>
    body {
      background-color: #171822;
      color: #f0f2f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      user-select: none;
    }
    .error-card {
      background-color: #222432;
      border: 1px solid #383a4d;
      border-radius: 12px;
      padding: 32px 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .icon {
      font-size: 40px;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 12px 0;
      font-size: 20px;
      color: #f87171;
    }
    p {
      color: #9aa0b0;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 20px 0;
      word-break: break-all;
    }
    .details {
      background: #181922;
      padding: 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .btn {
      background-color: #6366f1;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.15s;
    }
    .btn:hover {
      background-color: #4f46e5;
    }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="icon">⚠️</div>
    <h2>This site can’t be reached</h2>
    <p>Astrix Browser was unable to connect to:<br><strong>${escapeHtml(failedUrl)}</strong></p>
    <div class="details">Error: ${escapeHtml(errorDescription)} (${errorCode})</div>
    <button class="btn" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Returns true when a URL requested by web content (window.open, redirects)
 * may be opened in a tab. Web content must never open internal or local schemes.
 */
export function isAllowedWebContentUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
