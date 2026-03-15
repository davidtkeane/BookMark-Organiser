# MarkFlow - The Ultimate AI-Powered Bookmark Manager

MarkFlow is a lightning-fast, local-first bookmark manager that uses AI to organize, enrich, and clean your chaotic bookmark collections. Built for developers and power users, it handles 10,000+ bookmarks with ease.

## ✨ Key Features

*   **🖼️ Visual Bento Grid:** A modern, asymmetrical grid layout that dynamically sizes cards based on content.
*   **🧠 AI Semantic Search:** Find bookmarks by meaning and intent, not just keywords, powered by Gemini.
*   **🧠 Bookmark Intelligence Editor:** A powerful, multi-tabbed editor to manage metadata, tags, and AI-generated keywords.
*   **🤖 AI Keyword Generation:** Automatically analyze bookmark content to generate descriptive keywords and tags.
*   **🖼️ Bookmark Detail Pop-out:** Beautiful detail view with full metadata, live web preview, and health checks.
*   **✅ Checked Status Tracking:** Keep track of your reading progress with a toggleable status and dedicated category.
*   **🪄 Magic Sync:** One-click import from Chrome, Brave, Safari, and Firefox (macOS). Automatically detects installed browsers, merges bookmarks, and removes duplicates.
*   **🧠 AI Deep Clean:** Organize your unkempt bookmarks using Google's Gemini 3.1 Flash. Sort by Topic, Action/Intent, or Era.
*   **🤖 AI Enrichment:** Auto-generate 1-sentence summaries and relevant smart tags for your bookmarks.
*   **🩺 System Checks:** Batch link health checking (finds 404s) and duplicate detection with a sleek progress UI.
*   **🧟 Wayback Machine Integration:** Resurrect dead links via the Internet Archive with a single click.
*   **⏱️ Time Machine View:** Sort bookmarks chronologically by their original creation date, even from 15-year-old HTML exports.
*   **🤓 Geek Mode:** View raw metadata (JSON, source browser, exact timestamps) and force-fetch missing favicons via DuckDuckGo.
*   **⚡ High-Performance UI:** Pagination (100 items/page), breadcrumb navigation, and high-res Google Favicons allow the app to handle 10,000+ bookmarks without breaking a sweat.
*   **💾 Data Portability:** Full SQLite database JSON backups, restores, and standard Netscape HTML exports.
*   **🎨 Theming:** Choose between Light, Dark, and Matrix themes.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/markflow.git
   cd markflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## 🛠️ Tech Stack
*   **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons
*   **Backend:** Express.js, Node.js
*   **Database:** SQLite (`better-sqlite3`)
*   **AI:** Google Gemini API (`@google/genai`)

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/markflow/issues).

## ☕ Support
If you find this tool useful, consider supporting its development!

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=davidtkeane&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/davidtkeane)

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
