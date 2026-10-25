# Architecture Decision Record (ADR) 0002: Shortcuts, Zooming, and Navigation Error Recovery

## Status
Accepted

## Context
Following the initial browser shell implementation, users require standard desktop browser ergonomics (keyboard shortcuts, zoom controls, developer tools) and graceful recovery when navigating to unreachable websites.

## Decision
1. **Application Menu & Accelerators**:
   - Implemented standard browser shortcuts (`CmdOrCtrl+T` for new tab, `CmdOrCtrl+W` for close tab, `CmdOrCtrl+R` for reload, `CmdOrCtrl+Shift+R` for hard reload, `CmdOrCtrl+1..8` for direct tab switching, `CmdOrCtrl+Tab` for cycling tabs).
   - Added Zoom controls (`CmdOrCtrl+=`, `CmdOrCtrl+-`, `CmdOrCtrl+0`) operating on the active `BrowserView` via `webContents.setZoomFactor()`.
   - Added `F12` accelerator to toggle Chrome DevTools on the active tab for inspection.
2. **Navigation Error Handling**:
   - Handled `did-fail-load` on each tab's `webContents`.
   - When a main-frame navigation fails (e.g. DNS failure, connection refused), load an internal friendly error page (`generateErrorPageHtml`) instead of exposing raw Chromium error screens.
   - User-aborted navigations (`errorCode === -3`) are ignored to avoid interrupting intentional redirections.
3. **Pluggable Search Engines**:
   - Added support for multiple search providers (Google, DuckDuckGo, Bing, Brave) managed by `TabManager` and exposed via IPC for user configuration.
4. **Audio State Monitoring**:
   - Monitored `media-started-playing` and `media-paused` to track tab audio state (`isAudible`), enabling tab-level mute control.

## Consequences
- The browser feels like a polished, responsive desktop app.
- Clear error feedback enhances user trust and reliability.
- Full compatibility with frontend settings and future UI enhancements.
