# Changelog

All notable changes to the MarkFlow Bookmark Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-03-01

### Fixed
- **Modal Theming:** Fixed a critical UI bug where the Help & Wiki and Geek Mode modals did not correctly adapt to Dark and Matrix themes. They now use theme-aware CSS variables for consistent styling across all modes.
- **Geek Mode UI:** Refactored Geek Mode to follow the global theme (Light/Dark/Matrix) while maintaining its technical, terminal-style layout.

## [2.1.0] - 2026-03-01

### Added
- **Geek Mode:** A new terminal-style modal for viewing raw bookmark metadata (JSON, Date Saved, Source Browser).
- **Force Fetch Icon:** Added a button in Geek Mode to override missing favicons with DuckDuckGo's icon service.
- **Breadcrumbs:** Added folder path breadcrumbs to bookmark cards in both list and grid views.
- **Dynamic Tabs:** Clicking a folder in the sidebar now creates a dynamic tab at the top of the view for better navigation context.
- **Buy Me a Coffee:** Added a support button to the sidebar.

### Changed
- **Help & Wiki Theming:** The Help & Wiki modal now fully supports Dark and Matrix themes for better accessibility.
- **Clear Database Warning:** Updated the warning text to explicitly clarify that clearing the local database does not affect the user's actual browser bookmarks.

## [2.0.0] - 2026-03-01

### Added
- **Magic Sync:** One-click synchronization across all installed local browsers (Chrome, Brave, Safari, Firefox).
- **AI Deep Clean:** Advanced organization modal allowing users to sort bookmarks by Topic, Action/Intent, or Era using Gemini 3.1 Flash.
- **Time Machine View:** A new Smart View that sorts all bookmarks chronologically by their original creation date.
- **System Checks Modal:** A unified, animated progress modal for finding duplicates and batch-checking link health.
- **Pagination:** Implemented pagination (100 items/page) for both List and Grid views to ensure lightning-fast performance with 10,000+ bookmarks.
- **Theming:** Added Dark Mode and Matrix themes with persistent `localStorage` saving.
- **Advanced Data Management:** Added a "Data & Backups" modal for full database JSON backups, restores, and browser-specific exports.

### Changed
- **Performance Overhaul:** Replaced slow OpenGraph image scraping with Google's High-Res Favicon API, drastically improving Grid View load times.
- **Uncategorized Logic:** Updated the "Uncategorized" filter to automatically include default browser folders (e.g., "Bookmarks Bar", "Other Bookmarks").
- **Health Checks:** Link health checking now processes in safe batches of 50 to prevent network freezing and API rate limits.

## [1.1.0] - 2026-03-01

### Added
- **Local Browser Auto-Discovery:** Automatically detects installed browsers on macOS (Chrome, Brave, Safari, Firefox).
- **Direct Browser Import:** One-click import directly from local browser profiles (parses JSON, Plist, and SQLite databases natively).
- **Backup & Restore:** Added ability to download a complete JSON backup of the SQLite database and restore from it.

### Changed
- **Export Format:** Upgraded the "Export View" feature to export in the standard Netscape Bookmark HTML format, allowing seamless syncing/importing back into traditional web browsers.

## [1.0.0] - 2026-03-01

### Added
- **Visual Grid View:** Added a masonry-style grid layout option for bookmarks.
- **OpenGraph Images:** Automatically fetches and caches OpenGraph/Twitter card images for bookmarks in Grid View.
- **Read-It-Later Mode:** Added a "Read Later" toggle for bookmarks and a dedicated Smart View in the sidebar.
- **Shareable Collections:** Added the ability to export specific filtered views or folders.
- **View Toggles:** Added UI controls to seamlessly switch between List and Grid views.

## [0.9.0] - 2026-03-01

### Added
- **Link Health Checker:** Added an API endpoint and UI to ping URLs and identify dead links (404s, timeouts).
- **Wayback Machine Integration:** Added a "Resurrect" button for dead links that automatically queries the Internet Archive API to find and update the URL to the latest working snapshot.
- **Duplicate Finder:** Added a tool to scan the database and flag bookmarks with identical URLs.
- **Smart Views:** Added "Dead Links" and "Duplicates" to the sidebar for easy management.

## [0.8.0] - 2026-03-01

### Added
- **AI Organization:** Integrated Google's Gemini API (`gemini-3-flash-preview`) to automatically categorize uncategorized bookmarks into logical folders.
- **AI Enrichment:** Added ability to use Gemini AI to read bookmark titles/URLs and generate 1-sentence summaries and relevant smart tags.

## [0.1.0] - 2026-03-01

### Added
- **Full-Stack Architecture:** Initialized project with React, Vite, Express, and Tailwind CSS.
- **Persistent Storage:** Implemented local SQLite database (`better-sqlite3`) with WAL mode for fast, reliable storage.
- **Universal Importer:** Added a drag-and-drop HTML file parser to import standard browser bookmark exports.
- **Core UI:** Built the main dashboard, sidebar navigation, search bar, and bookmark list components.
- **Status Badges:** Added visual indicators for bookmark states (Active, Dead Link, Duplicate, Redirect, Archived, Unchecked).
