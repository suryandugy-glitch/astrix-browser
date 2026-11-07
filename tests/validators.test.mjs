import test from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizePreferences,
  isValidHomepage,
  isStorableUrl,
  cleanText,
  cleanFavicon
} from '../src/main/validators.ts'

test('sanitizePreferences keeps only valid fields', () => {
  assert.deepEqual(
    sanitizePreferences({ searchEngine: 'brave', theme: 'light', showBookmarksBar: false, evil: 1 }),
    { searchEngine: 'brave', theme: 'light', showBookmarksBar: false }
  )
})

test('sanitizePreferences drops invalid values', () => {
  assert.deepEqual(sanitizePreferences({ searchEngine: 'yahoo', theme: 'pink', showBookmarksBar: 'yes' }), {})
  assert.deepEqual(sanitizePreferences(null), {})
  assert.deepEqual(sanitizePreferences('x'), {})
  assert.deepEqual(sanitizePreferences({ homepage: 'javascript:alert(1)' }), {})
})

test('homepage accepts newtab and http(s) only', () => {
  assert.equal(isValidHomepage('astrix://newtab'), true)
  assert.equal(isValidHomepage('https://example.com'), true)
  assert.equal(isValidHomepage('file:///c:/x'), false)
  assert.equal(isValidHomepage(''), false)
  assert.equal(isValidHomepage(42), false)
})

test('storable URLs are http(s) only', () => {
  assert.equal(isStorableUrl('https://a.com/x'), true)
  assert.equal(isStorableUrl('astrix://newtab'), false)
  assert.equal(isStorableUrl('javascript:1'), false)
  assert.equal(isStorableUrl(undefined), false)
})

test('cleanText strips control characters and limits length', () => {
  assert.equal(cleanText('  hi\u0000there  '), 'hi there')
  assert.equal(cleanText('x'.repeat(500), 10).length, 10)
  assert.equal(cleanText(5), '')
})

test('cleanFavicon allows only http(s)', () => {
  assert.equal(cleanFavicon('https://a.com/f.ico'), 'https://a.com/f.ico')
  assert.equal(cleanFavicon('javascript:1'), undefined)
})
