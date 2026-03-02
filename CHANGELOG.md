# Changelog

All notable changes to the MarkFlow Bookmark Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.14.0] - 2026-03-02

### Added
- **Visual Documentation Upgrade**: Integrated a high-resolution screenshot of the MarkFlow dashboard in action into the `README.md`. Provides users with an immediate visual reference for the UI, bento grid, and tactical intelligence modules.

## [3.13.0] - 2026-03-02

### Changed
- **High-Contrast Wiki Callouts**: Replaced low-contrast alert boxes in the Wiki with solid, high-fidelity tactical cards.
    - **Security (Green)**: Now uses a deep emerald background with white text for maximum readability.
    - **Warnings (Orange)**: Updated amber alerts to solid orange with white text.
    - **Troubleshooting (Red)**: Connection failures are now highlighted in deep rose with white text for immediate visual priority.

## [3.12.0] - 2026-03-02

### Added
- **API Security Vault**: Integrated detailed security instructions for Google Cloud API keys.
    - **Step-by-Step Guide**: Added instructions to the Wiki on how to create, link billing, and restrict keys.
    - **Restriction Intelligence**: New documentation on using IP Address and Website (Referrer) restrictions to protect billing accounts.
    - **Direct Documentation Links**: Added official Google Cloud documentation links to the Settings and Wiki modules for instant access to security best practices.

## [3.11.0] - 2026-03-02

### Added
- **Tactical Hero Banner**: Designed and integrated a high-fidelity SVG hero banner for the `README.md`. Features animated scanning effects, neural network nodes, and core Ranger branding for a professional frontier-AI aesthetic.

## [3.10.0] - 2026-03-02

### Added
- **Version Display**: Added the current application version (v3.10.0) directly in the sidebar under the Settings button for quick reference and professional transparency.

### Changed
- **Version Sync**: Synchronized `package.json` and the UI to reflect the latest stable build.

## [3.9.0] - 2026-03-02

### Added
- **Unified Action Styling**: Standardized the primary sidebar buttons (Magic Sync, Import HTML, View Roadmap) to use a consistent, theme-aware "Action Button" style.
- **Advanced Theme Integration**: Leveraged CSS variable inheritance to ensure action buttons automatically adapt to Light, Dark, Matrix, and Ranger themes without manual color overrides.

### Changed
- **Visual Consistency**: Replaced high-contrast gradients and heavy backgrounds with a subtle, professional aesthetic that improves UI focus.

## [3.8.0] - 2026-03-02

### Added
- **Integrated Support Dashboard**: Created a dedicated "Support" tab within the Settings modal.
    - **Community Support**: Relocated "Buy me a Coffee" and "Buy me a H3llCoin" buttons from the sidebar to this new centralized dashboard for a cleaner, more professional primary UI.
    - **Balanced Design**: Both support buttons are now uniform in size and style, featuring high-fidelity hover states.
- **Official Credits**: Added a project credits section in the Support tab, acknowledging the Commander David and the AI Trinity (Gemini, Claude, Ollama).
- **Roadmap Sync**: Updated the application Roadmap (Phase 7) to reflect the rapid progress in AI Personalization and Command Center architecture.

### Changed
- **Sidebar De-clutter**: Cleaned up the sidebar by moving external links into the Settings modal, allowing the user to focus strictly on their bookmark library.

## [3.7.0] - 2026-03-02

### Added
- **AI Personalization Engine**: Users can now provide their name in the Intelligence settings. MarkFlow AI will address you personally (e.g., "Hello Commander David!") in all chat interactions.
- **Message Timestamps**: Added precise timestamps to every chat message (user and AI) for better session tracking and a professional look.
- **Enhanced System Prompt**: Refined the AI's internal instructions to prioritize personalized interaction when a name is available.

## [3.6.0] - 2026-03-02

