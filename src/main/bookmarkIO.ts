/**
 * Netscape bookmark HTML import/export (the format every browser understands).
 * Pure functions, no Electron imports.
 */

export interface BookmarkLike {
  title: string
  url: string
  createdAt?: number
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function unesc(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
}

export function exportBookmarksHtml(bookmarks: BookmarkLike[]): string {
  const lines = bookmarks.map((b) => {
    const added = Math.floor((b.createdAt ?? Date.now()) / 1000)
    return `    <DT><A HREF="${esc(b.url)}" ADD_DATE="${added}">${esc(b.title)}</A>`
  })
  return [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    ...lines,
    '</DL><p>',
    ''
  ].join('\n')
}

export function parseBookmarksHtml(html: string): BookmarkLike[] {
  const results: BookmarkLike[] = []
  const re = /<A\s+([^>]*?)>(.*?)<\/A>/gis
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1]
    const hrefMatch = /HREF\s*=\s*"([^"]*)"/i.exec(attrs)
    if (!hrefMatch) continue
    const url = unesc(hrefMatch[1]).trim()
    if (!/^https?:\/\//i.test(url)) continue
    const addMatch = /ADD_DATE\s*=\s*"(\d+)"/i.exec(attrs)
    const title = unesc(m[2].replace(/<[^>]*>/g, '')).trim() || url
    results.push({
      title,
      url,
      createdAt: addMatch ? Number(addMatch[1]) * 1000 : undefined
    })
  }
  return results
}
