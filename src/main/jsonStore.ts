import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'fs'
import { dirname } from 'path'

/**
 * Small durable JSON file helper.
 *  - Writes are atomic (temp file + rename) so a crash cannot leave a half-written file.
 *  - A corrupt file is moved aside to `<name>.corrupt-<time>` instead of being silently lost.
 *  - Files are wrapped as { version, data } so the schema can evolve.
 * No Electron imports, so it can be tested with plain Node.
 */

export interface Envelope<T> {
  version: number
  data: T
}

export function atomicWriteFileSync(path: string, contents: string): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const tmp = `${path}.tmp`
  writeFileSync(tmp, contents, 'utf-8')
  try {
    renameSync(tmp, path)
  } catch (e) {
    try {
      unlinkSync(tmp)
    } catch {
      // ignore
    }
    throw e
  }
}

export interface LoadResult<T> {
  data: T
  /** true when a file existed but could not be parsed */
  recovered: boolean
  /** true when a file was found on disk */
  existed: boolean
}

export function loadJson<T>(
  path: string,
  fallback: T,
  version: number,
  migrate?: (raw: unknown, fromVersion: number) => T
): LoadResult<T> {
  if (!existsSync(path)) return { data: fallback, recovered: false, existed: false }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown
    // Legacy files (before versioning) hold the bare data.
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      'version' in parsed &&
      'data' in parsed
    ) {
      const env = parsed as Envelope<unknown>
      if (env.version === version) return { data: env.data as T, recovered: false, existed: true }
      if (migrate) return { data: migrate(env.data, env.version), recovered: false, existed: true }
      return { data: env.data as T, recovered: false, existed: true }
    }
    if (migrate) return { data: migrate(parsed, 0), recovered: false, existed: true }
    return { data: parsed as T, recovered: false, existed: true }
  } catch {
    try {
      renameSync(path, `${path}.corrupt-${Date.now()}`)
    } catch {
      // ignore
    }
    return { data: fallback, recovered: true, existed: true }
  }
}

export function saveJson<T>(path: string, data: T, version: number): void {
  const envelope: Envelope<T> = { version, data }
  atomicWriteFileSync(path, JSON.stringify(envelope, null, 2))
}
