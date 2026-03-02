import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

// Initialize SQLite Database for permanent storage
const db = new Database('bookmarks.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    title TEXT,
    url TEXT,
    status TEXT,
    folder TEXT,
    dateAdded TEXT,
    summary TEXT,
    tags TEXT,
    imageUrl TEXT,
    readLater INTEGER DEFAULT 0
  );
`);

// Safe migrations for existing databases
try { db.exec('ALTER TABLE bookmarks ADD COLUMN summary TEXT;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN tags TEXT;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN imageUrl TEXT;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN readLater INTEGER DEFAULT 0;'); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for large bookmark files
  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  app.get("/api/bookmarks", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM bookmarks');
      const rows = stmt.all().map((r: any) => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
      }));
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/bookmarks/batch", (req, res) => {
    const { bookmarks } = req.body;
    try {
      const insert = db.prepare('INSERT OR REPLACE INTO bookmarks (id, title, url, status, folder, dateAdded, summary, tags, imageUrl, readLater) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const insertMany = db.transaction((bms) => {
        for (const b of bms) {
          insert.run(b.id, b.title, b.url, b.status, b.folder, b.dateAdded, b.summary || null, b.tags ? JSON.stringify(b.tags) : null, b.imageUrl !== undefined ? b.imageUrl : null, b.readLater ? 1 : 0);
        }
      });
      insertMany(bookmarks);
      res.json({ success: true, count: bookmarks.length });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/bookmarks/clear", (req, res) => {
    try {
      db.prepare('DELETE FROM bookmarks').run();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Health check endpoint
  app.post("/api/check-health", async (req, res) => {
    const { url } = req.body;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD', 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        res.json({ status: 'alive' });
      } else if (response.status >= 300 && response.status < 400) {
        res.json({ status: 'redirect' });
      } else {
        res.json({ status: 'dead' });
      }
    } catch (error) {
      res.json({ status: 'dead', error: String(error) });
    }
  });

  // OpenGraph Image endpoint
  app.post("/api/og-image", async (req, res) => {
    const { url } = req.body;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarkFlowBot/1.0)' },
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      const html = await response.text();
      
      let imageUrl = null;
      const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
      if (ogMatch && ogMatch[1]) {
        imageUrl = ogMatch[1];
        if (imageUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imageUrl = `${urlObj.origin}${imageUrl}`;
        }
      }
      res.json({ imageUrl });
    } catch (error) {
      res.json({ imageUrl: null });
    }
  });

  // Wayback Machine endpoint
  app.post("/api/wayback", async (req, res) => {
    const { url } = req.body;
    try {
      const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.archived_snapshots && data.archived_snapshots.closest) {
        res.json({ available: true, url: data.archived_snapshots.closest.url });
      } else {
        res.json({ available: false });
      }
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
