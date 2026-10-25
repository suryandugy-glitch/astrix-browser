# Astrix Browser

An independent Chromium-based browser distribution built for speed, security, privacy, and a modern browsing experience.

## Status
Prototype / MVP Foundation. Implemented features and known limitations:

### Implemented (Browser Core & Shell)
- [x] Multi-tab lifecycle: create, switch, close, and active tab management
- [x] Omnibox / address bar: direct URL entry and search query handling
- [x] Navigation engine: Back, Forward, Reload, Stop, and loading state updates
- [x] Web content rendering: isolated `BrowserView` integration inside the desktop window
- [x] Security architecture: context isolation enabled, nodeIntegration disabled, safe IPC allowlist
- [x] Popup & external navigation policy: popups handled safely as managed browser tabs
- [x] Default Start / New Tab page with quick search and shortcuts

### Planned Roadmap
- [ ] UI Theme & Visual Polish (Owned by Gourab)
- [ ] Bookmarks and History persistence (Owned by Soumik)
- [ ] Downloads management & file validation (Owned by Soumik)
- [ ] User preferences & settings panel (Owned by Gourab & Soumik)

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
- **Node.js**: LTS version 20.x or 22.x+ (Node `v24.x` also supported)
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

4. **Build production executable:**
   ```powershell
   npm run build
   npm run build:win
   ```

---

## Project Structure

```text
astrix-browser/
├── .github/              # Issue templates, PR template, CI workflows
├── docs/                 # Architecture, security baseline, QA test plan
│   ├── ARCHITECTURE.md   # Core design & IPC interface contracts
│   ├── SECURITY.md       # Security rules & safe Electron practices
│   └── TEST_PLAN.md      # Manual test checklist & QA procedures
├── src/
│   ├── main/             # Electron main process & browser core (Suryandu)
│   │   ├── index.ts      # App entry point, lifecycle & window management
│   │   ├── tabManager.ts # Tab model, BrowserView management & navigation
│   │   ├── urlUtils.ts   # URL validation, normalization & search query mapping
│   │   └── types.ts      # Shared main process data structures
│   ├── preload/          # Narrow, safe bridge between Main and UI (Suryandu + Soumik)
│   │   ├── index.ts      # contextBridge.exposeInMainWorld API implementation
│   │   └── index.d.ts    # Window.astrixAPI TypeScript type definitions
│   └── renderer/         # React + TypeScript user interface (Gourab)
│       ├── index.html    # Chrome container HTML
│       └── src/
│           ├── App.tsx   # Top-level browser chrome orchestrator
│           ├── components/
│           │   ├── TabBar.tsx     # Tab list, active state, new tab & close buttons
│           │   ├── Toolbar.tsx    # Back, Forward, Reload, Omnibox address bar
│           │   └── NewTabPage.tsx # Start page for fresh tabs
│           └── assets/   # Styles and assets
└── tests/                # Test suites & verification scripts
```

---

## Security

Astrix Browser handles untrusted remote web pages. The following principles are strictly enforced:
- **Node.js Integration is disabled** for all remote web content.
- **Context Isolation is enabled** across all renderer windows and views.
- **Preload API is minimal**: Only explicit browser actions (`tab:create`, `tab:navigate`, etc.) are exposed.
- **Safe navigation**: Arbitrary dangerous protocols (`javascript:`, `file:`) are blocked.
- **Pop-up protection**: Remote websites cannot open arbitrary untracked windows; requests are inspected and contained within tabs.

Report security vulnerabilities privately to project maintainers. Do not publish credentials or secrets to public repositories.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
