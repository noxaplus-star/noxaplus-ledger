# Changelog

All notable changes to NoxaPlus Ledger are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] — 2026-11-12

### Fixed

- Root `index.html` now opens the full ledger directly from disk, without Node.js or a server.
- Embed JavaScript, CSS, and fonts to avoid file-origin module restrictions.
- Move the development entry to `app/` and refresh the standalone HTML on each build.
- Register the service worker only over HTTP(S) and document file-origin storage limitations.

## [1.0.0] — 2026-11-12

First public release.

### Added

- Jalali calendar core with month lengths, leap years, weekday names and date-key arithmetic.
- Persian-aware money parsing and formatting, including compact units and signed-value isolation for RTL layouts.
- Income and expense tracking with notes, accounts and categories.
- Multiple accounts with opening balances and a live total.
- Keyword rules that suggest and retroactively apply categories.
- Monthly budgets per expense category with overall and per-category progress.
- Dashboard with monthly totals, six-month trend chart, expense composition and top transactions.
- Reports with six- and twelve-month ranges, category breakdown, largest expenses and print layout.
- CSV export with an English header row and CSV import with aliases, preview and validation.
- Versioned JSON backup and restore with strict schema validation.
- Demo dataset covering six months of realistic transactions.
- Undo/redo history for 40 changes, plus undo toasts for destructive actions.
- Light and dark themes, Persian/Latin digit toggle and persisted settings.
- Responsive desktop and mobile navigation, accessible dialogs, empty states and toasts.
- Installable PWA with an offline app shell and service worker precaching.
- README, contribution guide, security policy, code of conduct and MIT license.
- GitHub Actions workflows for CI and GitHub Pages deployment.

### Fixed

- Signed amounts now render their sign on the leading edge inside RTL text.
- The mobile amount field no longer overflows its dialog.
- Chart axes label months by name instead of number.
- CSV input is rendered left-to-right for readability.
- The top-bar add button keeps an accessible name when its text label is hidden.

[1.0.0]: https://github.com/noxaplus-star/noxaplus-ledger/releases/tag/v1.0.0
