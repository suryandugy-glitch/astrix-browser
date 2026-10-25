# Astrix Browser — Quality Assurance & Test Plan

This document details test procedures and manual verification checklists for Astrix Browser releases.

## 1. Manual Acceptance Checklist

| Area | Verification Test | Expected Result |
|---|---|---|
| **Launch** | Execute `npm run dev` or packaged `.exe` | Window opens without console/terminal errors; clean shutdown on exit. |
| **Address Bar** | Type a valid URL (e.g. `https://example.com`) | Page loads in active view; URL bar reflects clean address. |
| **Search Query** | Type search terms (e.g. `astrix browser chromium`) | Omnibox converts term into search engine URL and results display. |
| **Back / Forward** | Navigate between 2+ URLs and click Back/Forward | Page travels history; Back/Forward buttons enable/disable correctly. |
| **Reload / Stop** | Click Reload while on a website | Current page reloads; button shows reload/stop states cleanly. |
| **Tab Creation** | Click `+` button in tab bar | New tab appears with default title and is activated. |
| **Tab Switching** | Click between open tabs | Underlying `BrowserView` swaps instantly with correct URL/page state. |
| **Tab Closing** | Click `x` on active or background tab | Tab closes cleanly; active tab shifts to adjacent tab; memory is released. |
| **Closing Last Tab**| Close the single remaining tab | A new default blank/start tab opens so browser does not lock up. |
| **Window Resize** | Resize and maximize application window | `BrowserView` automatically resizes without clipping or offset gaps. |
| **External Links** | Click a `target="_blank"` link on a page | Opens in a new Astrix tab instead of detached rogue popup window. |
| **Security** | Try executing `javascript:` or `file:` in omnibox | Navigation is rejected with no local file exposure. |

---

## 2. Unit & Integration Testing Roadmap

- `tests/urlUtils.test.ts`: Covers URL validation, prefixing `https://`, search query formatting, and protocol filtering.
- Automated Playwright/Spectron tests planned for Phase 5 (Owned by Soumik).
