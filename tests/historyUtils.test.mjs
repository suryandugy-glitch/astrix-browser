import test from 'node:test'
import assert from 'node:assert/strict'
import { recordVisit, computeTopSites, HISTORY_DEDUPE_MS } from '../src/main/historyUtils.ts'

let n = 0
const id = () => `id-${++n}`

test('records a new visit at the top', () => {
  const h = recordVisit([], { title: 'A', url: 'https://a.com' }, 1000, id)
  assert.equal(h.length, 1)
  assert.equal(h[0].title, 'A')
})

test('same URL within the dedupe window updates instead of duplicating', () => {
  let h = recordVisit([], { title: 'Loading', url: 'https://a.com' }, 1000, id)
  h = recordVisit(h, { title: 'Real Title', url: 'https://a.com' }, 1000 + 5000, id)
  assert.equal(h.length, 1)
  assert.equal(h[0].title, 'Real Title')
  assert.equal(h[0].visitedAt, 6000)
})

test('same URL after the window creates a new entry', () => {
  let h = recordVisit([], { title: 'A', url: 'https://a.com' }, 0, id)
  h = recordVisit(h, { title: 'A', url: 'https://a.com' }, HISTORY_DEDUPE_MS + 1, id)
  assert.equal(h.length, 2)
})

test('a refreshed entry moves to the top', () => {
  let h = recordVisit([], { title: 'A', url: 'https://a.com' }, 0, id)
  h = recordVisit(h, { title: 'B', url: 'https://b.com' }, 100, id)
  h = recordVisit(h, { title: 'A', url: 'https://a.com' }, 200, id)
  assert.deepEqual(h.map((x) => x.url), ['https://a.com', 'https://b.com'])
})

test('history is capped', () => {
  let h = []
  for (let i = 0; i < 10; i++) h = recordVisit(h, { title: 't', url: `https://s${i}.com` }, i, id, 5)
  assert.equal(h.length, 5)
  assert.equal(h[0].url, 'https://s9.com')
})

test('top sites are ranked by visit count', () => {
  const mk = (url, t) => ({ id: id(), title: url, url, visitedAt: t })
  const h = [mk('https://a.com', 5), mk('https://b.com', 4), mk('https://b.com', 3), mk('https://b.com', 2)]
  const top = computeTopSites(h, 2)
  assert.equal(top[0].url, 'https://b.com')
  assert.equal(top[0].visits, 3)
  assert.equal(top.length, 2)
})
