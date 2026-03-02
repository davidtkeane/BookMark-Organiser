import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import os from 'os';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
    readLater INTEGER DEFAULT 0,
    source TEXT DEFAULT 'manual'
  );
`);

// Safe migrations for existing databases
try { db.exec('ALTER TABLE bookmarks ADD COLUMN summary TEXT;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN tags TEXT;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN imageUrl TEXT;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN readLater INTEGER DEFAULT 0;'); } catch (e) {}
try { db.exec('ALTER TABLE bookmarks ADD COLUMN source TEXT DEFAULT "manual";'); } catch (e) {}

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
      const insert = db.prepare('INSERT OR REPLACE INTO bookmarks (id, title, url, status, folder, dateAdded, summary, tags, imageUrl, readLater, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const insertMany = db.transaction((bms) => {
        for (const b of bms) {
          insert.run(b.id, b.title, b.url, b.status, b.folder, b.dateAdded, b.summary || null, b.tags ? JSON.stringify(b.tags) : null, b.imageUrl !== undefined ? b.imageUrl : null, b.readLater ? 1 : 0, b.source || 'manual');
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

  // Backup and Restore
  app.get("/api/backup", (req, res) => {
    const backup = db.prepare('SELECT * FROM bookmarks').all();
    res.json(backup);
  });

  // Local Browser Paths (Mac)
  const home = os.homedir();
  const browserPaths = {
    chrome: path.join(home, 'Library/Application Support/Google/Chrome/Default/Bookmarks'),
    brave: path.join(home, 'Library/Application Support/BraveSoftware/Brave-Browser/Default/Bookmarks'),
    safari: path.join(home, 'Library/Safari/Bookmarks.plist'),
    firefox: path.join(home, 'Library/Application Support/Firefox/Profiles')
  };

  app.get("/api/local-browsers", (req, res) => {
    const installed = { chrome: false, brave: false, safari: false, firefox: false };
    if (fs.existsSync(browserPaths.chrome)) installed.chrome = true;
    if (fs.existsSync(browserPaths.brave)) installed.brave = true;
    if (fs.existsSync(browserPaths.safari)) installed.safari = true;
    if (fs.existsSync(browserPaths.firefox)) {
      try {
        const profiles = fs.readdirSync(browserPaths.firefox);
        if (profiles.some(p => p.includes('.default'))) installed.firefox = true;
      } catch (e) {}
    }
    res.json(installed);
  });

  app.post("/api/import-browser/:browser", (req, res) => {
    const browser = req.params.browser;
    const imported: any[] = [];
    
    try {
      if ((browser === 'chrome' || browser === 'brave') && fs.existsSync(browserPaths[browser])) {
        const data = JSON.parse(fs.readFileSync(browserPaths[browser], 'utf8'));
        const parseNode = (node: any, folderName: string) => {
          if (node.type === 'url') {
            const dateAdded = node.date_added ? new Date(parseInt(node.date_added) / 1000 - 11644473600000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            imported.push({ id: Math.random().toString(36).substr(2, 9), title: node.name || 'Untitled', url: node.url, status: 'unknown', folder: folderName, dateAdded, source: browser });
          } else if (node.type === 'folder' && node.children) {
            node.children.forEach((child: any) => parseNode(child, node.name || folderName));
          }
        };
        if (data.roots) {
          Object.values(data.roots).forEach((root: any) => parseNode(root, 'Imported'));
        }
      } else if (browser === 'safari' && fs.existsSync(browserPaths.safari)) {
        const jsonStr = execSync(`plutil -convert json -r -o - "${browserPaths.safari}"`).toString();
        const data = JSON.parse(jsonStr);
        const parseSafariNode = (node: any, folderName: string) => {
          if (node.WebBookmarkType === 'WebBookmarkTypeLeaf') {
            imported.push({ id: Math.random().toString(36).substr(2, 9), title: node.URIDictionary?.title || 'Untitled', url: node.URLString, status: 'unknown', folder: folderName, dateAdded: new Date().toISOString().split('T')[0], source: 'safari' });
          } else if (node.WebBookmarkType === 'WebBookmarkTypeList' && node.Children) {
            node.Children.forEach((child: any) => parseSafariNode(child, node.Title || folderName));
          }
        };
        if (data.Children) data.Children.forEach((child: any) => parseSafariNode(child, 'Imported'));
      } else if (browser === 'firefox' && fs.existsSync(browserPaths.firefox)) {
        const profiles = fs.readdirSync(browserPaths.firefox);
        const defaultProfile = profiles.find(p => p.includes('.default-release') || p.includes('.default'));
        if (defaultProfile) {
          const placesPath = path.join(browserPaths.firefox, defaultProfile, 'places.sqlite');
          if (fs.existsSync(placesPath)) {
            const tempPath = path.join(os.tmpdir(), 'temp_places.sqlite');
            fs.copyFileSync(placesPath, tempPath);
            const ffDb = new Database(tempPath, { readonly: true });
            const rows = ffDb.prepare(`SELECT b.title, p.url, b.dateAdded FROM moz_bookmarks b JOIN moz_places p ON b.fk = p.id WHERE b.type = 1 AND p.url LIKE 'http%'`).all();
            rows.forEach((r: any) => {
              const dateAdded = r.dateAdded ? new Date(r.dateAdded / 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
              imported.push({ id: Math.random().toString(36).substr(2, 9), title: r.title || 'Untitled', url: r.url, status: 'unknown', folder: 'Imported', dateAdded, source: 'firefox' });
            });
            ffDb.close();
            fs.unlinkSync(tempPath);
          }
        }
      }
      
      // Save to DB
      if (imported.length > 0) {
        const insert = db.prepare('INSERT OR REPLACE INTO bookmarks (id, title, url, status, folder, dateAdded, source) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const insertMany = db.transaction((bms) => {
          for (const b of bms) insert.run(b.id, b.title, b.url, b.status, b.folder, b.dateAdded, b.source);
        });
        insertMany(imported);
      }
      res.json({ success: true, count: imported.length, bookmarks: imported });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
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
