# Changelog

## 0.2.0

### Security
- UI window now runs sandboxed (`sandbox: true`).
- IPC calls are only accepted from the browser UI window.
- Preference input is validated; unknown keys and invalid values are dropped.
- Per-site permission policy (deny by default) with a Settings page to reset decisions. Fullscreen and sanitized clipboard write now work on normal pages.
- Tabs block navigation, redirects and pop-ups to non-http(s) schemes.
- Blocked schemes now include `blob:` and `filesystem:`.
- Single instance lock.

### Storage
- Atomic, versioned JSON writes; corrupt files are kept as `.corrupt-<timestamp>` instead of lost.
- History no longer records duplicate entries when a page title updates; failed pages and error pages are not recorded.
- Bookmark titles, URLs and favicons are validated.
- Bookmark import and export (HTML).
- History keeps the newest 2,000 entries.

### UI/UX
- Light, dark and system themes.
- Redesigned Settings: appearance, search and startup, bookmarks, privacy, site permissions.
- New tab page shows most visited sites and is keyboard accessible.
- Downloads: pause, resume, clear finished.
- Visible keyboard focus, ARIA labels on dialogs, reduced-motion support.

### Fixes
- `Ctrl+D` bookmarking used a stale tab; it now always uses the current tab.
- Bookmarks bar toggle from the menu now updates the UI immediately.
- "Clear Browsing Data" now really clears cookies, site data and cache (it only cleared history before).
- Homepage setting no longer saves on every keystroke.
- Address bar no longer shows an internal `data:` URL on error pages.
- A blocked URL no longer throws from pop-ups or the context menu.
- `localhostfoo` is no longer treated as localhost.
- Renderer crash now shows an error page instead of a blank tab.

### Tests and CI
- Tests now import the real source modules (they used to test a copy of the logic). 35 tests.
- CI runs typecheck, tests and a production build.
