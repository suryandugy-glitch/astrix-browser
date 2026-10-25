# Astrix Browser — Core Architecture

This document outlines the system architecture, component boundaries, process communication, and navigation model for Astrix Browser.

## 1. Overview & Mental Model

Astrix Browser separates desktop browser controls (the "Chrome") from untrusted web content (the "Web View"):

```text
┌────────────────────────────────────────────────────────┐
│                   Electron Main Process                │
│ (App Lifecycle, TabManager, BrowserView Lifecycle, IPC)│
└───────────────▲────────────────────────▲───────────────┘
                │ IPC                    │ Bounds / Events
                ▼                        ▼
┌───────────────────────────┐    ┌───────────────────────────┐
│       Renderer Process    │    │        BrowserView        │
│  (React UI: Tabs, Toolbar)│    │ (Untrusted Web Rendering) │
│   Context-Isolated Preload│    │   Sandbox & No Node.js    │
└───────────────────────────┘    └───────────────────────────┘
```

- **Electron Main Process (`src/main/`)**:
  - Owns window creation, application lifecycle, accelerators, and security controls.
  - Controls the `TabManager`, maintaining tab metadata and instantiating a native `BrowserView` per tab.
  - Validates all input received from the UI and safely manages navigation.
- **Preload Bridge (`src/preload/`)**:
  - Exposes an immutable, typed `window.astrixAPI` to the renderer via Electron's `contextBridge`.
  - Blocks direct access to Node.js APIs or Electron internals from renderer code.
- **Renderer UI (`src/renderer/`)**:
  - Written in React + TypeScript.
  - Draws the tab bar, omnibox toolbar, navigation controls, and start/new tab view.
  - Consumes `window.astrixAPI` and receives tab state broadcasts.
- **BrowserView**:
  - Renders actual web pages in a sandboxed Chromium view mounted beneath the toolbar (y: 78px).
  - Keeps remote web code strictly isolated from the UI process.

---

## 2. Tab Lifecycle & State Machine

Every tab conforms to the `Tab` interface:

```typescript
export interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  zoomFactor: number
  isAudible: boolean
  isMuted: boolean
}
```

### Tab Operations
1. **Create Tab (`tab:create`)**:
   - Generates a unique UUID / ID.
   - Creates a dedicated `BrowserView` with `contextIsolation: true` and `nodeIntegration: false`.
   - Attaches webContents listeners (`did-start-loading`, `did-stop-loading`, `page-title-updated`, `page-favicon-updated`, `did-navigate`, `did-fail-load`, `media-started-playing`, `media-paused`).
   - If initial URL is provided, navigates; otherwise sets default title "New Tab" and url `astrix://newtab`.
   - Activates the newly created tab.
2. **Switch Tab (`tab:switch`)**:
   - Unmounts the current active `BrowserView` (`mainWindow.removeBrowserView`).
   - Mounts the target tab's `BrowserView` (`mainWindow.addBrowserView`).
   - Recomputes view bounds based on current window size.
   - Broadcasts updated state to renderer.
3. **Close Tab (`tab:close`)**:
   - If closed tab is active, selects an adjacent tab (prioritizing right, then left).
   - If no tabs remain, creates a fresh default tab so the browser is always usable.
   - Cleans up and destroys the target tab's `BrowserView`.
   - Broadcasts updated state to renderer.

---

## 3. URL Navigation & Search Normalization

All navigation queries flow through `src/main/urlUtils.ts`:

- **Explicit HTTP / HTTPS URLs** (e.g. `https://news.ycombinator.com`): Preserved and loaded directly.
- **Web domains without scheme** (e.g. `github.com`, `reddit.com/r/technology`): Prepended with `https://`.
- **Localhost addresses** (e.g. `localhost:3000`): Allowed and prepended with `http://`.
- **Search phrases**: Routed to the active search provider (`google`, `duckduckgo`, `bing`, or `brave`).
- **Disallowed schemes**: `javascript:`, `file:`, `data:` (except favicons), `vbscript:` are rejected to prevent security risks.
- **Error Recovery**: If a page fails to load, `did-fail-load` catches the error and loads a branded friendly error recovery page.

---

## 4. Keyboard Shortcuts

Standard browser accelerators are bound in the main process:
- `Ctrl+T`: New tab
- `Ctrl+W`: Close active tab
- `Ctrl+R` / `F5`: Reload page
- `Ctrl+Shift+R`: Hard reload (ignore cache)
- `Ctrl+Tab` / `Ctrl+Shift+Tab`: Next / Previous tab
- `Ctrl+1` through `Ctrl+8`: Switch to tab 1 through 8
- `Ctrl+=` / `Ctrl+-`: Zoom in / Zoom out
- `Ctrl+0`: Reset zoom
- `F12`: Toggle Developer Tools for the active tab
- `Alt+Left` / `Alt+Right`: Back / Forward navigation

---

## 5. IPC API Contract (`window.astrixAPI`)

The preload script exposes the following typed API to `window.astrixAPI`:

| Method | Direction | Description |
|---|---|---|
| `createTab(url?: string)` | Invoke (`tab:create`) | Creates and switches to a new tab |
| `closeTab(id?: string)` | Invoke (`tab:close`) | Closes specified or active tab |
| `switchTab(id: string)` | Invoke (`tab:switch`) | Sets specified tab as active |
| `navigate(id: string, query: string)` | Invoke (`tab:navigate`) | Navigates the tab to a URL or search query |
| `goBack(id?: string)` | Invoke (`tab:go-back`) | Navigates back in tab history |
| `goForward(id?: string)` | Invoke (`tab:go-forward`) | Navigates forward in tab history |
| `reload(id?: string)` | Invoke (`tab:reload`) | Reloads current page |
| `reloadIgnoringCache(id?: string)` | Invoke (`tab:reload-ignore-cache`) | Hard reloads page ignoring cached assets |
| `stop(id?: string)` | Invoke (`tab:stop`) | Cancels active loading |
| `zoomIn(id?: string)` | Invoke (`tab:zoom-in`) | Increases zoom level by 10% |
| `zoomOut(id?: string)` | Invoke (`tab:zoom-out`) | Decreases zoom level by 10% |
| `resetZoom(id?: string)` | Invoke (`tab:reset-zoom`) | Resets zoom level to 100% |
| `toggleMute(id?: string)` | Invoke (`tab:toggle-mute`) | Toggles audio mute for tab |
| `toggleDevTools(id?: string)` | Invoke (`tab:toggle-devtools`) | Opens/closes DevTools for active tab |
| `setSearchEngine(engine)` | Invoke (`tab:set-search-engine`) | Configures active search provider |
| `getState()` | Invoke (`tab:get-state`) | Gets initial tabs array, active tab ID & engine |
| `onTabsUpdated(cb)` | Listen (`tab:state-changed`) | Receives real-time tab list & active tab updates |
