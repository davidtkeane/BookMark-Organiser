import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, Link as LinkIcon, AlertTriangle, Trash2, Search, 
  Activity, Copy, Sparkles, Settings, ChevronRight, ChevronDown, 
  MoreVertical, CheckCircle2, XCircle, Loader2, Info, Download, UploadCloud, ListTodo,
  Wand2, ArchiveRestore, LayoutGrid, List, Image as ImageIcon, BookOpen, Share2,
  Chrome, Compass, DownloadCloud, UploadCloud as UploadCloudIcon, Database,
  RefreshCw, Clock, HelpCircle, Terminal
} from 'lucide-react';
import { motion } from 'motion/react';
import { categorizeBookmarksWithAI, enrichBookmarksWithAI } from './services/gemini';

export default function App() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showChecksModal, setShowChecksModal] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0, status: '' });
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [geekModeBookmark, setGeekModeBookmark] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const getTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
  };

  const checkDuplicateFile = (file: File) => {
    const fingerprint = `${file.name}-${file.size}-${file.lastModified}`;
    const imported = JSON.parse(localStorage.getItem('imported_files') || '[]');
    if (imported.includes(fingerprint)) {
      return !window.confirm(`The file "${file.name}" has already been imported into MarkFlow previously.\n\nAre you sure you want to import it again?`);
    }
    imported.push(fingerprint);
    localStorage.setItem('imported_files', JSON.stringify(imported));
    return false;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'matrix'>(() => {
    return (localStorage.getItem('theme') as any) || 'light';
  });
  const [localBrowsers, setLocalBrowsers] = useState<any>({ chrome: false, brave: false, safari: false, firefox: false });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch bookmarks and local browsers on mount
  useEffect(() => {
    fetch('/api/bookmarks')
      .then(res => res.json())
      .then(data => {
        setBookmarks(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });

    fetch('/api/local-browsers')
      .then(res => res.json())
      .then(data => setLocalBrowsers(data))
      .catch(() => {});
  }, []);

  const saveBookmarksToDB = async (newBookmarks: any[]) => {
    try {
      await fetch('/api/bookmarks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks: newBookmarks })
      });
      setBookmarks(newBookmarks);
    } catch (e) {
      console.error("Failed to save to DB", e);
    }
  };

  const clearDatabase = async () => {
    if (!confirm("Are you sure you want to delete all bookmarks?")) return;
    await fetch('/api/bookmarks/clear', { method: 'POST' });
    setBookmarks([]);
  };

  const handleMagicSync = async () => {
    if (!window.confirm("Tip: It's highly recommended to backup your current data before a big sync!\n\nDo you want to proceed with Magic Sync?")) {
      return;
    }
    setIsSyncing(true);
    try {
      const browsersToSync = Object.keys(localBrowsers).filter(b => localBrowsers[b]);
      if (browsersToSync.length === 0) {
        alert("No local browsers detected to sync.");
        setIsSyncing(false);
        return;
      }

      let totalImported = 0;
      for (const browser of browsersToSync) {
        try {
          const res = await fetch(`/api/import-browser/${browser}`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            totalImported += data.count;
          }
        } catch (e) {
          console.error(`Failed to sync ${browser}`, e);
        }
      }

      if (totalImported > 0) {
        alert(`Magic Sync Complete! Synced ${totalImported} bookmarks from ${browsersToSync.join(', ')}.`);
        const bmsRes = await fetch('/api/bookmarks');
        const bmsData = await bmsRes.json();
        setBookmarks(bmsData);
      } else {
        alert("Magic Sync finished, but no new bookmarks were found.");
      }
    } catch (e) {
      alert("Error during Magic Sync.");
    }
    setIsSyncing(false);
  };

  const handleImportLocalBrowser = async (browser: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/import-browser/${browser}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully imported ${data.count} bookmarks from ${browser}!`);
        // Refresh bookmarks
        const bmsRes = await fetch('/api/bookmarks');
        const bmsData = await bmsRes.json();
        setBookmarks(bmsData);
      } else {
        alert("Failed to import: " + data.error);
      }
    } catch (e) {
      alert("Error importing from local browser.");
    }
    setIsLoading(false);
  };

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `markflow-full-backup-${getTimestamp()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      alert("Failed to create backup.");
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (checkDuplicateFile(file)) {
      if (restoreInputRef.current) restoreInputRef.current.value = '';
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data)) throw new Error("Invalid backup format");
        await saveBookmarksToDB(data);
        alert("Backup restored successfully!");
        setShowDataModal(false);
      } catch (err) {
        alert("Error parsing backup file.");
      }
      setIsLoading(false);
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleBrowserRestore = (e: React.ChangeEvent<HTMLInputElement>, selectedSource: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (checkDuplicateFile(file)) {
      // Need to clear the input, but we don't have a direct ref to the dynamic input here easily,
      // so we just return. The user can refresh if they want to re-select the exact same file.
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data)) throw new Error("Invalid backup format");
        
        // Tag all imported bookmarks with the selected source
        const taggedData = data.map(b => ({ ...b, source: selectedSource }));
        await saveBookmarksToDB(taggedData);
        
        alert(`Successfully imported and tagged as ${selectedSource}!`);
        setShowDataModal(false);
      } catch (err) {
        alert("Error parsing backup file.");
      }
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleExportSource = (source: string) => {
    const sourceBms = bookmarks.filter(b => b.source === source);
    if (sourceBms.length === 0) {
      alert(`No bookmarks found for ${source}`);
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sourceBms, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `markflow-${source}-export-${getTimestamp()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // HTML Parser for Universal Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (checkDuplicateFile(file)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const html = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        const newBookmarks: any[] = [];
        
        links.forEach(a => {
          let folder = 'Imported';
          const dl = a.closest('dl');
          if (dl && dl.previousElementSibling && dl.previousElementSibling.tagName === 'H3') {
            folder = dl.previousElementSibling.textContent || 'Imported';
          }
          
          const addDate = a.getAttribute('add_date');
          const dateAdded = addDate 
            ? new Date(parseInt(addDate) * 1000).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];

          newBookmarks.push({
            id: Math.random().toString(36).substr(2, 9),
            title: a.textContent || 'Untitled',
            url: a.href,
            status: 'unknown',
            folder: folder,
            dateAdded,
            summary: '',
            tags: []
          });
        });
        
        // Merge and deduplicate by URL
        const combined = [...bookmarks, ...newBookmarks];
        const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
        
        await saveBookmarksToDB(unique);
      } catch (err) {
        alert("Error parsing bookmarks file.");
      }
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Derived state
  const folders = useMemo(() => {
    const uniqueFolders = Array.from(new Set(bookmarks.map(b => b.folder).filter(Boolean)));
    return uniqueFolders.map(name => ({
      id: name as string,
      name: name as string,
      isOpen: true,
      count: bookmarks.filter(b => b.folder === name).length
    }));
  }, [bookmarks]);

  const duplicatesCount = bookmarks.filter(b => b.status === 'duplicate').length;
  const deadLinksCount = bookmarks.filter(b => b.status === 'dead').length;
  const uncategorizedCount = bookmarks.filter(b => {
    const defaultFolders = ['Uncategorized', 'Imported', 'Bookmarks Bar', 'Other Bookmarks', 'Mobile Bookmarks', 'Bookmarks Menu'];
    return !b.folder || defaultFolders.includes(b.folder);
  }).length;
  const readLaterCount = bookmarks.filter(b => b.readLater).length;

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;
    if (activeTab === 'duplicates') filtered = filtered.filter(b => b.status === 'duplicate');
    if (activeTab === 'dead') filtered = filtered.filter(b => b.status === 'dead');
    
    // Fix uncategorized logic to include common default browser folders
    if (activeTab === 'uncategorized') {
      const defaultFolders = ['Uncategorized', 'Imported', 'Bookmarks Bar', 'Other Bookmarks', 'Mobile Bookmarks', 'Bookmarks Menu'];
      filtered = filtered.filter(b => !b.folder || defaultFolders.includes(b.folder));
    }
    
    if (activeTab === 'read-later') filtered = filtered.filter(b => b.readLater);
    
    // Time Machine View
    if (activeTab === 'time-machine') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.dateAdded || 0).getTime();
        const dateB = new Date(b.dateAdded || 0).getTime();
        return dateB - dateA; // Newest first
      });
    }

    if (activeTab.startsWith('folder-')) {
      const folderName = activeTab.replace('folder-', '');
      filtered = filtered.filter(b => b.folder === folderName);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.url.toLowerCase().includes(q) || 
        (b.folder && b.folder.toLowerCase().includes(q)) ||
        (b.tags && b.tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (b.summary && b.summary.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [bookmarks, activeTab, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, viewMode]);

  const paginatedBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookmarks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookmarks, currentPage]);

  const totalPages = Math.ceil(filteredBookmarks.length / itemsPerPage);

  // Actions
  const handleRunChecks = async () => {
    setShowChecksModal(true);
    setCheckProgress({ current: 0, total: 100, status: 'Finding duplicates...' });
    
    // 1. Find Duplicates
    const urlMap = new Map();
    const newBookmarks = [...bookmarks];
    let dupesFound = 0;
    
    newBookmarks.forEach(b => {
      const normalized = b.url.replace(/\/$/, '').toLowerCase();
      if (urlMap.has(normalized)) {
        b.status = 'duplicate';
        dupesFound++;
        const original = newBookmarks.find(ob => ob.id === urlMap.get(normalized).id);
        if (original) original.status = 'duplicate';
      } else {
        urlMap.set(normalized, b);
      }
    });
    
    setCheckProgress({ current: 33, total: 100, status: `Found ${dupesFound} duplicates. Checking link health (batch of 50)...` });
    
    // 2. Check Health (Batch of 50 to avoid freezing/crashing)
    const unchecked = newBookmarks.filter(b => b.status === 'unknown' || !b.status).slice(0, 50);
    let checkedCount = 0;
    
    if (unchecked.length > 0) {
      // Process in smaller chunks of 10
      for (let i = 0; i < unchecked.length; i += 10) {
        const batch = unchecked.slice(i, i + 10);
        await Promise.all(batch.map(async (b) => {
          try {
            const res = await fetch('/api/check-health', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: b.url })
            });
            const data = await res.json();
            b.status = data.status;
          } catch (e) {
            b.status = 'dead';
          }
          checkedCount++;
          setCheckProgress({ 
            current: 33 + Math.floor((checkedCount / unchecked.length) * 66), 
            total: 100, 
            status: `Checking link ${checkedCount} of ${unchecked.length}...` 
          });
        }));
      }
    } else {
      setCheckProgress({ current: 100, total: 100, status: 'All links checked!' });
    }
    
    setCheckProgress({ current: 100, total: 100, status: 'Saving results...' });
    setBookmarks(newBookmarks);
    await saveBookmarksToDB(newBookmarks);
    
    setTimeout(() => {
      setShowChecksModal(false);
    }, 1500);
  };

  const handleFindDuplicates = async () => {
    const urlMap = new Map();
    const newBookmarks = [...bookmarks];
    newBookmarks.forEach(b => {
      const normalized = b.url.replace(/\/$/, '').toLowerCase();
      if (urlMap.has(normalized)) {
        b.status = 'duplicate';
        const original = newBookmarks.find(ob => ob.id === urlMap.get(normalized).id);
        if (original) original.status = 'duplicate';
      } else {
        urlMap.set(normalized, b);
      }
    });
    await saveBookmarksToDB(newBookmarks);
    setActiveTab('duplicates');
  };

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    const newBookmarks = [...bookmarks];
    
    for (let i = 0; i < newBookmarks.length; i += 3) {
      const batch = newBookmarks.slice(i, i + 3);
      await Promise.all(batch.map(async (b) => {
        if (b.status === 'duplicate') return; 
        try {
          const res = await fetch('/api/check-health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: b.url })
          });
          const data = await res.json();
          b.status = data.status;
        } catch (e) {
          b.status = 'dead';
        }
      }));
      setBookmarks([...newBookmarks]); 
    }
    await saveBookmarksToDB(newBookmarks);
    setIsCheckingHealth(false);
  };

  const handleAIOrganize = async (strategy: string = 'topic') => {
    if (!window.confirm("Tip: AI Deep Clean will modify your folders. Have you backed up your data?\n\nClick OK to proceed.")) {
      return;
    }
    setShowOrganizeModal(false);
    setIsOrganizing(true);
    try {
      const uncategorized = bookmarks.filter(b => b.folder === 'Uncategorized' || b.folder === 'Imported');
      if (uncategorized.length === 0) {
        alert("No uncategorized bookmarks found!");
        setIsOrganizing(false);
        return;
      }

      const existingFolders = folders.map(f => f.name).filter(n => n !== 'Uncategorized' && n !== 'Imported');
      const suggestions = await categorizeBookmarksWithAI(uncategorized, existingFolders, strategy);
      
      const newBookmarks = [...bookmarks];
      suggestions.forEach((s: any) => {
        const b = newBookmarks.find(x => x.id === s.id);
        if (b) {
          b.folder = s.suggestedFolder;
        }
      });
      await saveBookmarksToDB(newBookmarks);
    } catch (error: any) {
      alert("Error organizing bookmarks: " + error.message);
    }
    setIsOrganizing(false);
  };

  const handleAIEnrich = async () => {
    setIsEnriching(true);
    try {
      // Limit to 15 at a time to avoid overwhelming the prompt/token limits
      const needsEnrichment = bookmarks.filter(b => !b.summary || !b.tags || b.tags.length === 0).slice(0, 15);
      if (needsEnrichment.length === 0) {
        alert("All bookmarks are already enriched with tags and summaries!");
        setIsEnriching(false);
        return;
      }

      const enrichments = await enrichBookmarksWithAI(needsEnrichment);
      
      const newBookmarks = [...bookmarks];
      enrichments.forEach((e: any) => {
        const b = newBookmarks.find(x => x.id === e.id);
        if (b) {
          b.summary = e.summary;
          b.tags = e.tags;
        }
      });
      await saveBookmarksToDB(newBookmarks);
    } catch (error: any) {
      alert("Error enriching bookmarks: " + error.message);
    }
    setIsEnriching(false);
  };

  const handleResurrect = async (bookmark: any) => {
    try {
      const res = await fetch('/api/wayback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bookmark.url })
      });
      const data = await res.json();
      if (data.available && data.url) {
        const newBookmarks = [...bookmarks];
        const b = newBookmarks.find(x => x.id === bookmark.id);
        if (b) {
          b.url = data.url;
          b.status = 'archived';
        }
        await saveBookmarksToDB(newBookmarks);
        alert("Successfully resurrected link from the Internet Archive!");
      } else {
        alert("No snapshot found in the Wayback Machine for this URL.");
      }
    } catch (e) {
      alert("Error contacting Wayback Machine.");
    }
  };

  const handleExportCollection = () => {
    if (filteredBookmarks.length === 0) {
      alert("No bookmarks to export in the current view.");
      return;
    }
    
    // Generate Netscape Bookmark HTML format
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

    const folders = Array.from(new Set(filteredBookmarks.map(b => b.folder || 'Uncategorized')));
    
    folders.forEach(folder => {
      html += `    <DT><H3 ADD_DATE="${Math.floor(Date.now()/1000)}" LAST_MODIFIED="${Math.floor(Date.now()/1000)}">${folder}</H3>\n    <DL><p>\n`;
      const folderBms = filteredBookmarks.filter(b => (b.folder || 'Uncategorized') === folder);
      folderBms.forEach(b => {
        const dateAdded = b.dateAdded ? Math.floor(new Date(b.dateAdded).getTime() / 1000) : Math.floor(Date.now()/1000);
        html += `        <DT><A HREF="${b.url}" ADD_DATE="${dateAdded}">${b.title}</A>\n`;
      });
      html += `    </DL><p>\n`;
    });
    html += `</DL><p>`;

    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `markflow-bookmarks-${getTimestamp()}.html`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <LinkIcon size={18} strokeWidth={2.5} />
          </div>
          <h1 className="font-semibold text-lg tracking-tight text-slate-900">MarkFlow</h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 space-y-2">
            <button 
              onClick={handleMagicSync} 
              disabled={isSyncing || !Object.values(localBrowsers).some(Boolean)}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing Browsers..." : "Magic Sync"}
            </button>
            <input 
              type="file" 
              accept=".html" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <UploadCloudIcon size={16} />
              Import HTML File
            </button>
            <button onClick={() => setShowRoadmap(true)} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
              <ListTodo size={16} />
              View Roadmap
            </button>
          </div>

          {(localBrowsers.chrome || localBrowsers.brave || localBrowsers.safari || localBrowsers.firefox) && (
            <>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Local Browsers</h2>
              <div className="space-y-2 mb-6">
                {localBrowsers.chrome && (
                  <button onClick={() => handleImportLocalBrowser('chrome')} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-sm text-slate-700 transition-colors border border-slate-200 bg-white shadow-sm">
                    <Chrome size={16} className="text-blue-500" /> Import from Chrome
                  </button>
                )}
                {localBrowsers.brave && (
                  <button onClick={() => handleImportLocalBrowser('brave')} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-sm text-slate-700 transition-colors border border-slate-200 bg-white shadow-sm">
                    <Chrome size={16} className="text-orange-500" /> Import from Brave
                  </button>
                )}
                {localBrowsers.safari && (
                  <button onClick={() => handleImportLocalBrowser('safari')} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-sm text-slate-700 transition-colors border border-slate-200 bg-white shadow-sm">
                    <Compass size={16} className="text-blue-400" /> Import from Safari
                  </button>
                )}
                {localBrowsers.firefox && (
                  <button onClick={() => handleImportLocalBrowser('firefox')} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-sm text-slate-700 transition-colors border border-slate-200 bg-white shadow-sm">
                    <Compass size={16} className="text-orange-600" /> Import from Firefox
                  </button>
                )}
              </div>
            </>
          )}

          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Folders</h2>
          <div className="space-y-1">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => setActiveTab(`folder-${folder.name}`)}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm transition-colors ${activeTab === `folder-${folder.name}` ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <Folder size={16} className={activeTab === `folder-${folder.name}` ? 'text-indigo-500' : 'text-slate-400'} />
                <span className="truncate flex-1">{folder.name}</span>
                <span className={`text-xs ${activeTab === `folder-${folder.name}` ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>{folder.count}</span>
              </div>
            ))}
            {folders.length === 0 && <p className="text-xs text-slate-400 italic px-2">No folders yet</p>}
          </div>

          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-3">Smart Views</h2>
          <div className="space-y-1">
            <SmartViewItem icon={<Clock size={16} />} label="Time Machine" count={0} color="text-purple-500" onClick={() => setActiveTab('time-machine')} />
            <SmartViewItem icon={<BookOpen size={16} />} label="Read Later" count={readLaterCount} color="text-emerald-500" onClick={() => setActiveTab('read-later')} />
            <SmartViewItem icon={<Copy size={16} />} label="Duplicates" count={duplicatesCount} color="text-amber-500" onClick={() => setActiveTab('duplicates')} />
            <SmartViewItem icon={<Activity size={16} />} label="Dead Links" count={deadLinksCount} color="text-red-500" onClick={() => setActiveTab('dead')} />
            <SmartViewItem icon={<Sparkles size={16} />} label="Uncategorized" count={uncategorizedCount} color="text-indigo-500" onClick={() => setActiveTab('uncategorized')} />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <input type="file" accept=".json" className="hidden" ref={restoreInputRef} onChange={handleRestore} />
          <button onClick={() => setShowDataModal(true)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors w-full p-2 rounded-md hover:bg-slate-50">
            <Database size={16} />
            <span>Data & Backups</span>
          </button>
          <button onClick={() => setShowHelpModal(true)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-md hover:bg-slate-50">
            <HelpCircle size={16} />
            <span>Help & Wiki</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-md hover:bg-slate-50">
            <Settings size={16} />
            <span>Local Setup Guide</span>
          </button>
          
          <a href="https://buymeacoffee.com/davidtkeane" target="_blank" rel="noreferrer" className="mt-4 block hover:opacity-90 transition-opacity">
            <img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=davidtkeane&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" className="w-full rounded-md shadow-sm" />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search bookmarks, URLs, folders..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="bg-transparent text-sm text-slate-600 font-medium focus:outline-none px-2 cursor-pointer"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="matrix">Matrix</option>
              </select>
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="List View">
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Grid View">
                <LayoutGrid size={16} />
              </button>
            </div>
            <button onClick={handleRunChecks} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
              <Activity size={16} className="text-slate-400" />
              Run System Checks
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button onClick={handleExportCollection} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
              <Share2 size={16} className="text-slate-400" />
              Export View
            </button>
            <button onClick={handleAIEnrich} disabled={isEnriching} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              {isEnriching ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              AI Enrich
            </button>
            <button onClick={() => setShowOrganizeModal(true)} disabled={isOrganizing} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-50">
              {isOrganizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              AI Organize
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
            </div>
          ) : null}

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Bookmarks" value={bookmarks.length} icon={<LinkIcon size={20} />} />
            <StatCard title="Duplicates Found" value={duplicatesCount} icon={<Copy size={20} />} trend={duplicatesCount > 0 ? "Needs attention" : "All clean"} trendColor={duplicatesCount > 0 ? "text-amber-600" : "text-emerald-600"} />
            <StatCard title="Dead Links" value={deadLinksCount} icon={<AlertTriangle size={20} />} trend="404s & Timeouts" trendColor={deadLinksCount > 0 ? "text-red-600" : "text-slate-400"} />
            <StatCard title="Uncategorized" value={uncategorizedCount} icon={<Folder size={20} />} trend="Ready for AI sorting" trendColor={uncategorizedCount > 0 ? "text-indigo-600" : "text-slate-400"} />
          </div>

          {/* Action Area */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 flex items-center px-4 overflow-x-auto hide-scrollbar">
              <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>All Bookmarks</Tab>
              {activeTab.startsWith('folder-') && (
                <Tab active={true} onClick={() => {}}>
                  <span className="flex items-center gap-2">
                    <Folder size={14} />
                    {activeTab.replace('folder-', '')}
                  </span>
                </Tab>
              )}
              {activeTab === 'time-machine' && (
                <Tab active={true} onClick={() => {}}>
                  <span className="flex items-center gap-2">
                    <Clock size={14} />
                    Time Machine
                  </span>
                </Tab>
              )}
              <Tab active={activeTab === 'read-later'} onClick={() => setActiveTab('read-later')}>Read Later</Tab>
              <Tab active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')}>Duplicates</Tab>
              <Tab active={activeTab === 'dead'} onClick={() => setActiveTab('dead')}>Dead Links</Tab>
              <Tab active={activeTab === 'uncategorized'} onClick={() => setActiveTab('uncategorized')}>Uncategorized</Tab>
            </div>
            
            {viewMode === 'list' ? (
              <div className="divide-y divide-slate-100">
                {paginatedBookmarks.map((bookmark, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    key={bookmark.id} 
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-4 overflow-hidden w-full">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                        <img src={bookmark.customIconUrl || `https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`} alt="" className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} referrerPolicy="no-referrer" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 font-medium">
                          <Folder size={10} />
                          <span>Bookmarks</span>
                          <ChevronRight size={10} />
                          <span className="text-slate-500">{bookmark.folder || 'Uncategorized'}</span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 truncate">{bookmark.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 font-mono truncate max-w-[300px]">{bookmark.url}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Folder size={12} />
                            {bookmark.folder}
                          </span>
                        </div>
                        
                        {bookmark.summary && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-1">{bookmark.summary}</p>
                        )}
                        
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {bookmark.tags.map((tag: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[10px] font-medium uppercase tracking-wider">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <StatusBadge status={bookmark.status} />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setGeekModeBookmark(bookmark)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Geek Mode (Metadata)">
                          <Terminal size={16} />
                        </button>
                        <button onClick={async () => {
                          const updated = { ...bookmark, readLater: bookmark.readLater ? 0 : 1 };
                          const newBms = bookmarks.map(b => b.id === bookmark.id ? updated : b);
                          setBookmarks(newBms);
                          await saveBookmarksToDB(newBms);
                        }} className={`p-1.5 rounded-md transition-colors ${bookmark.readLater ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={bookmark.readLater ? "Remove from Read Later" : "Read Later"}>
                          <BookOpen size={16} />
                        </button>
                        {bookmark.status === 'dead' && (
                          <button onClick={() => handleResurrect(bookmark)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Resurrect with Wayback Machine">
                            <ArchiveRestore size={16} />
                          </button>
                        )}
                        <a href={bookmark.url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Open Link">
                          <LinkIcon size={16} />
                        </a>
                        <button onClick={async () => {
                          const newBms = bookmarks.filter(b => b.id !== bookmark.id);
                          await saveBookmarksToDB(newBms);
                        }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/50">
                {paginatedBookmarks.map((bookmark, idx) => (
                  <BookmarkGridCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    idx={idx}
                    onGeekMode={() => setGeekModeBookmark(bookmark)}
                    onDelete={async () => {
                      const newBms = bookmarks.filter(b => b.id !== bookmark.id);
                      await saveBookmarksToDB(newBms);
                    }}
                    onResurrect={() => handleResurrect(bookmark)}
                    onUpdate={(updatedBookmark: any) => {
                      const newBookmarks = bookmarks.map(b => b.id === updatedBookmark.id ? updatedBookmark : b);
                      setBookmarks(newBookmarks);
                      fetch('/api/bookmarks/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookmarks: [updatedBookmark] })
                      });
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookmarks.length)} of {filteredBookmarks.length}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-slate-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {filteredBookmarks.length === 0 && !isLoading && (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen size={24} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">No bookmarks found</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  {bookmarks.length === 0 
                    ? "Your database is empty. Click 'Import Bookmarks' in the sidebar to upload your exported Chrome/Safari HTML file."
                    : "No bookmarks match your current search or filter."}
                </p>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Advanced Organize Modal */}
      {showOrganizeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">AI Deep Clean</h2>
                  <p className="text-sm text-slate-500">Choose how Gemini should organize your links</p>
                </div>
              </div>
              <button onClick={() => setShowOrganizeModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <button onClick={() => handleAIOrganize('topic')} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                <h3 className="font-medium text-slate-900 group-hover:text-indigo-700 flex items-center gap-2">
                  <Folder size={16} /> Sort by Topic (Default)
                </h3>
                <p className="text-xs text-slate-500 mt-1">Groups by subject matter (e.g., Tech, Cooking, Finance, Travel).</p>
              </button>
              
              <button onClick={() => handleAIOrganize('action')} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <h3 className="font-medium text-slate-900 group-hover:text-emerald-700 flex items-center gap-2">
                  <ListTodo size={16} /> Sort by Action / Intent
                </h3>
                <p className="text-xs text-slate-500 mt-1">Groups by what you want to do (e.g., To Read, To Watch, Tools, Reference).</p>
              </button>
              
              <button onClick={() => handleAIOrganize('time')} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
                <h3 className="font-medium text-slate-900 group-hover:text-purple-700 flex items-center gap-2">
                  <Clock size={16} /> Sort by Era / Time
                </h3>
                <p className="text-xs text-slate-500 mt-1">Groups by the year or era they belong to (e.g., 2023, 2020s, Pre-2010).</p>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* System Checks Modal */}
      {showChecksModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {checkProgress.current < 100 ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={32} className="text-emerald-500" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {checkProgress.current < 100 ? 'Running System Checks' : 'Checks Complete!'}
              </h2>
              <p className="text-sm text-slate-500 mb-6 h-5">{checkProgress.status}</p>
              
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <motion.div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${checkProgress.current}%` }}
                  transition={{ duration: 0.3 }}
                ></motion.div>
              </div>
              <div className="text-xs text-slate-400 text-right">{checkProgress.current}%</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Roadmap Modal */}
      {showRoadmap && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <ListTodo className="text-indigo-600" />
                The Ultimate Bookmark App Roadmap
              </h2>
              <button onClick={() => setShowRoadmap(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <RoadmapSection 
                title="Phase 1: The Great Convergence (Storage & Import)" 
                status="active"
                items={[
                  { text: "SQLite Database Persistence (Save everything permanently)", done: true },
                  { text: "Universal HTML Import (Drag-and-drop fallback for web/exported files)", done: true },
                  { text: "Magic Sync (Multi-Browser Auto-Importer for Chrome, Brave, Firefox, Safari)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 2: The AI Brain (Organization & Search)" 
                status="active"
                items={[
                  { text: "Advanced Full-Text Search (Fuzzy search, tag search, content search)", done: true },
                  { text: "AI Deep Clean (Sort by Topic, Action/Intent, or Era)", done: true },
                  { text: "AI Smart Tags & Summaries (Gemini generates tags and 1-sentence summaries)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 3: Health & Maintenance (Cleaning)" 
                status="active"
                items={[
                  { text: "Dead Link Checker (Batch ping URLs in the background)", done: true },
                  { text: "Advanced Deduplication (Merge exact and fuzzy matches)", done: true },
                  { text: "Wayback Machine Resurrect (Fix dead links automatically)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 4: The Ultimate UI (Visuals)" 
                status="active"
                items={[
                  { text: "Visual Grid View (High-Res Google Favicons for 10k+ performance)", done: true },
                  { text: "Time Machine View (Sort chronologically by original creation date)", done: true },
                  { text: "Pagination & Theming (Dark Mode, Matrix Theme, 100 items/page)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 5: The Next Level (Future)" 
                status="active"
                items={[
                  { text: "Cross-Platform Magic Sync (Windows & Linux support)", done: false },
                  { text: "Browser Extension (Save directly to MarkFlow from your browser)", done: false },
                  { text: "Collaborative Folders (Share curated lists with friends/team)", done: false },
                  { text: "Full-Text Page Archival (Save the actual HTML content of the page for offline viewing)", done: false },
                ]}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Geek Mode Modal */}
      {geekModeBookmark && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 font-mono text-slate-900 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-3">
                <Terminal className="w-6 h-6" />
                Geek Mode: Bookmark Metadata
              </h2>
              <button onClick={() => setGeekModeBookmark(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 overflow-x-auto">
                <pre className="text-emerald-600 whitespace-pre-wrap break-all">
                  {JSON.stringify(geekModeBookmark, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <span className="block text-xs text-slate-400 mb-1">Date Saved</span>
                  <span className="text-slate-900">{geekModeBookmark.dateAdded ? new Date(geekModeBookmark.dateAdded).toLocaleString() : 'Unknown'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <span className="block text-xs text-slate-400 mb-1">Source Browser</span>
                  <span className="text-slate-900 capitalize">{geekModeBookmark.source || 'Imported'}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={async () => {
                    const domain = new URL(geekModeBookmark.url).hostname;
                    const duckDuckGoIcon = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                    const updated = { ...geekModeBookmark, customIconUrl: duckDuckGoIcon };
                    const newBookmarks = bookmarks.map(b => b.id === updated.id ? updated : b);
                    setBookmarks(newBookmarks);
                    setGeekModeBookmark(updated);
                    await saveBookmarksToDB(newBookmarks);
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-emerald-600 rounded-lg text-sm font-medium transition-colors border border-slate-200 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Force Fetch Alternative Icon
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Help & Wiki Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <HelpCircle className="text-indigo-600 w-8 h-8" />
                Help & Wiki
              </h2>
              <button onClick={() => setShowHelpModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle size={28} />
              </button>
            </div>
            
            <div className="space-y-8 text-lg leading-relaxed text-slate-800 font-sans">
              
              <section className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Database className="text-emerald-600" /> 1. Where is my data saved?
                </h3>
                <p className="mb-3">
                  Everything you do in MarkFlow is saved <strong>locally on your computer</strong>. 
                </p>
                <p>
                  We use a hidden file called a database. Nothing is sent to the cloud, except when you ask the AI to organize your folders. This means your data is private and secure.
                </p>
              </section>

              <section className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <DownloadCloud className="text-blue-600" /> 2. Why and how should I backup?
                </h3>
                <p className="mb-3">
                  Because your data lives only on your computer, if you delete it by mistake, it is gone!
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-3">
                  <li>Click the <strong>Data & Backups</strong> button in the sidebar.</li>
                  <li>Click <strong>Backup Entire Database</strong>.</li>
                  <li>Save this file to a safe folder, like a "Backups" folder on your Desktop.</li>
                </ul>
                <p className="text-slate-500 italic">
                  Tip: The app automatically adds the date and time to the file name, so your backups will never overwrite each other!
                </p>
              </section>

              <section className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="text-purple-600" /> 3. Magic Sync vs. Single Import
                </h3>
                <p className="mb-3">
                  You have two ways to bring your bookmarks into MarkFlow:
                </p>
                <ul className="list-disc pl-6 space-y-4">
                  <li>
                    <strong>Magic Sync:</strong> This button pulls bookmarks from <em>all</em> your installed browsers (Chrome, Safari, Firefox, Brave) at the exact same time. It is fast and easy.
                  </li>
                  <li>
                    <strong>Single Import:</strong> Look under "Local Browsers" in the sidebar. You can click just Chrome, or just Safari. This gives you full control if you only want to work on one browser at a time.
                  </li>
                </ul>
              </section>

              <section className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="text-indigo-600" /> 4. What does AI Deep Clean do?
                </h3>
                <p className="mb-3">
                  When you have a lot of bookmarks in the "Uncategorized" folder, click <strong>AI Organize</strong>.
                </p>
                <p>
                  The AI will read the titles and sort them into neat folders for you. Always remember to <strong>backup your data first</strong> before running a big AI Deep Clean, just in case you want to undo it!
                </p>
              </section>

            </div>
          </motion.div>
        </div>
      )}

      {/* Data & Backups Modal */}
      {showDataModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Data & Backups</h2>
                  <p className="text-sm text-slate-500">Manage your database, backups, and browser exports</p>
                </div>
              </div>
              <button onClick={() => setShowDataModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Full Database Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Full Database</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <h4 className="font-medium text-slate-900 mb-1">Backup Everything</h4>
                    <p className="text-xs text-slate-500 mb-4">Downloads a complete JSON snapshot of all bookmarks, AI summaries, tags, and folders.</p>
                    <button onClick={handleBackup} className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                      <DownloadCloud size={16} /> Download Backup
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <h4 className="font-medium text-slate-900 mb-1">Restore Database</h4>
                    <p className="text-xs text-slate-500 mb-4">Upload a previous JSON backup to restore your entire database exactly as it was.</p>
                    <button onClick={() => restoreInputRef.current?.click()} className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                      <UploadCloudIcon size={16} /> Restore Backup
                    </button>
                  </div>
                </div>
              </section>

              {/* Browser Specific Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Browser Specific</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Export by Browser</h4>
                      <p className="text-xs text-slate-500 mb-4">Download a JSON backup of bookmarks from a specific browser source.</p>
                    </div>
                    <div className="flex gap-2">
                      <select id="exportSourceSelect" className="flex-1 bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                        {Array.from(new Set(bookmarks.map(b => b.source).filter(Boolean))).map(source => (
                          <option key={source as string} value={source as string}>{source as string}</option>
                        ))}
                      </select>
                      <button onClick={() => {
                        const select = document.getElementById('exportSourceSelect') as HTMLSelectElement;
                        if (select && select.value) handleExportSource(select.value);
                      }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Import & Assign</h4>
                      <p className="text-xs text-slate-500 mb-4">Import a JSON backup file and assign it to a specific browser source.</p>
                    </div>
                    <div className="flex gap-2">
                      <select id="importSourceSelect" className="flex-1 bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="chrome">Chrome</option>
                        <option value="safari">Safari</option>
                        <option value="firefox">Firefox</option>
                        <option value="brave">Brave</option>
                        <option value="manual">Manual</option>
                      </select>
                      <input type="file" accept=".json" id="browserRestoreInput" className="hidden" onChange={(e) => {
                        const select = document.getElementById('importSourceSelect') as HTMLSelectElement;
                        if (select && select.value) handleBrowserRestore(e, select.value);
                      }} />
                      <button onClick={() => document.getElementById('browserRestoreInput')?.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                        Import
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              <section>
                <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4 border-b border-red-100 pb-2">Danger Zone</h3>
                <div className="border border-red-200 rounded-xl p-4 bg-red-50 flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-red-900 mb-1">Clear Local Database</h4>
                    <p className="text-xs text-red-700 leading-relaxed">
                      This will permanently delete all bookmarks, tags, and folders <strong>inside MarkFlow</strong>. <br/>
                      <span className="italic opacity-90">(Don't worry, this will NOT delete the actual bookmarks in your Chrome/Safari browser!)</span>
                    </p>
                  </div>
                  <button onClick={() => {
                    clearDatabase();
                    setShowDataModal(false);
                  }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shrink-0">
                    <Trash2 size={16} /> Clear Database
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Local Setup Guide (MacBook M3 Pro)</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-5 text-sm text-slate-700">
              <p className="text-base">To run this app locally on your MacBook without hours of reconfiguration, follow these exact steps in your terminal:</p>
              
              <div className="bg-slate-900 text-slate-300 p-5 rounded-xl font-mono text-sm overflow-x-auto shadow-inner">
                <p className="text-slate-500"># 1. Clone the repository (or download the files)</p>
                <p>cd path/to/your/project</p>
                <br/>
                <p className="text-slate-500"># 2. Install dependencies</p>
                <p>npm install</p>
                <br/>
                <p className="text-slate-500"># 3. Create a .env file for your Gemini API Key</p>
                <p>echo 'GEMINI_API_KEY="your_api_key_here"' {'>'} .env</p>
                <br/>
                <p className="text-slate-500"># 4. Start the full-stack development server</p>
                <p>npm run dev</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Subcomponents

function RoadmapSection({ title, items, status }: { title: string, items: {text: string, done: boolean}[], status: string }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-medium text-slate-800">
        {title}
      </div>
      <div className="p-4 space-y-3 bg-white">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 ${item.done ? 'text-emerald-500' : 'text-slate-300'}`}>
              {item.done ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200" />}
            </div>
            <span className={`text-sm ${item.done ? 'text-slate-800' : 'text-slate-500'}`}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmartViewItem({ icon, label, count, color, onClick }: { icon: React.ReactNode, label: string, count: number, color: string, onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 cursor-pointer text-sm text-slate-700">
      <div className="flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendColor }: { title: string, value: number, icon: React.ReactNode, trend?: string, trendColor?: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-light text-slate-900">{value.toLocaleString()}</span>
      </div>
      {trend && (
        <div className={`mt-2 text-xs font-medium ${trendColor}`}>
          {trend}
        </div>
      )}
    </div>
  );
}

function Tab({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active 
          ? 'border-indigo-600 text-indigo-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'alive':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
          <CheckCircle2 size={12} />
          Active
        </span>
      );
    case 'dead':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100">
          <XCircle size={12} />
          Dead Link
        </span>
      );
    case 'duplicate':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
          <Copy size={12} />
          Duplicate
        </span>
      );
    case 'redirect':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
          <Activity size={12} />
          Redirects
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
          <ArchiveRestore size={12} />
          Archived
        </span>
      );
    case 'unknown':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-xs font-medium border border-slate-200">
          <Activity size={12} />
          Unchecked
        </span>
      );
  }
}

function BookmarkGridCard({ bookmark, idx, onDelete, onResurrect, onUpdate, onGeekMode }: any) {
  const [imgError, setImgError] = useState(false);
  
  // Use Google's high-res favicon service for a fast, reliable image that doesn't require scraping
  const domain = new URL(bookmark.url).hostname;
  const imgSrc = bookmark.customIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-72"
    >
      <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0 border-b border-slate-100">
        {!imgError ? (
          <img 
            src={imgSrc} 
            alt={bookmark.title} 
            className="w-16 h-16 object-contain drop-shadow-md" 
            onError={() => setImgError(true)} 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
            <ImageIcon size={32} className="text-indigo-200" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={bookmark.status} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2 font-medium">
          <Folder size={10} />
          <span>Bookmarks</span>
          <ChevronRight size={10} />
          <span className="text-slate-500 truncate">{bookmark.folder || 'Uncategorized'}</span>
        </div>
        <div className="flex items-start gap-2 mb-1">
          <img src={bookmark.customIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4 mt-0.5 shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} referrerPolicy="no-referrer" />
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight" title={bookmark.title}>{bookmark.title}</h3>
        </div>
        <p className="text-[10px] text-slate-400 font-mono truncate mb-2">{bookmark.url}</p>
        
        {bookmark.summary && (
          <p className="text-xs text-slate-500 line-clamp-2 flex-1">{bookmark.summary}</p>
        )}
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
            <Clock size={10} />
            <span className="truncate max-w-[80px]">{bookmark.dateAdded ? new Date(bookmark.dateAdded).toLocaleDateString() : 'Unknown'}</span>
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onGeekMode} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Geek Mode (Metadata)">
              <Terminal size={14} />
            </button>
            <button onClick={() => {
              const updated = { ...bookmark, readLater: bookmark.readLater ? 0 : 1 };
              onUpdate(updated);
            }} className={`p-1.5 rounded-md transition-colors ${bookmark.readLater ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={bookmark.readLater ? "Remove from Read Later" : "Read Later"}>
              <BookOpen size={14} />
            </button>
            {bookmark.status === 'dead' && (
              <button onClick={onResurrect} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Resurrect with Wayback Machine">
                <ArchiveRestore size={14} />
              </button>
            )}
            <a href={bookmark.url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Open Link">
              <LinkIcon size={14} />
            </a>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
