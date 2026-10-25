# Astrix Browser — First Team Meeting Notes

**Date**: Sprint 1 Kickoff  
**Attendees**: 
- Suryandu Ganguly (Team Lead & Browser Core Developer)
- Gourab Bhaumik (Frontend UI/UX Developer)
- Soumik Barman (Security, Storage, QA & Release)

---

## 1. Project & Scope Alignment

- **Project Identity**: Astrix Browser is an independent Chromium-based browser distribution.
- **Branding Rule**: Described only as our own Chromium-based distribution without naming or comparing against other browsers in branding or documentation.
- **MVP Target (Phases 1-3)**:
  - Desktop window loading real websites in isolated `BrowserView`s
  - Multi-tab management (create, switch, close)
  - Navigation omnibox with multi-provider search
  - Secure defaults (no Node.js access in websites, context isolation, blocked unsafe protocols)
  - Custom Astrix Start / New Tab page

---

## 2. API Contract & Handoff Agreement

The IPC API bridge (`window.astrixAPI`) has been finalized and typed in [`src/preload/index.d.ts`](file:///C:/Users/surya/.gemini/antigravity/scratch/astrix-browser/src/preload/index.d.ts):
- `createTab(url?)`
- `switchTab(tabId)`
- `closeTab(tabId?)`
- `navigate(tabId, input)`
- `goBack()`, `goForward()`, `reload()`, `reloadIgnoringCache()`, `stop()`
- `zoomIn()`, `zoomOut()`, `resetZoom()`, `toggleDevTools()`
- `setSearchEngine(engine)`
- `onTabsUpdated(callback)`

---

## 3. Sprint 1 Task Assignments & GitHub Issues

### A. Gourab Bhaumik (Frontend UI/UX)
- **Branch**: `feat/ui-polish`
- **Deliverables**:
  1. Enhance tab visual styling: curved tabs, active tab contrast, smooth hover transitions.
  2. Implement customizable shortcut tiles and search box styling on [`NewTabPage.tsx`](file:///C:/Users/surya/.gemini/antigravity/scratch/astrix-browser/src/renderer/src/components/NewTabPage.tsx).
  3. Create Settings UI modal for selecting default search engine (`google`, `duckduckgo`, `bing`, `brave`).
  4. Address bar auto-selection on focus (`CmdOrCtrl+L` / click).

### B. Soumik Barman (Security, Storage, QA & Release)
- **Branch**: `feat/persistence-and-security`
- **Deliverables**:
  1. Design JSON/SQLite persistence schema for bookmarks and browsing history.
  2. Implement storage service in `src/main/` with safe IPC channels (`bookmarks:add`, `bookmarks:get`, `history:get`).
  3. Audit Electron webPreferences and confirm permission request handler rules.
  4. Execute manual test checklist from [`docs/TEST_PLAN.md`](file:///C:/Users/surya/.gemini/antigravity/scratch/astrix-browser/docs/TEST_PLAN.md).

### C. Suryandu Ganguly (Team Lead & Browser Core)
- **Branch**: `feat/core-engine`
- **Deliverables**:
  1. Review pull requests from Gourab and Soumik.
  2. Monitor build stability and GitHub Actions CI.
  3. Window state persistence (remember last window position & dimensions on startup).
  4. Downloads lifecycle manager stub (`session.on('will-download')`).

---

## 4. Next Demo & Review

- **Weekly Demo**: Every Friday 4:00 PM
- **Branch Strategy**: Feature branches PR'd into `main` after CI green checkmark and code review.
