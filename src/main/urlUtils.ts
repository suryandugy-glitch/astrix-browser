/**
 * URL normalization and validation utilities for Astrix Browser.
 */

const BLOCKED_SCHEMES = ['javascript:', 'file:', 'data:', 'vbscript:']
const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q='

export function normalizeInputToUrl(input: string): string {
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

  // Check if it's localhost
  if (lower.startsWith('localhost') || lower.startsWith('127.0.0.1')) {
    return `http://${trimmed}`
  }

  // Domain regex: matches patterns like "example.com", "sub.domain.org/path?arg=1"
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/
  if (domainPattern.test(trimmed)) {
    return `https://${trimmed}`
  }

  // Otherwise, treat as search query
  return `${DEFAULT_SEARCH_ENGINE}${encodeURIComponent(trimmed)}`
}

export function isValidNavigationUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'astrix:'
  } catch {
    return false
  }
}
