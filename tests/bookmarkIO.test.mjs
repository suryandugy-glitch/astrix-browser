import test from 'node:test'
import assert from 'node:assert/strict'
import { exportBookmarksHtml, parseBookmarksHtml } from '../src/main/bookmarkIO.ts'

test('export then import round trips', () => {
  const items = [
    { title: 'GitHub', url: 'https://github.com', createdAt: 1700000000000 },
    { title: 'A & B <test>', url: 'https://example.com/?a=1&b=2', createdAt: 1700000001000 }
  ]
  const parsed = parseBookmarksHtml(exportBookmarksHtml(items))
  assert.deepEqual(parsed, items)
})

test('import skips non-http links', () => {
  const html = '<DL><DT><A HREF="javascript:alert(1)">x</A><DT><A HREF="https://ok.com">ok</A></DL>'
  const parsed = parseBookmarksHtml(html)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].url, 'https://ok.com')
})

test('import handles Chrome style exports with folders', () => {
  const html = `<DL><p><DT><H3>Folder</H3><DL><p>
    <DT><A HREF="https://a.com" ADD_DATE="1600000000" ICON="data:x">Site A</A>
  </DL><p></DL>`
  const parsed = parseBookmarksHtml(html)
  assert.deepEqual(parsed, [{ title: 'Site A', url: 'https://a.com', createdAt: 1600000000000 }])
})