### Added
- **Click-to-Dismiss Modals**: Enabled "click outside to close" logic for Help, Command Center, and Settings modals. Users can now click anywhere on the backdrop to dismiss the active module.
- **H3llCoin Support**: Added a new "Buy me a H3llCoin" button to the sidebar, styled with an orange tactical palette and linked to h3llcoin.com.

## [3.5.0] - 2026-03-02

### Added
- **Sidebar-Tabbed Settings**: Overhauled the Settings modal into a professional, multi-tabbed interface.
    - **AI Engine**: Model selection, API connectivity, and neural usage stats.
    - **Interface**: System themes and Matrix brand customization.
    - **Intelligence**: Granular controls for the Proactive AI Assistant.
    - **Developer**: Full step-by-step Quickstart guide.
- **Theme-Aware Auto-Prompt**: The AI assistant popup now dynamically adjusts its coloring (background, text, progress bars) based on the active theme (Light, Dark, Matrix, or Ranger).

### Changed
- **Sidebar Polish**: Reduced the size of the "Buy Me a Coffee" button for a more balanced and compact sidebar layout.
- **Improved Toast UX**: Refined button states and hover effects for the inactivity assistant popup.

## [3.4.0] - 2026-03-02

### Added
- **Advanced Auto-Prompt Controls**: Integrated new granular settings for the Inactivity AI Assistant.
    - **Toggle System**: Easily enable/disable the proactive AI popup from the Smart Assistant dashboard.
    - **Custom Timing**: Added a reactive-to-patient slider (5s to 60s) to control when the assistant appears.
    - **Snooze Logic**: Introduced a "Snooze (5m)" option directly in the popup to silence alerts temporarily.
- **Overhauled AI Popup UI**: A high-fidelity "Excellent" toast notification.
    - **One-Click Dismissal**: Added a dedicated top-right 'X' button for instant closure.
    - **Tactical Visuals**: New dark-mode styling with glowing progress bars and animated intelligence icons.
    - **Smooth Animations**: Refined motion paths for a more premium application feel.

## [3.3.0] - 2026-03-02

### Added
- **AI Chat Widget Overhaul**: Transformed the AI Chat into a professional-grade assistant panel.
    - **Header Actions**: Added "Clear Chat" and "Export Chat" (.txt) buttons for better conversation management.
    - **Suggested Prompt Chips**: Integrated quick-action buttons for common tasks like searching recipes, checking dead links, and organizing folders.
    - **Message Interaction**: Added "Copy to Clipboard" buttons for AI responses and refined message headers.
    - **Auto-Scrolling**: The chat now automatically scrolls to the latest message or "Thinking" state.
    - **Visual Refinements**: Introduced a new start page with an Intelligence Dashboard, bouncing-dot typing indicators, and tactical shadows.

## [3.2.0] - 2026-03-02

### Added
- **Command Center Architecture**: Complete overhaul of the "Data & Backups" modal into a sidebar-tabbed "Command Center".
    - **Vault (Backups)**: Unified view for JSON snapshots, SQLite DB downloads, and Auto-Guard settings.
    - **Migration Tools**: Dedicated tools for browser-specific exports and direct source assignments.
    - **Security & Wipe**: Centralized "Danger Zone" for chat clearing and tactical database wipes.
- **Ranger Branding**: Integrated the official `ranger.png` logo across the application.
    - **Favicon**: Added the Ranger helmet as the browser tab icon.
    - **Sidebar Integration**: The logo now appears beside "MarkFlow" in the sidebar when the Ranger theme is active.
    - **Tab Title**: Updated to "MarkFlow - AI Bookmark Manager".
- **Advanced Wiki (v3.1.0)**: Refactored the help system into a modern, multi-tabbed knowledge base.
    - Added sections for **Basics**, **AI Intelligence**, **Sync & Import**, and **Troubleshooting**.

### Changed
- **UX Optimization**: Modals now have a fixed 80vh height with internal scrolling, preventing UI overflow on smaller screens and providing a "desktop-app" feel.
- **Typography & Icons**: Refined modal typography and updated icons to a more tactical, professional style.

