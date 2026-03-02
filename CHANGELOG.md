# Changelog

All notable changes to the MarkFlow Bookmark Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.8.0] - 2026-03-02

### Added
- **Librarian Level-Up (Gamification):** Introduced a persistent XP and Level system. Earn XP by importing, organizing, and enriching bookmarks.
- **Persistent Stats:** XP is now saved to the local SQLite database.
- **Level Up Modal:** A new celebratory modal appears when you reach a new level.

### Changed
- **AI Auto-Prompt Refinements:**
    - The "Talk to AI" popup now automatically disappears after 5 seconds if not interacted with (visualized with a progress bar).
    - Dismissing the popup with the "X" button now silences it for 5 minutes.

## [2.7.0] - 2026-03-02

### Added
- **AI Chat Persistence:** Chat history is now saved to a local SQLite database, allowing the AI to remember past conversations and searches across sessions.
- **API Key Instructions:** Added a detailed guide in the Help & Wiki modal on how to obtain and configure a Google Gemini API key.
- **Chat Management:** Added a "Clear Chat History" option in the Data & Backups modal.

## [2.6.1] - 2026-03-02

### Fixed
- **Assistant Persistence:** The "Talk to AI" auto-prompt now stays visible when the mouse is moved, ensuring users can interact with the "Chat Now" button.
- **Import Error:** Fixed a `ReferenceError` where `useCallback` was missing from the React imports in `App.tsx`.

## [2.5.0] - 2026-03-01

### Added
- **Librarian Level-Up:** A new gamification system. Earn XP for importing, organizing, and cleaning your library. Unlock new curator titles as you level up!
- **Time Capsule Trigger:** Rediscover your past with the Time Capsule. Surfaces random bookmarks from your history with AI summarization options.
- **Level Progress UI:** Real-time XP tracking in the sidebar and a dedicated progress dashboard in Settings.
- **Level Up Celebration:** Animated modal when you reach a new Librarian Level.

### Changed
- **Roadmap:** Updated Phase 5 to include gamification and time capsule features.

## [2.4.0] - 2026-03-01

### Added
- **Morning Coffee Digest:** A new interactive daily selection of bookmarks to rediscover your library. Features "Brew Another Cup" and AI-powered summaries.
- **Duplicate DNA Detection:** Advanced fuzzy matching that scans for similar titles and content "DNA" beyond just exact URL matches.
- **DNA Scan Header:** Dedicated interface in the Duplicates tab for running advanced scans.

### Changed
- **Roadmap:** Updated to Phase 6, marking intelligence features as complete.
- **Sidebar:** Added "Morning Coffee" to Smart Views.

## [2.3.0] - 2026-03-01

### Added
- **Ranger Theme:** A new tactical, military-inspired theme with a Mandalorian aesthetic. Features a near-black palette with steel grey accents and sharp geometric edges.
- **Ranger Logo:** Integrated a custom Mandalorian helmet logo for the Ranger theme.
- **Settings Overhaul:** Replaced the basic setup guide with a comprehensive Settings modal.
- **AI Model Selection:** Users can now choose between Gemini 3 Flash, 3.1 Pro, and Flash Lite models.
- **AI Usage Dashboard:** Real-time tracking of tokens, estimated costs, and request counts (saved to local storage).
- **Consolidated Settings:** Appearance, AI, and Data management are now all accessible from a single unified interface.

### Changed
- **AI Chat:** Now respects the user's selected model and provides real-time cost feedback.
- **Sidebar:** Updated to dynamically change the logo based on the active theme.

## [2.2.0] - 2026-03-01

### Added
- **AI Chat Integration:** A new "Chat with your Library" panel powered by Gemini 3.1 Flash. Users can now search, move, and delete bookmarks using natural language commands.
- **Ghost Archiving (Local Time Capsule):** Added the ability to save a full HTML snapshot of any bookmarked page locally. Archived pages can be viewed even if the original site goes offline.
- **Automatic Hourly Backups:** Implemented a background task that creates a timestamped backup of the database every hour. The system automatically manages the last 10 backups to save space.
- **Raw Database Download:** Added a button in the Data & Backups modal to download the actual `bookmarks.db` SQLite file for advanced users.
- **Archive Viewer:** Integrated a local viewer for Ghost Archives, accessible directly from bookmark cards.

### Changed
- **Smart Views:** Added "AI Chat" as a dedicated entry in the sidebar's Smart Views section.
- **Bookmark Cards:** Updated both List and Grid views to include Ghost Archiving and Archive View action buttons.
- **Roadmap:** Updated the internal roadmap to reflect the completion of Phase 5's core features.

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
