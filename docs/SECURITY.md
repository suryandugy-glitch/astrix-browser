# Astrix Browser — Security Baseline & Rules

This document specifies the security policies, Electron configuration guidelines, and isolation requirements for Astrix Browser.

## 1. Remote Content Isolation

- **Zero Node.js Access in Web Pages**: Remote web pages loaded in `BrowserView` must never have access to Node.js runtime APIs. `nodeIntegration: false` and `nodeIntegrationInWorker: false` are enforced.
- **Context Isolation**: `contextIsolation: true` is strictly enabled for the UI renderer and all browser views.
- **Sandboxed UI window**: the browser UI window now also runs with `sandbox: true` (it was previously `false`). The preload script only uses `contextBridge` and `ipcRenderer`, which are sandbox-safe.
- **Sandboxing**: `sandbox: true` is enabled in webPreferences for all web views to enforce OS-level sandboxing of Chromium processes.
- **Preload Bridge Restrictions**: The preload bridge only exposes specific higher-level actions (`createTab`, `navigate`, etc.). It never exposes raw IPC `send`, `on`, `invoke`, or `electron` modules.

---

## 2. Navigation & Scheme Validation

1. **Permitted Schemes**:
   - `https://` (default for web traffic)
   - `http://` (permitted for standard web / localhost dev)
   - `astrix://` (internal schemes such as `astrix://newtab`)
2. **Blocked Dangerous Schemes**:
   - `javascript:`: Strictly blocked.
   - `file:`: Blocked in omnibox to prevent local file reads.
   - `data:`: Blocked for main navigation.

---

## 3. Pop-up & Window Open Handling

Websites commonly attempt to spawn new windows via `window.open` or `<a target="_blank">`.
- `setWindowOpenHandler` is implemented on all `BrowserView` webContents.
- Rather than spawning uncontrolled top-level windows, legitimate URLs are intercepted and opened inside a new managed browser tab.
- Unsafe protocols or malformed requests are denied (`{ action: 'deny' }`).

---

## 4. Permission Controls

Permissions are decided by a small pure policy (`src/main/permissionPolicy.ts`), enforced by both the session permission request handler and the permission check handler:

1. `openExternal`, `window-management`, `hid`, `serial` and `usb` are **always denied**.
2. `fullscreen` and `clipboard-sanitized-write` are **allowed by default**, because normal pages (video, copy buttons) need them.
3. Everything else (camera/microphone, geolocation, notifications, clipboard read, MIDI, ...) is **denied unless the exact origin has a stored "allow"**.
4. Non-web origins are always denied.

Stored decisions live in `permissions.json` and can be reset per site or cleared completely in **Settings > Site Permissions**. A prompt UI for granting permissions is still on the roadmap; today nothing is granted without an explicit stored decision.

---

## 4a. IPC Hardening

- Every IPC handler is registered through a `handle()` wrapper that rejects calls whose sender is not the browser UI window's `webContents`.
- Preference updates are sanitized (`src/main/validators.ts`): unknown keys and invalid values are dropped. The homepage must be `astrix://newtab` or an `http(s)` URL.
- Bookmark and history URLs must be `http(s)`; titles are trimmed, control characters removed and length-limited; favicons must be `http(s)`.

## 4b. Navigation Guards

- `will-navigate` and `will-redirect` on every tab block anything that is not `http(s)` (`javascript:`, `file:`, `data:`, `blob:` ...).
- Pop-ups and the context menu may only open `http(s)` URLs in new tabs.
- The UI window cannot be navigated away or open new windows.
- Only one app instance can run at a time (single instance lock).

## 4c. Storage Safety

- JSON files are written atomically (temp file + rename) so a crash cannot leave half-written data.
- A corrupt file is moved to `<name>.corrupt-<timestamp>` rather than being overwritten, so data can be recovered.
- Files are wrapped in a `{ version, data }` envelope for future migrations; legacy unversioned files are still read.

---

## 5. Secret & Credential Handling

- Never commit API keys, personal access tokens, signing certificates, or credentials to Git.
- All configuration files (`.env`, local secrets) must remain in `.gitignore`.
