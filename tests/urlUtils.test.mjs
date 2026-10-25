import test from 'node:test'
import assert from 'node:assert/strict'

const BLOCKED_SCHEMES = ['javascript:', 'file:', 'data:', 'vbscript:']
const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q='

function normalizeInputToUrl(input) {
  const trimmed = input.trim()
  if (!trimmed) return 'astrix://newtab'
  if (trimmed.startsWith('astrix://')) return trimmed
  const lower = trimmed.toLowerCase()
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      throw new Error(`Security Exception: Navigation to scheme "${scheme}" is blocked.`)
    }
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      new URL(trimmed)
      return trimmed
    } catch {}
  }
  if (lower.startsWith('localhost') || lower.startsWith('127.0.0.1')) {
    return `http://${trimmed}`
  }
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/
  if (domainPattern.test(trimmed)) {
    return `https://${trimmed}`
  }
  return `${DEFAULT_SEARCH_ENGINE}${encodeURIComponent(trimmed)}`
}

test('normalizes web URLs with https', () => {
  assert.equal(normalizeInputToUrl('github.com'), 'https://github.com')
  assert.equal(normalizeInputToUrl('https://example.com'), 'https://example.com')
})

test('normalizes localhost to http', () => {
  assert.equal(normalizeInputToUrl('localhost:3000'), 'http://localhost:3000')
})

test('converts plain queries to search URL', () => {
  assert.equal(
    normalizeInputToUrl('astrix browser'),
    'https://www.google.com/search?q=astrix%20browser'
  )
})

test('blocks unsafe schemes', () => {
  assert.throws(() => normalizeInputToUrl('javascript:alert(1)'))
  assert.throws(() => normalizeInputToUrl('file:///etc/passwd'))
})
