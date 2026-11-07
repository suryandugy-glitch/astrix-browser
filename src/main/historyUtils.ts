/**
 * Pure history helpers (no Electron imports) so they can be unit tested with plain Node.
 */

export interface HistoryEntry {
  id: string
  title: string
  url: string
  favicon?: string
  visitedAt: number
}

/** Visiting the same URL again within this window only refreshes the existing entry. */
export const HISTORY_DEDUPE_MS = 30_000
export const MAX_HISTORY = 2000

/**
 * Returns a new newest-first list with the visit recorded.
 * `makeId` is injected so tests are deterministic.
 */
export function recordVisit(
  history: HistoryEntry[],
  visit: { title: string; url: string; favicon?: string },
  now: number,
  makeId: () => string,
  maxItems: number = MAX_HISTORY
): HistoryEntry[] {
  const recent = history.find((h) => h.url === visit.url && now - h.visitedAt < HISTORY_DEDUPE_MS)
  if (recent) {
    const refreshed: HistoryEntry = {
      ...recent,
      title: visit.title || recent.title,
      favicon: visit.favicon ?? recent.favicon,
      visitedAt: now
    }
    return [refreshed, ...history.filter((h) => h !== recent)]
  }
  const entry: HistoryEntry = {
    id: makeId(),
    title: visit.title || visit.url,
    url: visit.url,
    favicon: visit.favicon,
    visitedAt: now
  }
  return [entry, ...history].slice(0, maxItems)
}

export interface TopSiteEntry {
  url: string
  title: string
  favicon?: string
  visits: number
}

export function computeTopSites(history: HistoryEntry[], limit: number): TopSiteEntry[] {
  const map = new Map<string, TopSiteEntry>()
  for (const h of history) {
    const existing = map.get(h.url)
    if (existing) existing.visits++
    else map.set(h.url, { url: h.url, title: h.title, favicon: h.favicon, visits: 1 })
  }
  return [...map.values()].sort((a, b) => b.visits - a.visits).slice(0, limit)
}
