# Astrix Browser

An independent Chromium-based browser distribution built for speed, security, privacy, and a modern browsing experience.

## Status
Full Modern Desktop Browser MVP. Implemented features:

### Implemented Browser Core & Shell
- [x] **Multi-Tab Engine**: Create, switch, close, close others, duplicate, and active tab state.
- [x] **Omnibox & Search**: Direct URL navigation with protocol normalization and search providers (Google, DuckDuckGo, Brave, Bing).
- [x] **Browser Controls**: Back, Forward, Reload, Force Reload (ignore cache), Stop, and Home.
- [x] **Bookmarks System**: Star button in Omnibox, persistent Bookmarks Bar, and storage persistence.
- [x] **Browsing History (`Ctrl+H`)**: Searchable history database with timestamps and single-click clear.
- [x] **Downloads Manager (`Ctrl+J`)**: Native download tracking with progress bars, pause/resume, and folder reveal.
- [x] **Find in Page (`Ctrl+F`)**: In-page search with real-time match counters, forward/backward navigation, and highlighting.
- [x] **Settings Panel**: Configure default search engine, bookmarks bar visibility, start page, and privacy controls.
- [x] **Site Security Inspector**: Omnibox security badge showing TLS encryption, protocol, and sandbox status.
- [x] **Web & Tab Context Menus**: Native right-click menus for links, text selection, images, inspection, and tab lifecycle.
- [x] **Keyboard Shortcuts**: Standard accelerators for tabs, navigation, zooming, history, find, and print.
- [x] **Page Zooming**: Incremental zoom controls (`Ctrl+=`, `Ctrl+-`, `Ctrl+0`) with factor clamping.
- [x] **Audio & Tab Muting**: Tab speaker waves indicator and click-to-mute.
- [x] **Strict Security Sandbox**: `contextIsolation: true`, `nodeIntegration: false`, sandboxed web contents, and default-deny permissions.

---

## Architecture & Team Ownership

Astrix Browser is developed by a dedicated 3-person team:

| Team Member | Role | Primary Ownership |
|---|---|---|
| **Suryandu Ganguly** | Team Lead & Browser Core Developer | Architecture, Electron main process, `BrowserView` integration, URL navigation, tabs lifecycle, IPC bridge, code review |
| **Gourab Bhaumik** | Frontend UI/UX Developer | React interface, toolbar, tabs visuals, new-tab page, settings UI, styling & themes |
| **Soumik Barman** | Security, Storage, QA & Release | Security audits, bookmarks/history persistence, test suite, permissions, Windows packaging |

---

## Requirements

- **Operating System**: Windows 10 / 11 (x64)
- **Node.js**: LTS version 20.x or 22.x+ (Node `v24.x` supported)
- **Git**: 2.30+
- **Code Editor**: Visual Studio Code or Antigravity IDE

---

## Setup & Running Locally

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/suryandugy-glitch/astrix-browser.git
   cd astrix-browser
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Run in development mode:**
   ```powershell
   npm run dev
   ```

4. **Run tests & typecheck:**
   ```powershell
   npm test
   npm run lint
   ```

5. **Build production executable:**
   ```powershell
   npm run build
   npm run build:win
   ```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
