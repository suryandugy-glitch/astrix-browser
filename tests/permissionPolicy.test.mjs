import test from 'node:test'
import assert from 'node:assert/strict'
import { decidePermission, originOf } from '../src/main/permissionPolicy.ts'

test('default is deny for sensitive permissions', () => {
  assert.equal(decidePermission('media', 'https://a.com/x', {}), 'deny')
  assert.equal(decidePermission('geolocation', 'https://a.com', {}), 'deny')
})

test('fullscreen and sanitized clipboard write are allowed by default', () => {
  assert.equal(decidePermission('fullscreen', 'https://a.com', {}), 'allow')
  assert.equal(decidePermission('clipboard-sanitized-write', 'https://a.com', {}), 'allow')
})

test('a stored allow applies only to that origin', () => {
  const stored = { 'https://a.com': { media: 'allow' } }
  assert.equal(decidePermission('media', 'https://a.com/page', stored), 'allow')
  assert.equal(decidePermission('media', 'https://b.com', stored), 'deny')
  assert.equal(decidePermission('media', 'http://a.com', stored), 'deny')
})

test('always-deny permissions cannot be overridden', () => {
  const stored = { 'https://a.com': { openExternal: 'allow' } }
  assert.equal(decidePermission('openExternal', 'https://a.com', stored), 'deny')
})

test('non-web origins are denied', () => {
  assert.equal(originOf('file:///x'), null)
  assert.equal(decidePermission('media', 'file:///x', {}), 'deny')
})
