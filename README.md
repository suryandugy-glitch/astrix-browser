# Astrix Browser

An independent Chromium-based browser distribution built for speed, security, privacy, and a modern browsing experience.

## Status

Full Modern Desktop Browser MVP, version 0.2.0. See the [CHANGELOG](CHANGELOG.md).

### Browser Core & Shell

- [x] **Multi-Tab Engine**: Create, switch, close, close others, duplicate, and active tab state.
- [x] **Omnibox & Search**: Direct URL navigation with protocol normalization and search providers (Google, DuckDuckGo, Brave, Bing).
- [x] **Browser Controls**: Back, Forward, Reload, Force Reload (ignore cache), Stop, and Home.
- [x] **Bookmarks System**: Star button in Omnibox, persistent Bookmarks Bar, and storage persistence.
- [x] **Browsing History (`Ctrl+H`)**: Searchable history database with timestamps and single-click clear.
- [x] **Downloads Manager (`Ctrl+J`)**: Progress bars, pause/resume, cancel, clear finished, and folder reveal.
- [x] **Find in Page (`Ctrl+F`)**: In-page search with real-time match counters, forward/backward navigation, and highlighting.
- [x] **Site Security Inspector**: Omnibox security badge showing TLS encryption, protocol, and sandbox status.
- [x] **Web & Tab Context Menus**: Native right-click menus for links, text selection, images, inspection, and tab lifecycle.
- [x] **Keyboard Shortcuts**: Standard accelerators for tabs, navigation, zooming, history, find, and print.
- [x] **Page Zooming**: Incremental zoom controls (`Ctrl+=`, `Ctrl+-`, `Ctrl+0`) with factor clamping.
- [x] **Audio & Tab Muting**: Tab speaker indicator and click-to-mute.

### New in v0.2.0

- [x] **Themes**: Dark, Light, and System (follows the OS live).
- [x] **Redesigned Settings**: appearance, search and startup, bookmarks, privacy, site permissions.
- [x] **Real "Clear Browsing Data"**: choose history, cookies and site data, cache, and site permissions.
- [x] **Site Permission Policy**: deny by default, per-site stored decisions, reset in Settings.
- [x] **Bookmark Import / Export**: standard bookmarks HTML.
- [x] **Smarter New Tab Page**: most visited sites plus quick links, keyboard accessible.
- [x] **Hardened IPC and Navigation**: sender-checked IPC, validated preferences, blocked non-http(s) navigation and pop-ups.
- [x] **Safer Storage**: atomic versioned writes, corrupt-file recovery, de-duplicated history.
- [x] **Crash and Error Pages**: renderer crashes and failed loads show a recovery page.
- [x] **Single Instance**: launching again focuses the existing window.
- [x] **Strict Security Sandbox**: `contextIsolation: true`, `nodeIntegration: false`, sandboxed UI and web contents.
- [x] **Real Automated Tests**: 35 unit tests over the actual source, run in CI.

---

## Roadmap

### Frontend & UI/UX
- [x] Light / dark / system theme support
- [x] Settings UI refinement and clearer grouping of options
- [x] Redesigned new-tab page (most visited + quick links)
- [x] Keyboard focus styles, ARIA labels on dialogs, reduced-motion support
- [ ] Tab overflow scrolling polish and drag to reorder
- [ ] Full accessibility audit with a screen reader

### Security & Permissions
- [x] IPC sender checks and input validation
- [x] Default-deny permission policy with per-site decisions and a manager in Settings
- [x] Clear browsing data options (history, cookies, cache, permissions)
- [x] Block non-http(s) navigation, redirects, and pop-ups
- [ ] Permission **prompt** (ask the user when a site requests camera, location, ...)
- [ ] Content Security Policy for the UI shell
- [ ] Automatic dependency updates (Dependabot) and an Electron update policy

### Storage & Persistence
- [x] Versioned storage schema
- [x] Atomic writes with corrupt-file recovery
- [x] Bookmark import / export (HTML)
- [x] History de-duplication and size limit
- [ ] Session restore (reopen tabs after restart)
- [ ] Bookmark folders

### Testing & QA
- [x] Unit tests for URL handling, validation, storage, history, bookmarks, and permissions
- [x] Typecheck and tests run in GitHub Actions on every push
- [ ] End-to-end tests of the real app (Playwright)
- [ ] React component tests

### Release & Packaging
- [x] CI builds the app on Windows
- [ ] App icon, version metadata, and installer branding
- [ ] Tagged releases with changelog notes
- [ ] Auto-update mechanism

---

## Maintainer

Astrix Browser is built and maintained by **Suryandu Ganguly**, who owns every area of the project:

| Area | Scope |
|------|-------|
| **Browser Core** | Architecture, Electron main process, `BrowserView` integration, URL navigation, tab lifecycle, IPC bridge |
| **Frontend UI/UX** | React interface, toolbar, tab visuals, new-tab page, settings UI, styling and themes |
| **Security & Storage** | Security audits, permissions, bookmarks/history persistence |
| **QA & Release** | Test suite, CI, Windows packaging and releases |

---

## Requirements

- **Operating System**: Windows 10 / 11 (x64)
- **Node.js**: 22.6 or newer (the tests run TypeScript directly)
- **Git**: 2.30+
- **Code Editor**: Visual Studio Code or Antigravity IDE

---

## Setup & Running Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/suryandugy-glitch/astrix-browser.git
   cd astrix-browser
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run in development mode:**

   ```bash
   npm run dev
   ```

4. **Run tests & typecheck:**

   ```bash
   npm test        # 35 unit tests
   npm run lint    # TypeScript typecheck
   ```

5. **Build production executable:**

   ```bash
   npm run build
   npm run build:win
   ```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | Open new tab |
| `Ctrl+W` | Close active tab |
| `Ctrl+Shift+D` | Duplicate tab |
| `Ctrl+R` / `F5` | Reload page |
| `Ctrl+Shift+R` | Force reload (ignore cache) |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Switch to next / previous tab |
| `Ctrl+1` .. `Ctrl+8` | Switch to tab index 1–8 |
| `Ctrl+F` | Find text in page |
| `Ctrl+H` | Open Browsing History |
| `Ctrl+J` | Open Downloads manager |
| `Ctrl+D` | Bookmark current tab |
| `Ctrl+Shift+B` | Toggle Bookmarks Bar |
| `Ctrl+=` / `Ctrl+-` | Zoom in / Zoom out |
| `Ctrl+0` | Reset zoom to 100% |
| `Ctrl+P` | Print page |
| `F12` | Toggle Chrome DevTools |

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Test plan](docs/TEST_PLAN.md)
- [Changelog](CHANGELOG.md)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
