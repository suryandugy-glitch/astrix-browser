# Architecture Decision Record (ADR) 0001: Core Architecture and IPC Design

## Status
Accepted

## Context
Astrix Browser requires an architecture that can render real Chromium-based web pages inside an Electron window while providing modern multi-tab browsing, strict security isolation, and clear boundaries between Suryandu (Core/Integration), Gourab (UI/UX), and Soumik (Security/QA).

## Decision
1. **Desktop Shell & Framework**: Electron with Vite (`electron-vite`), React 18, and TypeScript.
2. **Web Content Embedding**: Use Electron's native `BrowserView` attached beneath a React-rendered toolbar container (fixed height: 78px).
3. **Multi-Tab Orchestration**: `TabManager` inside the Electron main process owns the source of truth for tab state and coordinates native `BrowserView` instances.
4. **IPC Contract**: Defined in `src/preload/index.d.ts` via `contextBridge.exposeInMainWorld('astrixAPI', ...)`. Direct Node/Electron modules are never exposed to the UI renderer.
5. **URL & Query Parsing**: Main process normalizes user input into valid URLs or search queries before navigation, enforcing `http:` and `https:` allowlists.

## Consequences
- Clean separation between UI rendering and Chromium web content.
- Native performance and full compatibility with modern web standards.
- Strong security baseline: remote websites cannot exploit renderer Node APIs.