### Fixed
- **JSX Syntax Fix**: Resolved a critical build error caused by stray braces in `App.tsx` during the modal refactor.
- **API Model Alignment**: Finalized model selection to use the latest 2026 Gemini 3 series by default.

## [3.1.0] - 2026-03-02

### Changed
- **Vite Environment Standardization**: Switched to standard Vite environment variable conventions.
    - Renamed `GEMINI_API_KEY` to `VITE_GEMINI_API_KEY` in `.env`, `README.md`, and all documentation.
    - Replaced `process.env` access with `import.meta.env.VITE_GEMINI_API_KEY` for client-side API calls.
    - Simplified `vite.config.ts` by removing manual `define` mappings.

### Fixed
- **AI Chat SDK Compatibility**: Updated the `handleChat` function to support the response structure of the latest `@google/genai` (v1.43.0) SDK. Fixed a crash where the assistant couldn't read model text or process tool calls.
- **Enhanced Debugging**: Added `console.error` logging to AI Chat for easier diagnosis of connectivity or model errors.

## [3.0.0] - 2026-03-02

### Added
- **Bookmark Intelligence Editor**: Replaced "Geek Mode" with a powerful, multi-tabbed bookmark editor.
    - **Edit Content Tab**: Directly modify titles, URLs, summaries, tags, and keywords.
    - **Metadata Tab**: View historical save dates, origin sources, and raw JSON data.
    - **AI Insights Tab**: Generate deep keywords and smart tags using Gemini AI.
- **AI Keyword Generation**: New `generateKeywordsWithAI` service to analyze bookmark content and suggest descriptive keywords.
- **Interactive Metadata**: Added a "Copy JSON" feature and "Refresh Icon" tool within the editor.
- **Gamification Update**: Awarding XP for saving manual edits and generating AI insights.

## [2.14.0] - 2026-03-02

### Added
- **Title Editing**: Edit bookmark titles directly in the detail view.
- **Auto-Fetch Title**: New "Magic Wand" button to fetch the page title from the URL.
- **Grid Spacing Fix**: Standard view now uses full width for columns with improved horizontal spacing.

## [2.13.0] - 2026-03-02

### Added
- **Grid Style Toggle**: Switch between "Standard" (uniform) and "Bento" (asymmetrical) grid layouts.
- **Clickable Status Badges**: Toggle "Checked" status directly from the bookmark card by clicking the badge.
- **Bento Grid Refinement**: Improved alignment and spacing with `auto-rows` logic.

## [2.12.0] - 2026-03-02

### Added
- **Bookmark Detail Pop-out**: Clicking a bookmark now opens a beautiful detailed view with full metadata.
- **Live Web Preview**: The detail view includes an iframe preview and a real-time health check.
- **Checked/Unchecked Status**: Track your reading progress with a toggleable status button.
- **Checked Category**: New sidebar filter for bookmarks marked as "Checked".
- **Bento Grid Refinement**: Improved the asymmetrical grid layout with better interaction states.

## [2.11.0] - 2026-03-02

### Added
- **Visual "Bento" Grid View:** Implemented a modern, asymmetrical grid layout for bookmarks with varied card sizes and enhanced styling.
- **AI-Powered Semantic Search:** Added a new search mode that uses Gemini to find bookmarks based on meaning and intent rather than just keywords.

## [2.10.0] - 2026-03-02

### Added
- **API Key Verification:** Added a "Test API Key Connection" button in Settings to verify Gemini API key validity and connectivity.

## [2.9.0] - 2026-03-02

### Added
- **Persistent AI Chat Button:** Added a floating action button in the bottom-right corner to easily re-open the AI chat at any time.
- **Enhanced Help Documentation:**
    - Added direct links to Google Cloud Billing for Gemini API setup.
    - Added a dedicated Troubleshooting section for M3 Macs and API key confusion.
    - Clarified the difference between AI Studio keys and standard Cloud keys.

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
