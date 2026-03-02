# MarkFlow - The Ultimate AI-Powered Bookmark Manager

MarkFlow is a lightning-fast, local-first bookmark manager that uses AI to organize, enrich, and clean your chaotic bookmark collections. Built for developers and power users, it handles 10,000+ bookmarks with ease.

## ✨ Key Features

*   **🪄 Magic Sync:** One-click import from Chrome, Brave, Safari, and Firefox (macOS). Automatically detects installed browsers, merges bookmarks, and removes duplicates.
*   **🧠 AI Deep Clean:** Organize your unkempt bookmarks using Google's Gemini 3.1 Flash. Sort by Topic, Action/Intent, or Era.
*   **🤖 AI Enrichment:** Auto-generate 1-sentence summaries and relevant smart tags for your bookmarks.
*   **🩺 System Checks:** Batch link health checking (finds 404s) and duplicate detection with a sleek progress UI.
*   **🧟 Wayback Machine Integration:** Resurrect dead links via the Internet Archive with a single click.
*   **⏱️ Time Machine View:** Sort bookmarks chronologically by their original creation date, even from 15-year-old HTML exports.
*   **⚡ High-Performance UI:** Pagination (100 items/page) and high-res Google Favicons allow the app to handle 10,000+ bookmarks without breaking a sweat.
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

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
