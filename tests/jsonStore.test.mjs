import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readdirSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadJson, saveJson } from '../src/main/jsonStore.ts'

const tmp = () => mkdtempSync(join(tmpdir(), 'astrix-'))

test('round trips data through the versioned envelope', () => {
  const p = join(tmp(), 'a.json')
  saveJson(p, [{ a: 1 }], 1)
  const r = loadJson(p, [], 1)
  assert.deepEqual(r.data, [{ a: 1 }])
  assert.equal(r.existed, true)
  assert.equal(r.recovered, false)
})

test('returns the fallback when the file does not exist', () => {
  const r = loadJson(join(tmp(), 'missing.json'), ['x'], 1)
  assert.deepEqual(r.data, ['x'])
  assert.equal(r.existed, false)
})

test('reads legacy unversioned files', () => {
  const p = join(tmp(), 'legacy.json')
  writeFileSync(p, JSON.stringify([{ id: 1 }]))
  assert.deepEqual(loadJson(p, [], 1).data, [{ id: 1 }])
})

test('a corrupt file is moved aside, not lost', () => {
  const dir = tmp()
  const p = join(dir, 'bad.json')
  writeFileSync(p, '{ this is not json')
  const r = loadJson(p, [], 1)
  assert.equal(r.recovered, true)
  assert.deepEqual(r.data, [])
  assert.ok(readdirSync(dir).some((f) => f.startsWith('bad.json.corrupt-')))
  assert.equal(existsSync(p), false)
})

test('migrate is applied for older versions', () => {
  const p = join(tmp(), 'm.json')
  saveJson(p, { n: 1 }, 1)
  const r = loadJson(p, { n: 0 }, 2, (raw) => ({ n: raw.n + 10 }))
  assert.deepEqual(r.data, { n: 11 })
})

test('saving leaves no temp file behind', () => {
  const dir = tmp()
  const p = join(dir, 's.json')
  saveJson(p, { ok: true }, 1)
  assert.deepEqual(readdirSync(dir), ['s.json'])
  assert.equal(JSON.parse(readFileSync(p, 'utf-8')).version, 1)
})
