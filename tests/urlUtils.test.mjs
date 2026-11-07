import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeInputToUrl,
  isValidNavigationUrl,
  isAllowedWebContentUrl,
  generateErrorPageHtml
} from '../src/main/urlUtils.ts'

test('normalizes domains with https', () => {
  assert.equal(normalizeInputToUrl('github.com'), 'https://github.com')
  assert.equal(normalizeInputToUrl('sub.example.org/path?a=1'), 'https://sub.example.org/path?a=1')
  assert.equal(normalizeInputToUrl('https://example.com'), 'https://example.com')
})

test('empty input opens the new tab page', () => {
  assert.equal(normalizeInputToUrl(''), 'astrix://newtab')
  assert.equal(normalizeInputToUrl('   '), 'astrix://newtab')
})

test('localhost and IPv4 addresses use http', () => {
  assert.equal(normalizeInputToUrl('localhost:3000'), 'http://localhost:3000')
  assert.equal(normalizeInputToUrl('127.0.0.1:8080/x'), 'http://127.0.0.1:8080/x')
  assert.equal(normalizeInputToUrl('192.168.1.1'), 'http://192.168.1.1')
})

test('hostnames that merely start with "localhost" are not treated as localhost', () => {
  assert.equal(
    normalizeInputToUrl('localhostfoo'),
    'https://www.google.com/search?q=localhostfoo'
  )
})

test('plain queries use the selected search engine', () => {
  assert.equal(normalizeInputToUrl('astrix browser'), 'https://www.google.com/search?q=astrix%20browser')
  assert.equal(normalizeInputToUrl('astrix browser', 'duckduckgo'), 'https://duckduckgo.com/?q=astrix%20browser')
  assert.equal(normalizeInputToUrl('astrix browser', 'brave'), 'https://search.brave.com/search?q=astrix%20browser')
  assert.equal(normalizeInputToUrl('astrix browser', 'bing'), 'https://www.bing.com/search?q=astrix%20browser')
})

test('dangerous schemes are blocked, in any letter case', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'file:///etc/passwd',
    'data:text/html,<script>1</script>',
    'vbscript:x',
    'blob:https://a/b'
  ]) {
    assert.throws(() => normalizeInputToUrl(bad), /Security Exception/, bad)
  }
})

test('isValidNavigationUrl accepts only http, https and astrix', () => {
  assert.equal(isValidNavigationUrl('https://a.com'), true)
  assert.equal(isValidNavigationUrl('astrix://newtab'), true)
  assert.equal(isValidNavigationUrl('file:///x'), false)
  assert.equal(isValidNavigationUrl('not a url'), false)
})

test('web content may only open http(s) URLs', () => {
  assert.equal(isAllowedWebContentUrl('https://a.com'), true)
  assert.equal(isAllowedWebContentUrl('http://a.com'), true)
  assert.equal(isAllowedWebContentUrl('astrix://newtab'), false)
  assert.equal(isAllowedWebContentUrl('file:///x'), false)
  assert.equal(isAllowedWebContentUrl('javascript:1'), false)
})

test('error page escapes HTML in the failed URL', () => {
  const html = generateErrorPageHtml('https://x.com/"><script>alert(1)</script>', 'ERR', -105)
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;'))
})
