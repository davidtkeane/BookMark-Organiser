import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, Link as LinkIcon, AlertTriangle, Trash2, Search, 
  Activity, Copy, Sparkles, Settings, ChevronRight, ChevronDown, 
  MoreVertical, CheckCircle2, XCircle, Loader2, Info, Download, UploadCloud, ListTodo,
  Wand2, ArchiveRestore, LayoutGrid, List, Image as ImageIcon, BookOpen, Share2
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
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch bookmarks on mount
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

  // HTML Parser for Universal Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  const uncategorizedCount = bookmarks.filter(b => b.folder === 'Uncategorized' || b.folder === 'Imported').length;
  const readLaterCount = bookmarks.filter(b => b.readLater).length;

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;
    if (activeTab === 'duplicates') filtered = filtered.filter(b => b.status === 'duplicate');
    if (activeTab === 'dead') filtered = filtered.filter(b => b.status === 'dead');
    if (activeTab === 'uncategorized') filtered = filtered.filter(b => b.folder === 'Uncategorized' || b.folder === 'Imported');
    if (activeTab === 'read-later') filtered = filtered.filter(b => b.readLater);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.url.toLowerCase().includes(q) || 
        b.folder.toLowerCase().includes(q) ||
        (b.tags && b.tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (b.summary && b.summary.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [bookmarks, activeTab, searchQuery]);

  // Actions
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

  const handleAIOrganize = async () => {
    setIsOrganizing(true);
    try {
      const uncategorized = bookmarks.filter(b => b.folder === 'Uncategorized' || b.folder === 'Imported');
      if (uncategorized.length === 0) {
        alert("No uncategorized bookmarks found!");
        setIsOrganizing(false);
        return;
      }

      const existingFolders = folders.map(f => f.name).filter(n => n !== 'Uncategorized' && n !== 'Imported');
      const suggestions = await categorizeBookmarksWithAI(uncategorized, existingFolders);
      
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredBookmarks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "markflow-collection.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] text-slate-800 font-sans overflow-hidden">
      
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
            <input 
              type="file" 
              accept=".html" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <UploadCloud size={16} />
              Import Bookmarks
            </button>
            <button onClick={() => setShowRoadmap(true)} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
              <ListTodo size={16} />
              View Roadmap
            </button>
          </div>

          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Folders</h2>
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-sm text-slate-700">
                <Folder size={16} className="text-slate-400" />
                <span className="truncate flex-1">{folder.name}</span>
                <span className="text-xs text-slate-400">{folder.count}</span>
              </div>
            ))}
            {folders.length === 0 && <p className="text-xs text-slate-400 italic px-2">No folders yet</p>}
          </div>

          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-3">Smart Views</h2>
          <div className="space-y-1">
            <SmartViewItem icon={<BookOpen size={16} />} label="Read Later" count={readLaterCount} color="text-emerald-500" onClick={() => setActiveTab('read-later')} />
            <SmartViewItem icon={<Copy size={16} />} label="Duplicates" count={duplicatesCount} color="text-amber-500" onClick={() => setActiveTab('duplicates')} />
            <SmartViewItem icon={<Activity size={16} />} label="Dead Links" count={deadLinksCount} color="text-red-500" onClick={() => setActiveTab('dead')} />
            <SmartViewItem icon={<Sparkles size={16} />} label="Uncategorized" count={uncategorizedCount} color="text-indigo-500" onClick={() => setActiveTab('uncategorized')} />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button onClick={clearDatabase} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors w-full p-2 rounded-md hover:bg-red-50">
            <Trash2 size={16} />
            <span>Clear Database</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-md hover:bg-slate-50">
            <Settings size={16} />
            <span>Local Setup Guide</span>
          </button>
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
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="List View">
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Grid View">
                <LayoutGrid size={16} />
              </button>
            </div>
            <button onClick={handleFindDuplicates} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
              <Copy size={16} className="text-slate-400" />
              Find Duplicates
            </button>
            <button onClick={handleCheckHealth} disabled={isCheckingHealth} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              {isCheckingHealth ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Activity size={16} className="text-slate-400" />}
              Check Health
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
            <button onClick={handleAIOrganize} disabled={isOrganizing} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-50">
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
            <div className="border-b border-slate-100 flex items-center px-4">
              <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>All Bookmarks</Tab>
              <Tab active={activeTab === 'read-later'} onClick={() => setActiveTab('read-later')}>Read Later</Tab>
              <Tab active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')}>Duplicates</Tab>
              <Tab active={activeTab === 'dead'} onClick={() => setActiveTab('dead')}>Dead Links</Tab>
              <Tab active={activeTab === 'uncategorized'} onClick={() => setActiveTab('uncategorized')}>Uncategorized</Tab>
            </div>
            
            {viewMode === 'list' ? (
              <div className="divide-y divide-slate-100">
                {filteredBookmarks.map((bookmark, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    key={bookmark.id} 
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-4 overflow-hidden w-full">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                        <img src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`} alt="" className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                      </div>
                      <div className="overflow-hidden flex-1">
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
                {filteredBookmarks.map((bookmark, idx) => (
                  <BookmarkGridCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    idx={idx}
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
                  { text: "Multi-Browser Auto-Importer (Node.js script to read Chrome, Brave, Firefox, Safari files directly on Mac)", done: false },
                ]}
              />
              <RoadmapSection 
                title="Phase 2: The AI Brain (Organization & Search)" 
                status="active"
                items={[
                  { text: "Advanced Full-Text Search (Fuzzy search, tag search, content search)", done: true },
                  { text: "AI Auto-Categorization (Sort years of mess into clean folders)", done: true },
                  { text: "AI Smart Tags & Summaries (Gemini generates tags and 1-sentence summaries)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 3: Health & Maintenance (Cleaning)" 
                status="active"
                items={[
                  { text: "Dead Link Checker (Ping URLs in the background)", done: true },
                  { text: "Advanced Deduplication (Merge exact and fuzzy matches)", done: true },
                  { text: "Wayback Machine Resurrect (Fix dead links automatically)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 4: The Ultimate UI (Visuals)" 
                status="active"
                items={[
                  { text: "Visual Grid View (Fetch OpenGraph/Twitter card images)", done: true },
                  { text: "Read-It-Later Mode & Shareable Collections", done: true },
                ]}
              />
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

function BookmarkGridCard({ bookmark, idx, onDelete, onResurrect, onUpdate }: any) {
  const [imgSrc, setImgSrc] = useState(bookmark.imageUrl);
  const [isFetchingImg, setIsFetchingImg] = useState(bookmark.imageUrl === undefined);

  useEffect(() => {
    if (bookmark.imageUrl === undefined) {
      fetch('/api/og-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bookmark.url })
      })
      .then(res => res.json())
      .then(data => {
        setImgSrc(data.imageUrl || null);
        setIsFetchingImg(false);
        onUpdate({ ...bookmark, imageUrl: data.imageUrl || null });
      })
      .catch(() => {
        setImgSrc(null);
        setIsFetchingImg(false);
        onUpdate({ ...bookmark, imageUrl: null });
      });
    }
  }, [bookmark.url, bookmark.imageUrl]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-72"
    >
      <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0">
        {imgSrc ? (
          <img src={imgSrc} alt={bookmark.title} className="w-full h-full object-cover" onError={() => setImgSrc(null)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
            {isFetchingImg ? <Loader2 size={24} className="animate-spin text-indigo-300" /> : <ImageIcon size={32} className="text-indigo-200" />}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={bookmark.status} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-1">
          <img src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`} alt="" className="w-4 h-4 mt-0.5 shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight" title={bookmark.title}>{bookmark.title}</h3>
        </div>
        <p className="text-[10px] text-slate-400 font-mono truncate mb-2">{bookmark.url}</p>
        
        {bookmark.summary && (
          <p className="text-xs text-slate-500 line-clamp-2 flex-1">{bookmark.summary}</p>
        )}
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
            <Folder size={10} />
            <span className="truncate max-w-[80px]">{bookmark.folder}</span>
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
