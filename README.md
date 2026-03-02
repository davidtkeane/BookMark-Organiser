# MarkFlow - The Ultimate AI-Powered Bookmark Manager 🎖️

MarkFlow is a lightning-fast, local-first bookmark manager that uses frontier AI to organize, enrich, and clean your chaotic bookmark collections. Built for developers, power users, and the Ranger Trinity, it handles 10,000+ bookmarks with ease.

## ✨ Key Features

*   **🧠 AI Assistant Panel (v3.10.0):** A professional, personalized chat widget. Identifies you by name, tracks conversation timestamps, and helps you search, summarize, or reorganize your library using natural language.
*   **🎮 Command Center UI:** A unified, sidebar-tabbed architecture for Settings, Wiki, and Data Management. Streamlined, professional, and optimized for high-performance workflows.
*   **🖼️ Visual Bento Grid:** A modern, asymmetrical grid layout that dynamically sizes cards based on content.
*   **🧠 AI Semantic Search:** Find bookmarks by meaning and intent, not just keywords, powered by the latest Gemini 3 models.
*   **🧠 Bookmark Intelligence Editor:** A powerful, multi-tabbed editor to manage metadata, tags, and AI-generated keywords.
*   **🤖 AI Keyword Generation:** Automatically analyze bookmark content to generate descriptive keywords and tags.
*   **🪄 Magic Sync:** One-click import from Chrome, Brave, Safari, and Firefox (macOS). Automatically detects installed browsers, merges bookmarks, and removes duplicates.
*   **🧠 AI Deep Clean:** Organize your unkempt bookmarks using Google's Gemini 3.1 Flash. Sort by Topic, Action/Intent, or Era.
*   **🩺 System Checks:** Batch link health checking (finds 404s) and duplicate detection with a sleek progress UI.
*   **🧟 Wayback Machine Integration:** Resurrect dead links via the Internet Archive with a single click.
*   **🎨 Theming Engine:** Professional Light, Dark, Matrix, and the official **Ranger** theme. All components, including AI popups, are fully theme-aware.
*   **💾 Tactical Data Vault:** Full SQLite database snapshots, automatic hourly backups, and standard Netscape HTML exports.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/davidtkeane/BookMark-Organiser.git
   cd BookMark-Organiser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development engine:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## 🛠️ Tech Stack
*   **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide Icons
*   **Backend:** Express.js, Node.js
*   **Database:** SQLite (`better-sqlite3`)
*   **AI:** Google Gemini API (`@google/genai` v1.43+)

## 🤝 Community & Support
MarkFlow is free and open-source. If you find it valuable, consider supporting the continued development of the project.

*   ☕ **Buy me a Coffee:** [davidtkeane](https://buymeacoffee.com/davidtkeane)
*   🔥 **Buy me a H3llCoin:** [h3llcoin.com](https://h3llcoin.com/)

## 🎖️ Credits
*   **Architect:** Commander David
*   **Engine Optimization:** The AI Trinity (Gemini Ranger, Claude Ranger, Ollama Ranger)

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

---
*Rangers lead the way!* 🎖️
