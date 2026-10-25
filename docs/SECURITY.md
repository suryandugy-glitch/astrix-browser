# Astrix Browser — Security Baseline & Rules

This document specifies the security policies, Electron configuration guidelines, and isolation requirements for Astrix Browser.

## 1. Remote Content Isolation

- **Zero Node.js Access in Web Pages**: Remote web pages loaded in `BrowserView` must never have access to Node.js runtime APIs. `nodeIntegration: false` and `nodeIntegrationInWorker: false` are enforced.
- **Context Isolation**: `contextIsolation: true` is strictly enabled for the UI renderer and all browser views.
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

- Default policy: **Deny all permission requests** (camera, microphone, geolocation, notifications, MIDI, external device access) until a verified user-prompt consent interface is built (Phase 5).
- Web session permission handler denies unreviewed requests by default.

---

## 5. Secret & Credential Handling

- Never commit API keys, personal access tokens, signing certificates, or credentials to Git.
- All configuration files (`.env`, local secrets) must remain in `.gitignore`.
