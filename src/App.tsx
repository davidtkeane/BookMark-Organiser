import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Folder, FolderOpen, Link as LinkIcon, AlertTriangle, Trash2, Search, 
  Activity, Copy, Sparkles, Settings, ChevronRight, ChevronDown, 
  MoreVertical, CheckCircle2, XCircle, Loader2, Info, Download, UploadCloud, ListTodo,
  Check, X, Edit3, Tag, Key, Save, FileText, History,
  Wand2, ArchiveRestore, LayoutGrid, List, Image as ImageIcon, BookOpen, Share2,
  Chrome, Compass, DownloadCloud, UploadCloud as UploadCloudIcon, Database,
  RefreshCw, Clock, HelpCircle, Terminal, MessageSquare, Send, Ghost, Eye,
  Coffee, Fingerprint, Dna, Trophy, Zap, Medal, Gift, Star,
  ShieldCheck, AlertCircle, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { categorizeBookmarksWithAI, enrichBookmarksWithAI, semanticSearchBookmarks, generateKeywordsWithAI } from './services/gemini';
import { GoogleGenAI, Type } from "@google/genai";

export default function App() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [gridStyle, setGridStyle] = useState<'bento' | 'standard'>(() => {
    return (localStorage.getItem('grid_style') as any) || 'bento';
  });
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
  const [geekModeTab, setGeekModeTab] = useState<'edit' | 'meta' | 'ai'>('edit');
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat) {
      document.getElementById('chat-bottom')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatting, showChat]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => {
    return localStorage.getItem('auto_backup_enabled') !== 'false';
  });
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [showCoffeeDigest, setShowCoffeeDigest] = useState(false);
  const [coffeeBookmarks, setCoffeeBookmarks] = useState<any[]>([]);
  const [isBrewing, setIsBrewing] = useState(false);
  const [isDetectingDNA, setIsDetectingDNA] = useState(false);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticSearchIds, setSemanticSearchIds] = useState<string[] | null>(null);
  
  // Gamification State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Time Capsule State
  const [showTimeCapsule, setShowTimeCapsule] = useState(false);
  const [capsuleBookmark, setCapsuleBookmark] = useState<any | null>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<any | null>(null);

  // Smart Search & Auto-Prompt State
  const [autoPromptEnabled, setAutoPromptEnabled] = useState(() => {
    return localStorage.getItem('auto_prompt_enabled') !== 'false';
  });
  const [autoPromptDelay, setAutoPromptDelay] = useState(15); // seconds
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [autoPromptDismissedUntil, setAutoPromptDismissedUntil] = useState(0);
  const autoPromptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [customMatrixLogo, setCustomMatrixLogo] = useState(() => localStorage.getItem('custom_matrix_logo') || null);
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || '');

  useEffect(() => {
    if (!autoPromptEnabled || showChat || Date.now() < autoPromptDismissedUntil) return;

    const timer = setInterval(() => {
      const idleTime = (Date.now() - lastActivity) / 1000;
      if (idleTime >= autoPromptDelay && !showAutoPrompt && Date.now() > autoPromptDismissedUntil) {
        setShowAutoPrompt(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastActivity, autoPromptEnabled, autoPromptDelay, showChat, showAutoPrompt, autoPromptDismissedUntil]);

  // Auto-hide prompt after 5 seconds if no interaction
  useEffect(() => {
    if (showAutoPrompt) {
      autoPromptTimerRef.current = setTimeout(() => {
        setShowAutoPrompt(false);
      }, 5000);
    } else {
      if (autoPromptTimerRef.current) clearTimeout(autoPromptTimerRef.current);
    }
    return () => {
      if (autoPromptTimerRef.current) clearTimeout(autoPromptTimerRef.current);
    };
  }, [showAutoPrompt]);

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('click', resetActivity);
    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
    };
  }, [resetActivity]);

  const awardXp = async (amount: number) => {
    try {
      const res = await fetch('/api/stats/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        const oldLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
        const newLevel = Math.floor(Math.sqrt(data.xp / 100)) + 1;
        setXp(data.xp);
        if (newLevel > oldLevel) {
          setShowLevelUp(true);
        }
      }
    } catch (e) {
      console.error("Failed to award XP", e);
    }
  };

  useEffect(() => {
    setLevel(Math.floor(Math.sqrt(xp / 100)) + 1);
  }, [xp]);

  const GEMINI_MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fastest Frontier Model', costPer1M: 0.10 },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', description: 'Advanced Reasoning & Agents', costPer1M: 1.25 },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Stable Production Workhorse', costPer1M: 0.10 },
  ];

  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('selected_model') || 'gemini-3-flash-preview';
  });
  
  // Modal Tab States
  const [activeHelpTab, setActiveHelpTab] = useState('basics');
  const [activeDataTab, setActiveDataTab] = useState('backups');
  const [activeSettingsTab, setActiveSettingsTab] = useState('ai');

  const [aiStats, setAiStats] = useState(() => {
    const saved = localStorage.getItem('ai_stats');
    return saved ? JSON.parse(saved) : { totalTokens: 0, totalCost: 0, requestCount: 0 };
  });

  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('ai_stats', JSON.stringify(aiStats));
  }, [aiStats]);

  const updateAIStats = (usage: any) => {
    if (!usage) return;
    const modelInfo = GEMINI_MODELS.find(m => m.id === selectedModel) || GEMINI_MODELS[0];
    const tokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
    const cost = (tokens / 1000000) * modelInfo.costPer1M;
    
    setAiStats(prev => ({
      totalTokens: prev.totalTokens + tokens,
      totalCost: prev.totalCost + cost,
      requestCount: prev.requestCount + 1
    }));
  };

  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const handleCheckApiKey = async () => {
    setApiKeyStatus('checking');
    setApiKeyError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setApiKeyStatus('invalid');
        setApiKeyError("No API key found in environment variables. Please check your .env file.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: "Hello, are you there? Just reply 'yes' if you can hear me.",
        config: { maxOutputTokens: 10 }
      });
      if (response.text) {
        setApiKeyStatus('valid');
        setTimeout(() => setApiKeyStatus('idle'), 5000);
      } else {
        setApiKeyStatus('invalid');
        setApiKeyError("Model returned an empty response. The key might be restricted.");
      }
    } catch (error: any) {
      console.error(error);
      setApiKeyStatus('invalid');
      setApiKeyError(error.message || "Failed to connect to Gemini API. Check your internet or key permissions.");
    }
  };

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
  const [theme, setTheme] = useState<'light' | 'dark' | 'matrix' | 'ranger'>(() => {
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

  // Auto Backup Effect
  useEffect(() => {
    if (!autoBackupEnabled) return;
    
    const runBackup = async () => {
      try {
        await fetch('/api/database/auto-backup', { method: 'POST' });
        console.log("Auto-backup successful");
      } catch (e) {
        console.error("Auto-backup failed", e);
      }
    };

    // Run every hour
    const interval = setInterval(runBackup, 60 * 60 * 1000);
    // Also run once on load
    runBackup();
    
    return () => clearInterval(interval);
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem('auto_backup_enabled', String(autoBackupEnabled));
  }, [autoBackupEnabled]);

  // Fetch bookmarks, chat history and local browsers on mount
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

    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setChatMessages(data))
      .catch(() => {});

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.xp) setXp(parseInt(data.xp));
      })
      .catch(() => {});

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
        awardXp(100);
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
        awardXp(newBookmarks.length > 50 ? 100 : 50);
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
    if (semanticSearchIds !== null) {
      // Return bookmarks in the order specified by semantic search results
      return semanticSearchIds
        .map(id => bookmarks.find(b => b.id === id))
        .filter(Boolean);
    }

    let filtered = bookmarks;
    if (activeTab === 'duplicates') filtered = filtered.filter(b => b.status === 'duplicate');
    if (activeTab === 'dead') filtered = filtered.filter(b => b.status === 'dead');
    
    // Fix uncategorized logic to include common default browser folders
    if (activeTab === 'uncategorized') {
      const defaultFolders = ['Uncategorized', 'Imported', 'Bookmarks Bar', 'Other Bookmarks', 'Mobile Bookmarks', 'Bookmarks Menu'];
      filtered = filtered.filter(b => !b.folder || defaultFolders.includes(b.folder));
    }
    
    if (activeTab === 'read-later') filtered = filtered.filter(b => b.readLater);
    if (activeTab === 'checked') filtered = filtered.filter(b => b.isChecked);
    
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
      // Clear semantic search results when tab or query changes manually
      if (activeTab !== 'all' || !searchQuery) {
        setSemanticSearchIds(null);
      }
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
    awardXp(25);
    
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
    awardXp(15);
    setActiveTab('duplicates');
  };

  const handleDNADetection = async () => {
    setIsDetectingDNA(true);
    const newBookmarks = [...bookmarks];
    let dnaDupes = 0;

    // Fuzzy matching for DNA detection
    for (let i = 0; i < newBookmarks.length; i++) {
      for (let j = i + 1; j < newBookmarks.length; j++) {
        const b1 = newBookmarks[i];
        const b2 = newBookmarks[j];
        
        // Skip if already marked
        if (b1.status === 'duplicate' && b2.status === 'duplicate') continue;

        // DNA Match 1: Similar Titles
        const title1 = b1.title.toLowerCase().trim();
        const title2 = b2.title.toLowerCase().trim();
        
        // DNA Match 2: Similar URLs (ignoring query params)
        const url1 = b1.url.split('?')[0].replace(/\/$/, '').toLowerCase();
        const url2 = b2.url.split('?')[0].replace(/\/$/, '').toLowerCase();

        const isTitleMatch = title1.length > 15 && (title1 === title2 || (title1.includes(title2) && title2.length > 15) || (title2.includes(title1) && title1.length > 15));
        const isUrlMatch = url1 === url2;

        if (isTitleMatch || isUrlMatch) {
          b1.status = 'duplicate';
          b2.status = 'duplicate';
          dnaDupes++;
        }
      }
    }

    setBookmarks(newBookmarks);
    await saveBookmarksToDB(newBookmarks);
    setIsDetectingDNA(false);
    awardXp(150);
    alert(`DNA Scan Complete! Found ${dnaDupes} potential "DNA" matches (similar content/URLs).`);
    setActiveTab('duplicates');
  };

  const brewCoffeeDigest = () => {
    setIsBrewing(true);
    setShowCoffeeDigest(true);
    
    // Pick 5 random bookmarks
    const shuffled = [...bookmarks].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    setCoffeeBookmarks(selected);
    awardXp(10);
    setTimeout(() => setIsBrewing(false), 1500);
  };

  const triggerTimeCapsule = () => {
    if (bookmarks.length === 0) return;
    const randomBookmark = bookmarks[Math.floor(Math.random() * bookmarks.length)];
    setCapsuleBookmark(randomBookmark);
    setShowTimeCapsule(true);
    awardXp(20);
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
      const suggestions = await categorizeBookmarksWithAI(uncategorized, existingFolders, strategy, selectedModel);
      
      const newBookmarks = [...bookmarks];
      suggestions.forEach((s: any) => {
        const b = newBookmarks.find(x => x.id === s.id);
        if (b) {
          b.folder = s.suggestedFolder;
        }
      });
      await saveBookmarksToDB(newBookmarks);
      awardXp(100);
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

      const enrichments = await enrichBookmarksWithAI(needsEnrichment, selectedModel);
      
      const newBookmarks = [...bookmarks];
      enrichments.forEach((e: any) => {
        const b = newBookmarks.find(x => x.id === e.id);
        if (b) {
          b.summary = e.summary;
          b.tags = e.tags;
        }
      });
      await saveBookmarksToDB(newBookmarks);
      awardXp(needsEnrichment.length * 20);
    } catch (error: any) {
      alert("Error enriching bookmarks: " + error.message);
    }
    setIsEnriching(false);
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSemanticSearching(true);
    try {
      const results = await semanticSearchBookmarks(searchQuery, bookmarks, selectedModel);
      setSemanticSearchIds(results);
      awardXp(20);
    } catch (error: any) {
      console.error("Semantic search failed", error);
      alert("Semantic search failed. Please check your API key.");
    }
    setIsSemanticSearching(false);
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
        awardXp(50);
        alert("Successfully resurrected link from the Internet Archive!");
      } else {
        alert("No snapshot found in the Wayback Machine for this URL.");
      }
    } catch (e) {
      alert("Error contacting Wayback Machine.");
    }
  };

  const handleArchiveLocally = async (bookmark: any) => {
    setIsArchiving(bookmark.id);
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookmark.id, url: bookmark.url })
      });
      const data = await res.json();
      if (data.success) {
        const newBookmarks = bookmarks.map(b => b.id === bookmark.id ? { ...b, archivedAt: data.archivedAt } : b);
        setBookmarks(newBookmarks);
        awardXp(30);
        alert("Successfully saved a local copy of this page!");
      }
    } catch (e) {
      alert("Failed to archive page locally.");
    }
    setIsArchiving(null);
  };

  const handleChat = async (message: string) => {
    if (!message.trim()) return;
    
    const userMsg = { 
      role: 'user', 
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    // Save user message to DB
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg)
    }).catch(console.error);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in your .env file.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const tools = [{
        functionDeclarations: [
          {
            name: "search_bookmarks",
            description: "Search for bookmarks by title, URL, folder, or tags",
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING, description: "The search query" }
              },
              required: ["query"]
            }
          },
          {
            name: "delete_bookmark",
            description: "Delete a bookmark by its ID",
            parameters: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "The ID of the bookmark to delete" }
              },
              required: ["id"]
            }
          },
          {
            name: "move_bookmark",
            description: "Move a bookmark to a different folder",
            parameters: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "The ID of the bookmark to move" },
                folder: { type: Type.STRING, description: "The name of the destination folder" }
              },
              required: ["id", "folder"]
            }
          }
        ]
      }];

      const systemPrompt = `You are MarkFlow AI, a helpful assistant for managing bookmarks. ${userName ? `The user's name is ${userName}. Always address them by name when appropriate.` : ''} The user has ${bookmarks.length} bookmarks. You can help them search, organize, and manage their library. You have access to the full chat history which is saved in the database. Use the provided tools to interact with the database. If you perform an action, explain what you did. You can also chat about anything else the user wants.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...chatMessages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: { tools }
      });

      // Update stats
      updateAIStats(response.usageMetadata);

      let aiResponseText = "";
      
      // Safely extract text
      if (response.candidates && response.candidates[0]?.content?.parts) {
        aiResponseText = response.candidates[0].content.parts.find(p => p.text)?.text || "";
        
        const functionCalls = response.candidates[0].content.parts.filter(p => p.functionCall).map(p => p.functionCall);

        if (functionCalls.length > 0) {
          for (const call of functionCalls) {
            if (call.name === 'search_bookmarks') {
              const query = (call.args as any).query as string;
              const results = bookmarks.filter(b => 
                b.title.toLowerCase().includes(query.toLowerCase()) || 
                b.url.toLowerCase().includes(query.toLowerCase()) ||
                (b.folder && b.folder.toLowerCase().includes(query.toLowerCase()))
              ).slice(0, 10);
              
              const toolResponse = await ai.models.generateContent({
                model: selectedModel,
                contents: [
                  { role: 'user', parts: [{ text: message }] },
                  { role: 'model', parts: [{ text: aiResponseText || "Searching..." }] },
                  { role: 'user', parts: [{ text: `Search results for "${query}": ${JSON.stringify(results)}` }] }
                ]
              });
              updateAIStats(toolResponse.usageMetadata);
              aiResponseText = toolResponse.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "I found some bookmarks for you.";
            } else if (call.name === 'delete_bookmark') {
              const id = (call.args as any).id as string;
              const b = bookmarks.find(x => x.id === id);
              if (b) {
                await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
                setBookmarks(prev => prev.filter(x => x.id !== id));
                aiResponseText = `I've deleted the bookmark: "${b.title}".`;
              }
            } else if (call.name === 'move_bookmark') {
              const id = (call.args as any).id as string;
              const folder = (call.args as any).folder as string;
              const b = bookmarks.find(x => x.id === id);
              if (b) {
                const updated = { ...b, folder };
                await fetch('/api/bookmarks/batch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bookmarks: [updated] })
                });
                setBookmarks(prev => prev.map(x => x.id === id ? updated : x));
                aiResponseText = `I've moved "${b.title}" to the "${folder}" folder.`;
              }
            }
          }
        }
      }

      if (!aiResponseText) {
        aiResponseText = "I'm sorry, I couldn't generate a response. Please try again.";
      }

      const modelMsg = { 
        role: 'model', 
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, modelMsg]);

      // Save model response to DB
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelMsg)
      }).catch(console.error);

    } catch (error) {
      console.error("AI Chat Error:", error);
      const errorMsg = { 
        role: 'model', 
        content: "Sorry, I encountered an error while processing your request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorMsg)
      }).catch(console.error);
    }
    setIsChatting(false);
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
    <div className={`flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden ${theme === 'ranger' ? 'ranger' : ''}`}>
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md overflow-hidden ${theme === 'ranger' ? 'bg-[#1a1c1e] border border-[#8a9099]' : theme === 'matrix' ? 'bg-black border border-emerald-500/50' : 'bg-indigo-600'}`}>
              {theme === 'ranger' ? (
                <img src="/ranger.png" alt="Ranger Logo" className="w-full h-full object-cover" />
              ) : theme === 'matrix' && customMatrixLogo ? (
                <img src={customMatrixLogo} alt="Matrix Logo" className="w-full h-full object-contain filter grayscale sepia hue-rotate-[70deg] saturate-[500%] brightness-[0.8]" />
              ) : theme === 'matrix' ? (
                <Terminal size={18} className="text-emerald-500" />
              ) : (
                <LinkIcon size={18} strokeWidth={2.5} />
              )}
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-slate-900">MarkFlow</h1>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <Trophy size={10} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">LVL {level}</span>
            </div>
            <div className="w-12 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-500" 
                style={{ width: `${(xp % 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 space-y-2">
            <button 
              onClick={handleMagicSync} 
              disabled={isSyncing || !Object.values(localBrowsers).some(Boolean)}
              className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
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
            <SmartViewItem icon={<MessageSquare size={16} />} label="AI Chat" count={0} color="text-indigo-600" onClick={() => setShowChat(true)} />
            <SmartViewItem icon={<Coffee size={16} />} label="Morning Coffee" count={0} color="text-amber-600" onClick={brewCoffeeDigest} />
            <SmartViewItem icon={<Gift size={16} />} label="Time Capsule" count={0} color="text-pink-500" onClick={triggerTimeCapsule} />
            <SmartViewItem icon={<Clock size={16} />} label="Time Machine" count={0} color="text-purple-500" onClick={() => setActiveTab('time-machine')} />
            <SmartViewItem icon={<BookOpen size={16} />} label="Read Later" count={readLaterCount} color="text-emerald-500" onClick={() => setActiveTab('read-later')} />
            <SmartViewItem icon={<CheckCircle2 size={16} />} label="Checked" count={bookmarks.filter(b => b.isChecked).length} color="text-green-500" onClick={() => setActiveTab('checked')} />
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
            <span>Settings</span>
          </button>
          <div className="px-2 pt-2 text-[10px] text-slate-400 font-medium tracking-widest text-center opacity-50">
            VERSION 3.10.0
          </div>
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
              className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={handleSemanticSearch}
                disabled={isSemanticSearching || !searchQuery}
                className={`p-1.5 rounded-lg transition-colors ${isSemanticSearching ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'} disabled:opacity-30`}
                title="AI Semantic Search (Find by Meaning)"
              >
                {isSemanticSearching ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
              </button>
              <button 
                onClick={() => {
                  if (searchQuery) {
                    setShowChat(true);
                    handleChat(`Search my library and the web for more information about: ${searchQuery}`);
                  } else {
                    setShowChat(true);
                  }
                }}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="AI Search & Research"
              >
                <Sparkles size={18} />
              </button>
            </div>
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
                <option value="ranger">Ranger</option>
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

            {viewMode === 'grid' && (
              <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                <button 
                  onClick={() => {
                    setGridStyle('standard');
                    localStorage.setItem('grid_style', 'standard');
                  }} 
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${gridStyle === 'standard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => {
                    setGridStyle('bento');
                    localStorage.setItem('grid_style', 'bento');
                  }} 
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${gridStyle === 'bento' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Bento
                </button>
              </div>
            )}
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
              <Tab active={activeTab === 'checked'} onClick={() => setActiveTab('checked')}>Checked</Tab>
              <Tab active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')}>Duplicates</Tab>
              <Tab active={activeTab === 'dead'} onClick={() => setActiveTab('dead')}>Dead Links</Tab>
              <Tab active={activeTab === 'uncategorized'} onClick={() => setActiveTab('uncategorized')}>Uncategorized</Tab>
            </div>
            
            {activeTab === 'duplicates' && (
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Fingerprint size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Advanced Duplicate Detection</h3>
                    <p className="text-xs text-slate-500">Scan for similar titles and content "DNA" across your library.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleFindDuplicates}
                    className="px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all shadow-sm"
                  >
                    URL Scan
                  </button>
                  <button 
                    onClick={handleDNADetection}
                    disabled={isDetectingDNA}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDetectingDNA ? <Loader2 size={16} className="animate-spin" /> : <Dna size={16} />}
                    DNA Content Scan
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'list' ? (
              <div className="divide-y divide-slate-100">
                {paginatedBookmarks.map((bookmark, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    key={bookmark.id} 
                    onClick={() => setSelectedBookmark(bookmark)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
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
                        <button 
                          onClick={() => handleArchiveLocally(bookmark)} 
                          disabled={isArchiving === bookmark.id}
                          className={`p-1.5 rounded-md transition-colors ${bookmark.archivedAt ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} 
                          title={bookmark.archivedAt ? `Archived on ${new Date(bookmark.archivedAt).toLocaleDateString()}` : "Archive Locally (Ghost Copy)"}
                        >
                          {isArchiving === bookmark.id ? <Loader2 size={16} className="animate-spin" /> : <Ghost size={16} />}
                        </button>
                        {bookmark.archivedAt && (
                          <button 
                            onClick={() => window.open(`/api/archive/${bookmark.id}`, '_blank')}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                            title="View Local Archive"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          const updated = { ...bookmark, readLater: bookmark.readLater ? 0 : 1 };
                          const newBms = bookmarks.map(b => b.id === bookmark.id ? updated : b);
                          setBookmarks(newBms);
                          await fetch('/api/bookmarks/batch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bookmarks: [updated] })
                          });
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
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("Permanently delete this bookmark?")) {
                            try {
                              await fetch(`/api/bookmarks/${bookmark.id}`, { method: 'DELETE' });
                              setBookmarks(bookmarks.filter(b => b.id !== bookmark.id));
                            } catch (err) {
                              console.error("Failed to delete bookmark", err);
                              alert("Failed to delete bookmark.");
                            }
                          }
                        }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`p-6 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 ${gridStyle === 'bento' ? 'grid-flow-dense auto-rows-[20rem]' : ''}`}>
                {paginatedBookmarks.map((bookmark, idx) => (
                  <BookmarkGridCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    idx={idx}
                    gridStyle={gridStyle}
                    onClick={() => setSelectedBookmark(bookmark)}
                    onGeekMode={() => setGeekModeBookmark(bookmark)}
                    onArchive={() => handleArchiveLocally(bookmark)}
                    isArchiving={isArchiving === bookmark.id}
                    onDelete={async () => {
                      if (confirm("Permanently delete this bookmark?")) {
                        try {
                          await fetch(`/api/bookmarks/${bookmark.id}`, { method: 'DELETE' });
                          setBookmarks(bookmarks.filter(b => b.id !== bookmark.id));
                        } catch (err) {
                          console.error("Failed to delete bookmark", err);
                          alert("Failed to delete bookmark.");
                        }
                      }
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
                title="Phase 5: The Smart Assistant (Intelligence)" 
                status="active"
                items={[
                  { text: "AI Chat with Library (Natural language search & organization)", done: true },
                  { text: "Ghost Archiving (Local HTML copies of bookmarked pages)", done: true },
                  { text: "Morning Coffee Digest (Daily curated bookmark selection)", done: true },
                  { text: "Duplicate DNA Detection (Fuzzy content matching)", done: true },
                  { text: "Librarian Level-Up (Gamification & XP system)", done: true },
                  { text: "Time Capsule Trigger (Surfacing old memories)", done: true },
                  { text: "Automatic Database Backups (Hourly local snapshots)", done: true },
                  { text: "Interactive AI Search Tool with Auto-Prompt (Proactive help)", done: true },
                  { text: "Custom Matrix Logo Upload & Processing (Digital Rain Filter)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 6: The Ultimate Experience (Intelligence)" 
                status="active"
                items={[
                  { text: "Visual Bento Grid View (Dynamic asymmetrical layout)", done: true },
                  { text: "AI-Powered Semantic Search (Find by meaning, not just keywords)", done: true },
                  { text: "Bookmark Pop-out Detail View (Metadata & Live Preview)", done: true },
                  { text: "Checked/Unchecked Status (Track your progress)", done: true },
                  { text: "Grid Style Toggle (Standard vs Bento View)", done: true },
                  { text: "Title Editing & Auto-Fetch (Magic Title)", done: true },
                  { text: "Bookmark Intelligence Editor (Multi-tab editing & AI Insights)", done: true },
                  { text: "AI Keyword & Tag Generation (Deep content analysis)", done: true },
                ]}
              />
              <RoadmapSection 
                title="Phase 7: The Next Level (In Progress)" 
                status="active"
                items={[
                  { text: "AI Personalization (Address user by name)", done: true },
                  { text: "Universal Command Center (Tabbed Settings & Backups)", done: true },
                  { text: "H3llCoin Ecosystem Integration", done: true },
                  { text: "Cross-Platform Magic Sync (Windows & Linux support)", done: false },
                  { text: "iOS Standalone App (App Store Release)", done: false },
                  { text: "Browser Extension (Save directly to MarkFlow)", done: false },
                ]}
              />
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recent Changelog (v3.7.0)</h4>
                <ul className="space-y-1">
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                    AI Personalization (User Names & Timestamps)
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                    Universal Sidebar-Tabbed Architecture (Settings, Wiki, Data)
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                    H3llCoin Support Button Integration
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                    Modal Click-Outside-to-Close UX
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 border-t border-slate-100 pt-8">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
                <ListTodo className="text-emerald-600" />
                Current TODO List
              </h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">High Priority</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="line-through opacity-50">Bookmark Intelligence Editor (v3.0.0)</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="line-through opacity-50">AI Keyword Generation (v3.0.0)</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span>Browser Extension (Chrome/Firefox)</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span>Windows/Linux Magic Sync</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 font-bold">NEW</div>
                      iOS Standalone App (App Store Release)
                    </li>
                    <li className="flex items-center gap-3 text-slate-400 line-through">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      Visual Bento Grid View
                    </li>
                    <li className="flex items-center gap-3 text-slate-400 line-through">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      AI-Powered Semantic Search
                    </li>
                    <li className="flex items-center gap-3 text-slate-400 line-through">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      Bookmark Detail Pop-out
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Enhancements</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Add PDF export for Ghost Archives
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Implement "Vibe Search" (Semantic Search)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Geek Mode Modal (Enhanced Bookmark Editor) */}
      {geekModeBookmark && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Terminal size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bookmark Intelligence</h2>
                  <p className="text-sm text-slate-500 font-medium">Edit metadata, tags, and AI insights</p>
                </div>
              </div>
              <button 
                onClick={() => setGeekModeBookmark(null)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-all shadow-sm border border-transparent hover:border-slate-100"
              >
                <XCircle size={28} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-white px-6">
              {[
                { id: 'edit', label: 'Edit Content', icon: Edit3 },
                { id: 'meta', label: 'Metadata', icon: Database },
                { id: 'ai', label: 'AI Insights', icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGeekModeTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-4 text-sm font-bold transition-all border-b-2 relative ${
                    geekModeTab === tab.id 
                      ? 'text-emerald-600 border-emerald-600' 
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {geekModeTab === tab.id && (
                    <motion.div layoutId="activeTab" className="absolute inset-x-0 -bottom-[2px] h-0.5 bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              {geekModeTab === 'edit' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Title</label>
                      <input 
                        type="text" 
                        value={geekModeBookmark.title}
                        onChange={(e) => setGeekModeBookmark({ ...geekModeBookmark, title: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">URL</label>
                      <input 
                        type="text" 
                        value={geekModeBookmark.url}
                        onChange={(e) => setGeekModeBookmark({ ...geekModeBookmark, url: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Tag size={12} /> Tags (Comma Separated)
                        </label>
                        <input 
                          type="text" 
                          placeholder="tech, research, tools..."
                          value={Array.isArray(geekModeBookmark.tags) ? geekModeBookmark.tags.join(', ') : ''}
                          onChange={(e) => setGeekModeBookmark({ ...geekModeBookmark, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Key size={12} /> Keywords
                        </label>
                        <input 
                          type="text" 
                          placeholder="ai, machine learning, data..."
                          value={Array.isArray(geekModeBookmark.keywords) ? geekModeBookmark.keywords.join(', ') : ''}
                          onChange={(e) => setGeekModeBookmark({ ...geekModeBookmark, keywords: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FileText size={12} /> Summary
                      </label>
                      <textarea 
                        rows={3}
                        value={geekModeBookmark.summary || ''}
                        onChange={(e) => setGeekModeBookmark({ ...geekModeBookmark, summary: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm resize-none"
                        placeholder="Add a brief summary of this bookmark..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {geekModeTab === 'meta' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <History size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Historical Save Date</span>
                      </div>
                      <div className="text-slate-900 font-mono text-sm">
                        {geekModeBookmark.dateAdded ? new Date(geekModeBookmark.dateAdded).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Compass size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Origin Source</span>
                      </div>
                      <div className="text-slate-900 font-bold capitalize">
                        {geekModeBookmark.source || 'Imported'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={14} /> Raw JSON Structure
                      </h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(geekModeBookmark, null, 2));
                          alert("JSON copied to clipboard!");
                        }}
                        className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="text-emerald-500 font-mono text-xs whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto custom-scrollbar">
                      {JSON.stringify(geekModeBookmark, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {geekModeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-indigo-900 mb-1">AI Keyword Generation</h4>
                        <p className="text-sm text-indigo-700 mb-4">Let Gemini analyze the title and summary to generate deep keywords and relevant tags.</p>
                        <button 
                          onClick={async () => {
                            setIsGeneratingKeywords(true);
                            try {
                              const result = await generateKeywordsWithAI(geekModeBookmark, selectedModel);
                              setGeekModeBookmark({
                                ...geekModeBookmark,
                                keywords: result.keywords,
                                tags: [...new Set([...(geekModeBookmark.tags || []), ...result.tags])]
                              });
                              awardXp(15);
                            } catch (err) {
                              alert("Failed to generate keywords: " + err);
                            } finally {
                              setIsGeneratingKeywords(false);
                            }
                          }}
                          disabled={isGeneratingKeywords}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                        >
                          {isGeneratingKeywords ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                          {isGeneratingKeywords ? 'Analyzing Content...' : 'Generate AI Keywords'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {geekModeBookmark.keywords && geekModeBookmark.keywords.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generated Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {geekModeBookmark.keywords.map((kw: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={async () => {
                    const domain = new URL(geekModeBookmark.url).hostname;
                    const duckDuckGoIcon = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                    setGeekModeBookmark({ ...geekModeBookmark, customIconUrl: duckDuckGoIcon });
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Refresh Icon
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setGeekModeBookmark(null)}
                  className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const updatedBookmark = geekModeBookmark;
                    const newBookmarks = bookmarks.map(b => b.id === updatedBookmark.id ? updatedBookmark : b);
                    setBookmarks(newBookmarks);
                    
                    try {
                      await fetch('/api/bookmarks/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookmarks: [updatedBookmark] })
                      });
                      setGeekModeBookmark(null);
                      awardXp(10);
                    } catch (err) {
                      console.error("Failed to save bookmark", err);
                      alert("Failed to save changes. Please try again.");
                    }
                  }}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

            {/* Help & Wiki Modal */}
            {showHelpModal && (
              <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowHelpModal(false)}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl h-[80vh] overflow-hidden border border-slate-200 flex flex-col"
                >
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <HelpCircle size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">MarkFlow Wiki</h2>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Version 3.1.0 • Knowledge Base</p>
                      </div>
                    </div>
                    <button onClick={() => setShowHelpModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                      <XCircle size={24} />
                    </button>
                  </div>
                  
                  <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-56 border-r border-slate-100 p-4 space-y-2 bg-slate-50/30">
                      {[
                        { id: 'basics', label: 'Basics', icon: BookOpen },
                        { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
                        { id: 'sync', label: 'Sync & Import', icon: RefreshCw },
                        { id: 'trouble', label: 'Troubleshooting', icon: AlertCircle },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveHelpTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeHelpTab === tab.id 
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                            : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <tab.icon size={18} />
                          {tab.label}
                        </button>
                      ))}
                    </div>
      
                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                      {activeHelpTab === 'basics' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Database className="text-emerald-600" size={20} /> 1. Where is my data saved?
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                              Everything in MarkFlow is saved <strong>locally on your computer</strong> in a high-performance SQLite database.
                            </p>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              Nothing is sent to the cloud (except for processing AI requests). Your browsing habits remain private, secure, and entirely under your control.
                            </p>
                          </section>
      
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <DownloadCloud className="text-blue-600" size={20} /> 2. Why should I backup?
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                              Because your data lives only on your computer, if you delete the database or lose your machine, your organization is gone forever.
                            </p>
                            <div className="bg-blue-100/50 p-4 rounded-xl border border-blue-100">
                              <p className="text-xs text-blue-800 font-bold uppercase tracking-widest mb-2">How to backup:</p>
                              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-900">
                                <li>Go to <strong>Data & Backups</strong> in the sidebar.</li>
                                <li>Click <strong>Download Backup</strong>.</li>
                                <li>Save the file to a safe location like iCloud or Dropbox.</li>
                              </ul>
                            </div>
                          </section>
                        </motion.div>
                      )}
      
                      {activeHelpTab === 'ai' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Sparkles className="text-indigo-600" size={20} /> AI Deep Clean
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                              The <strong>AI Organize</strong> feature uses Gemini 3.1 to read your bookmark titles and sort them into logical, beautiful folder structures.
                            </p>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              Tip: Always perform a manual backup before running a Deep Clean so you can revert if you don't like the new structure!
                            </p>
                          </section>
      
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Terminal className="text-slate-700" size={20} /> Getting an API Key
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                              MarkFlow requires a <strong>Google Cloud API Key</strong> with the <strong>Generative Language API</strong> enabled.
                            </p>
                            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 mb-4">
                              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Google Cloud Console</a>.</li>
                              <li>Enable the <strong>Generative Language API</strong>.</li>
                              <li>Create an API Key and link a <strong>Billing Account</strong> to your project.</li>
                              <li>Add the key to your <code>.env</code> file as <code>VITE_GEMINI_API_KEY</code>.</li>
                            </ol>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800 italic">
                              Note: Flash models (1.5/2.0/3.0) are extremely cheap and often fall within a free tier, while Pro models may incur standard usage fees.
                            </div>
                          </section>
                        </motion.div>
                      )}
      
                      {activeHelpTab === 'sync' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <RefreshCw className="text-purple-600" size={20} /> Magic Sync
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                              Magic Sync scans your MacBook for all installed browsers (Chrome, Safari, Brave, Firefox) and imports everything into one master library.
                            </p>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800 italic">
                              Warning: This will skip bookmarks that already exist in your library to prevent duplicates.
                            </div>
                          </section>
      
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <UploadCloudIcon className="text-blue-600" size={20} /> Manual Imports
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              If you prefer to import one browser at a time, use the "Local Browsers" section in the sidebar. This allows you to focus on specific collections.
                            </p>
                          </section>
                        </motion.div>
                      )}
      
                      {activeHelpTab === 'trouble' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <section className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                            <h3 className="text-lg font-bold text-rose-900 mb-3 flex items-center gap-2">
                              <AlertTriangle className="text-rose-600" size={20} /> Connection Failed?
                            </h3>
                            <ul className="list-disc pl-5 space-y-3 text-sm text-rose-800">
                              <li><strong>Check API Key:</strong> Ensure it starts with <code>AIza</code> and is correctly saved in your <code>.env</code> file.</li>
                              <li><strong>Restart Server:</strong> After editing <code>.env</code>, you must restart the app (<code>npm run dev</code>).</li>
                              <li><strong>Ad-Blockers:</strong> Some browsers block <code>generativelanguage.googleapis.com</code>. Try disabling your ad-blocker.</li>
                            </ul>
                          </section>
      
                          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Chrome className="text-indigo-600" size={20} /> M3 Mac Permissions
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              If Magic Sync fails, check your System Settings. Node.js requires "Full Disk Access" to read browser profile files located in the Library folder.
                            </p>
                          </section>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

      {/* Data & Backups Modal */}
      {showDataModal && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDataModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Database size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Command Center</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Database & Infrastructure Control</p>
                </div>
              </div>
              <button onClick={() => setShowDataModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-56 border-r border-slate-100 p-4 space-y-2 bg-slate-50/30">
                {[
                  { id: 'backups', label: 'Vault (Backups)', icon: ShieldCheck },
                  { id: 'migration', label: 'Migration Tools', icon: RefreshCw },
                  { id: 'danger', label: 'Security & Wipe', icon: AlertTriangle },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDataTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeDataTab === tab.id 
                      ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeDataTab === 'backups' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 hover:border-emerald-200 transition-colors group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <DownloadCloud size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Full JSON Snapshot</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Download a complete, readable backup of all bookmarks, folders, and AI metadata.</p>
                        <button onClick={handleBackup} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95">
                          Download .json
                        </button>
                      </div>

                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 hover:border-indigo-200 transition-colors group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <Database size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Raw SQLite DB</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Download the actual engine file. For advanced users or manual database repairs.</p>
                        <a href="/api/database/download" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center active:scale-95">
                          Download .db
                        </a>
                      </div>

                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 hover:border-blue-200 transition-colors group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <UploadCloudIcon size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Restore from Vault</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Upload a previous JSON backup to restore your library to a previous state.</p>
                        <button onClick={() => restoreInputRef.current?.click()} className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95">
                          Upload & Restore
                        </button>
                      </div>

                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 hover:border-emerald-200 transition-colors group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Clock size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Auto-Guard System</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Automatically creates a local recovery point every hour while you work.</p>
                        <button 
                          onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            autoBackupEnabled ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {autoBackupEnabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {autoBackupEnabled ? 'Active' : 'Offline'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeDataTab === 'migration' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Export by Source</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Export only bookmarks from a specific browser.</p>
                        <div className="flex gap-2">
                          <select id="exportSourceSelect" className="flex-1 bg-white border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                            {Array.from(new Set(bookmarks.map(b => b.source).filter(Boolean))).map(source => (
                              <option key={source as string} value={source as string}>{source as string}</option>
                            ))}
                          </select>
                          <button onClick={() => {
                            const select = document.getElementById('exportSourceSelect') as HTMLSelectElement;
                            if (select && select.value) handleExportSource(select.value);
                          }} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95">
                            Export
                          </button>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Direct Browser Assign</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Import bookmarks and tag them as coming from a specific browser.</p>
                        <div className="flex gap-2">
                          <select id="importSourceSelect" className="flex-1 bg-white border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                            <option value="chrome">Chrome</option>
                            <option value="safari">Safari</option>
                            <option value="firefox">Firefox</option>
                            <option value="brave">Brave</option>
                          </select>
                          <button onClick={() => document.getElementById('browserRestoreInput')?.click()} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95">
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeDataTab === 'danger' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex-1 pr-6">
                        <h4 className="font-bold text-rose-900 text-sm mb-1">Clear AI Chat History</h4>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          This will permanently erase all past conversations with the AI assistant.
                        </p>
                      </div>
                      <button onClick={async () => {
                        if (confirm("Clear all chat history?")) {
                          await fetch('/api/chat/clear', { method: 'POST' });
                          setChatMessages([]);
                        }
                      }} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all active:scale-95 flex items-center gap-2">
                        <Trash2 size={14} /> Clear Chat
                      </button>
                    </div>

                    <div className="bg-rose-600 text-white rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-rose-200">
                      <div className="flex-1 pr-6">
                        <h4 className="font-bold text-sm mb-1">Tactical Wipe (Wipe Database)</h4>
                        <p className="text-xs text-rose-100 leading-relaxed">
                          This erases everything in MarkFlow. It does NOT affect your original browser bookmarks.
                        </p>
                      </div>
                      <button onClick={() => {
                        clearDatabase();
                        setShowDataModal(false);
                      }} className="px-6 py-2.5 bg-white text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all active:scale-95 flex items-center gap-2">
                        <AlertTriangle size={14} /> Wipe Everything
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Coffee Digest Modal */}
      <CoffeeDigestModal 
        isOpen={showCoffeeDigest} 
        onClose={() => setShowCoffeeDigest(false)} 
        bookmarks={coffeeBookmarks}
        isBrewing={isBrewing}
        onBrewMore={brewCoffeeDigest}
        onChatAbout={(b: any) => {
          setShowCoffeeDigest(false);
          setShowChat(true);
          handleChat(`Tell me more about this bookmark: ${b.title} (${b.url})`);
        }}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Settings size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Application Settings</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Configure AI, Interface, and Intelligence</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-56 border-r border-slate-100 p-4 space-y-2 bg-slate-50/30">
                {[
                  { id: 'ai', label: 'AI Engine', icon: Sparkles },
                  { id: 'interface', label: 'Interface', icon: LayoutGrid },
                  { id: 'intelligence', label: 'Intelligence', icon: Brain },
                  { id: 'developer', label: 'Developer', icon: Terminal },
                  { id: 'support', label: 'Support', icon: Gift },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeSettingsTab === tab.id 
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeSettingsTab === 'ai' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" /> Model Selection
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {GEMINI_MODELS.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => setSelectedModel(m.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${selectedModel === m.id ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/5' : 'border-slate-100 hover:border-slate-200 bg-white shadow-sm'}`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                              <div className="text-[11px] text-slate-500">{m.description}</div>
                            </div>
                            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-100/50 px-2.5 py-1 rounded-lg border border-indigo-100">
                              ${m.costPer1M}/1M
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-500" /> Security & Connectivity
                      </h3>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleCheckApiKey}
                          disabled={apiKeyStatus === 'checking'}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                            apiKeyStatus === 'checking' ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' :
                            apiKeyStatus === 'valid' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                            apiKeyStatus === 'invalid' ? 'bg-rose-500 text-white shadow-rose-200' :
                            'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {apiKeyStatus === 'checking' ? <Loader2 className="animate-spin" size={18} /> : 
                           apiKeyStatus === 'valid' ? <CheckCircle2 size={18} /> : 
                           apiKeyStatus === 'invalid' ? <AlertCircle size={18} /> : 
                           <Key size={18} />}
                          {apiKeyStatus === 'checking' ? 'Verifying...' : 
                           apiKeyStatus === 'valid' ? 'Connection Secure' : 
                           apiKeyStatus === 'invalid' ? 'Key Verification Failed' : 
                           'Test AI Connection'}
                        </button>
                        
                        {apiKeyError && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-3">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span>{apiKeyError}</span>
                          </motion.div>
                        )}
                      </div>
                    </section>

                    <section className="bg-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain size={80} />
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400" /> Neural Usage Statistics
                      </h4>
                      <div className="grid grid-cols-3 gap-8 relative z-10">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Tokens</div>
                          <div className="text-2xl font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{aiStats.totalTokens.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Est. Cost</div>
                          <div className="text-2xl font-mono text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]">${aiStats.totalCost.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Queries</div>
                          <div className="text-2xl font-mono text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">{aiStats.requestCount}</div>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeSettingsTab === 'interface' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Medal size={16} className="text-purple-500" /> System Themes
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'light', label: 'Light', icon: <Info size={18} /> },
                          { id: 'dark', label: 'Dark', icon: <Clock size={18} /> },
                          { id: 'matrix', label: 'Matrix', icon: <Terminal size={18} /> },
                          { id: 'ranger', label: 'Ranger', icon: <img src="/ranger.png" className="w-5 h-5 rounded" /> }
                        ].map(t => (
                          <button 
                            key={t.id} 
                            onClick={() => setTheme(t.id as any)} 
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${theme === t.id ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-500/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {t.icon}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ImageIcon size={16} className="text-emerald-500" /> Matrix Customization
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-black rounded-2xl border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden relative group shadow-lg shadow-emerald-500/10">
                          {customMatrixLogo ? (
                            <img src={customMatrixLogo} alt="Custom Logo" className="w-full h-full object-contain filter grayscale sepia hue-rotate-[70deg] saturate-[500%] brightness-[0.8]" />
                          ) : (
                            <div className="text-emerald-500 font-mono text-[10px] text-center p-2 uppercase font-bold">No Data</div>
                          )}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/png';
                                input.onchange = (e: any) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const base64 = ev.target?.result as string;
                                      setCustomMatrixLogo(base64);
                                      localStorage.setItem('custom_matrix_logo', base64);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                              className="text-white text-[9px] font-black uppercase tracking-tighter"
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-sm mb-1">Matrix-ify Your Brand</h4>
                          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed italic">Upload a PNG and we'll apply digital rain filters.</p>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              if (!customMatrixLogo) return;
                              const link = document.createElement('a');
                              link.href = customMatrixLogo;
                              link.download = 'markflow-matrix-logo.png';
                              link.click();
                            }} disabled={!customMatrixLogo} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm active:scale-95">
                              Download
                            </button>
                            <button onClick={() => {
                              setCustomMatrixLogo(null);
                              localStorage.removeItem('custom_matrix_logo');
                            }} disabled={!customMatrixLogo} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50 active:scale-95">
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeSettingsTab === 'intelligence' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Medal size={16} className="text-indigo-600" /> User Personalization
                      </h3>
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Identify Yourself</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={userName}
                            onChange={(e) => {
                              setUserName(e.target.value);
                              localStorage.setItem('user_name', e.target.value);
                            }}
                            placeholder="Your name (e.g. Commander David)"
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 italic px-1">This allows the AI to address you by name and provide a more personalized command experience.</p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Brain size={16} className="text-indigo-600" /> Proactive Assistant
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Inactivity AI Prompt</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">Gemini will proactively offer help if you are idle for a specific time.</p>
                          </div>
                          <button 
                            onClick={() => {
                              const newVal = !autoPromptEnabled;
                              setAutoPromptEnabled(newVal);
                              localStorage.setItem('auto_prompt_enabled', String(newVal));
                            }}
                            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                              autoPromptEnabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {autoPromptEnabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {autoPromptEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        
                        {autoPromptEnabled && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <label className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em]">Inactivity Delay</label>
                              <span className="text-xs font-mono font-bold text-indigo-600 bg-white px-3 py-1 rounded-xl border border-indigo-100 shadow-sm">{autoPromptDelay}s</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="60" 
                              step="5"
                              value={autoPromptDelay}
                              onChange={(e) => setAutoPromptDelay(Number(e.target.value))}
                              className="w-full h-2 bg-indigo-200 rounded-full appearance-none cursor-pointer accent-indigo-600 mb-3"
                            />
                            <div className="flex justify-between text-[9px] text-indigo-400 font-black uppercase tracking-tighter">
                              <span>Reactive (5s)</span>
                              <span>Balanced Engine</span>
                              <span>Patient (60s)</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </section>

                    <section className="bg-amber-50 rounded-3xl p-6 border border-amber-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-amber-800 flex items-center gap-2 uppercase tracking-tight">
                          <Trophy size={18} /> Librarian Standing
                        </h3>
                        <span className="text-[10px] font-black text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest shadow-sm">
                          Tier {level}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-amber-700 uppercase tracking-widest">
                          <span>Next Rank Progress</span>
                          <span>{xp % 100} / 100 XP</span>
                        </div>
                        <div className="w-full bg-white/50 h-4 rounded-full overflow-hidden border border-amber-200 p-1">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xp % 100}%` }}
                            className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all duration-1000"
                          />
                        </div>
                        <p className="text-[10px] text-amber-600 italic font-medium leading-relaxed">Continue organizing and enriching your library to earn experience and unlock new titles.</p>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeSettingsTab === 'developer' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <section>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Terminal size={16} className="text-slate-700" /> Developer Quickstart
                      </h3>
                      <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl font-mono text-[11px] overflow-x-auto shadow-2xl border border-slate-800">
                        <p className="text-emerald-500 mb-3 font-bold"># MarkFlow v3.4.0 High-Performance Engine</p>
                        <p className="mb-1 text-slate-500 italic"># 1. Acquire source</p>
                        <p className="mb-3">git clone https://github.com/davidtkeane/markflow.git</p>
                        <p className="mb-1 text-slate-500 italic"># 2. Inject dependencies</p>
                        <p className="mb-3">cd markflow && npm install</p>
                        <p className="mb-1 text-slate-500 italic"># 3. Secure API credentials</p>
                        <p className="mb-3">echo 'VITE_GEMINI_API_KEY="your_key_here"' {'>'} .env</p>
                        <p className="mb-1 text-slate-500 italic"># 4. Ignite environment</p>
                        <p>npm run dev</p>
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed text-center">
                          Engine Optimized for MacBook M3 Pro • Node.js v18+ Recommended
                        </p>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeSettingsTab === 'support' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-center">
                    <section>
                      <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Gift size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Community Support</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-8">
                        MarkFlow is free and open-source. If you find it valuable, consider supporting the continued development of this project.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                        <a 
                          href="https://buymeacoffee.com/davidtkeane" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="group bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-amber-200 hover:shadow-lg active:scale-95"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              <Coffee size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Buy me a Coffee</span>
                          </div>
                        </a>

                        <a 
                          href="https://h3llcoin.com/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="group bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-orange-200 hover:shadow-lg active:scale-95"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-[#ff5722] group-hover:text-white transition-colors">
                              <Zap size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Buy me a H3llCoin</span>
                          </div>
                        </a>
                      </div>
                    </section>

                    <section className="pt-8 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Official Project Credits</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Architected by Commander David <br/>
                        Engines optimized by the AI Trinity (Gemini, Claude, Ollama)
                      </p>
                    </section>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-96 h-full bg-white shadow-2xl z-[60] border-l border-slate-200 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm leading-none">MarkFlow AI</h2>
                  <span className="text-[9px] opacity-75 uppercase tracking-widest font-bold">
                    {GEMINI_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={async () => {
                    if (confirm("Clear all chat history?")) {
                      await fetch('/api/chat/clear', { method: 'POST' });
                      setChatMessages([]);
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    const text = chatMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `markflow-chat-${new Date().toISOString().split('T')[0]}.txt`;
                    a.click();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                  title="Export Chat"
                >
                  <Download size={16} />
                </button>
                <button onClick={() => setShowChat(false)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Brain size={28} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-sm mb-1 uppercase tracking-tight">Intelligence Assistant</h3>
                  <p className="text-slate-500 text-[11px] px-8 leading-relaxed mb-6">
                    I can search your library, summarize bookmarks, and help you organize your collections.
                  </p>
                  
                  <div className="px-4 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left ml-1 mb-2">Try asking:</p>
                    {[
                      { icon: <Search size={12} />, label: "Find recipes and food links", text: "Search for all my recipes and food bookmarks." },
                      { icon: <AlertTriangle size={12} />, label: "Check for broken links", text: "Find all dead or broken links in my library." },
                      { icon: <Folder size={12} />, label: "Organize my tech folder", text: "Suggest sub-folders for my tech bookmarks." },
                      { icon: <Tag size={12} />, label: "Show most common tags", text: "Analyze my bookmarks and tell me which tags I use most." }
                    ].map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setChatInput(s.text);
                          handleChat(s.text);
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left flex items-center gap-2 group shadow-sm"
                      >
                        <span className="text-indigo-500 group-hover:scale-110 transition-transform">{s.icon}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {msg.role === 'user' ? (userName || 'You') : 'MarkFlow'}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[8px] text-slate-300 font-mono">{msg.timestamp}</span>
                    )}
                  </div>
                  <div className={`group relative max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'bg-white text-slate-800 border border-slate-100 shadow-sm'
                  }`}>
                    {msg.content}
                    
                    {msg.role === 'model' && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          alert("Copied to clipboard!");
                        }}
                        className="absolute -right-8 top-0 p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all"
                        title="Copy text"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {isChatting && (
                <div className="flex flex-col items-start animate-pulse">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">MarkFlow Thinking</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              
              <div id="chat-bottom"></div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChat(chatInput);
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative group">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your library..."
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors">
                    <Zap size={14} fill="currentColor" className="opacity-50" />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isChatting || !chatInput.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="text-[9px] text-slate-400 text-center mt-3 font-medium uppercase tracking-widest">Powered by Gemini Frontier Intelligence</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      {!showChat && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowChat(true)}
          className="fixed bottom-8 right-8 z-[90] w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors group"
          title="Open AI Chat"
        >
          <MessageSquare size={24} />
          <span className="absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Talk to AI
          </span>
        </motion.button>
      )}

      {/* Auto-Prompt Toast */}
      <AnimatePresence>
        {showAutoPrompt && autoPromptEnabled && !showChat && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className={`rounded-3xl shadow-2xl overflow-hidden border transition-colors ${
              theme === 'ranger' ? 'bg-[#1a1c1e] border-[#8a9099] text-white shadow-black/50' :
              theme === 'matrix' ? 'bg-black border-emerald-500/50 text-emerald-500 shadow-emerald-500/10' :
              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' :
              'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="p-5 flex items-center gap-4 relative">
                {/* One-click Close Button */}
                <button 
                  onClick={() => setShowAutoPrompt(false)}
                  className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
                    theme === 'matrix' ? 'hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-400' :
                    'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white'
                  }`}
                  title="Close"
                >
                  <X size={16} />
                </button>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg animate-pulse ${
                  theme === 'matrix' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-600 text-white shadow-indigo-500/20'
                }`}>
                  <Brain size={24} />
                </div>
                <div className="flex-1 pr-4">
                  <h4 className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                    theme === 'matrix' ? 'text-emerald-400' : 'text-indigo-400'
                  }`}>MarkFlow Intelligence</h4>
                  <h4 className="text-sm font-bold mb-0.5 leading-tight">Need help organizing?</h4>
                  <p className={`text-[11px] leading-relaxed ${
                    theme === 'matrix' ? 'text-emerald-600' : 'text-slate-400'
                  }`}>I can summarize your recent saves or find specific links.</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      setShowAutoPrompt(false);
                      setShowChat(true);
                    }}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-md active:scale-95 ${
                      theme === 'matrix' ? 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-500/20' :
                      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                    }`}
                  >
                    Chat Now
                  </button>
                  <button 
                    onClick={() => {
                      setShowAutoPrompt(false);
                      setAutoPromptDismissedUntil(Date.now() + 5 * 60 * 1000);
                    }}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border active:scale-95 ${
                      theme === 'matrix' ? 'bg-white/5 hover:bg-white/10 text-emerald-500 border-emerald-500/20' :
                      'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    Snooze (5m)
                  </button>
                </div>
              </div>
              
              {/* Refined Progress Bar */}
              <div className={`h-1 w-full relative ${
                theme === 'matrix' ? 'bg-emerald-900/20' : 'bg-black/5 dark:bg-white/5'
              }`}>
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className={`h-full shadow-[0_0_8px_rgba(99,102,241,0.5)] ${
                    theme === 'matrix' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-500'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <LevelUpModal 
        isOpen={showLevelUp} 
        onClose={() => setShowLevelUp(false)} 
        level={level} 
      />

      {/* Time Capsule Modal */}
      <TimeCapsuleModal 
        isOpen={showTimeCapsule} 
        onClose={() => setShowTimeCapsule(false)} 
        bookmark={capsuleBookmark}
        onChatAbout={(b: any) => {
          setShowTimeCapsule(false);
          setShowChat(true);
          handleChat(`Tell me more about this bookmark from my past: ${b.title} (${b.url})`);
        }}
      />

      <BookmarkDetailModal 
        isOpen={!!selectedBookmark}
        onClose={() => setSelectedBookmark(null)}
        bookmark={selectedBookmark}
        onUpdate={(updated: any) => {
          const newBookmarks = bookmarks.map(b => b.id === updated.id ? updated : b);
          setBookmarks(newBookmarks);
          fetch('/api/bookmarks/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookmarks: [updated] })
          });
          setSelectedBookmark(updated);
        }}
        onDelete={(id: string) => {
          const newBms = bookmarks.filter(b => b.id !== id);
          setBookmarks(newBms);
          fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
          setSelectedBookmark(null);
        }}
      />
    </div>
  );
}

// Subcomponents

function LevelUpModal({ isOpen, onClose, level }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
        className="bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(79,70,229,0.3)] w-full max-w-sm overflow-hidden text-center p-8 relative"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent -z-10"></div>
        
        <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 rotate-3">
          <Trophy size={48} className="text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">LEVEL UP!</h2>
        <p className="text-slate-500 font-medium mb-6">You've reached <span className="text-indigo-600 font-bold">Level {level}</span></p>
        
        <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            <span>Librarian Rank</span>
            <span className="text-indigo-500">{level > 10 ? 'Master Curator' : level > 5 ? 'Senior Archivist' : 'Junior Librarian'}</span>
          </div>
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-indigo-600 h-full"
            />
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          Keep Organizing
        </button>
        
        <div className="mt-6 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.3 
              }}
            >
              <Star size={16} className="text-amber-400 fill-amber-400" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TimeCapsuleModal({ isOpen, onClose, bookmark, onChatAbout }: any) {
  if (!isOpen || !bookmark) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Time Capsule</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <XCircle size={20} />
            </button>
          </div>
          <h2 className="text-2xl font-bold leading-tight">A Blast from the Past!</h2>
          <p className="text-sm opacity-90 mt-1">Remember this one? You saved it on {new Date(bookmark.dateAdded).toLocaleDateString()}.</p>
        </div>

        <div className="p-8">
          <div className="flex items-start gap-4 mb-8">
            <img 
              src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`} 
              alt="" 
              className="w-12 h-12 rounded-xl bg-slate-50 p-2 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{bookmark.title}</h3>
              <p className="text-sm text-slate-500 truncate">{new URL(bookmark.url).hostname}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
            >
              <Eye size={16} />
              Visit Page
            </a>
            <button 
              onClick={() => onChatAbout(bookmark)}
              className="flex items-center justify-center gap-2 py-3 bg-pink-50 text-pink-600 border border-pink-100 rounded-2xl font-bold text-sm hover:bg-pink-100 transition-all"
            >
              <Sparkles size={16} />
              AI Summary
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CoffeeDigestModal({ isOpen, onClose, bookmarks, isBrewing, onBrewMore, onChatAbout }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <Coffee size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Morning Coffee Digest</h2>
              <p className="text-xs text-slate-500">A fresh selection of bookmarks for your morning brew.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-amber-100 transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isBrewing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 size={48} className="animate-spin text-amber-600" />
              <p className="text-slate-500 font-medium animate-pulse">Brewing your digest...</p>
            </div>
          ) : (
            <>
              {bookmarks.map((b: any, i: number) => (
                <motion.div 
                  key={b.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=64`} 
                      alt="" 
                      className="w-10 h-10 rounded-lg bg-white p-1 shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors">{b.title}</h3>
                      <p className="text-xs text-slate-500 truncate mb-2">{new URL(b.url).hostname}</p>
                      <div className="flex gap-2">
                        <a 
                          href={b.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 px-2 py-1 rounded-md hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all"
                        >
                          Read Now
                        </a>
                        <button 
                          onClick={() => onChatAbout(b)}
                          className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 px-2 py-1 rounded-md hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                        >
                          AI Summary
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            onClick={onBrewMore}
            disabled={isBrewing}
            className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isBrewing ? "animate-spin" : ""} />
            Brew Another Cup
          </button>
          <button 
            onClick={() => {
              const randomFolder = bookmarks[Math.floor(Math.random() * bookmarks.length)]?.folder || 'Uncategorized';
              onClose();
              onChatAbout({ title: `Explore the '${randomFolder}' folder`, url: `folder:${randomFolder}` });
            }}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Sparkles size={18} />
            Surprise Me
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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

function BookmarkGridCard({ bookmark, idx, onDelete, onResurrect, onUpdate, onGeekMode, onArchive, isArchiving, onClick, gridStyle }: any) {
  const [imgError, setImgError] = useState(false);
  
  // Use Google's high-res favicon service for a fast, reliable image that doesn't require scraping
  const domain = new URL(bookmark.url).hostname;
  const imgSrc = bookmark.customIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;

  // Bento sizing logic
  const hasLongSummary = bookmark.summary && bookmark.summary.length > 100;
  const hasManyTags = bookmark.tags && bookmark.tags.length > 2;
  
  const isBento = gridStyle === 'bento';
  const isLarge = isBento && (hasLongSummary || (idx % 7 === 0)); // Every 7th or long summary
  const isWide = isBento && (hasManyTags || (idx % 11 === 0)); // Every 11th or many tags

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.02, 0.3) }}
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col cursor-pointer
        ${isBento ? (isLarge ? 'row-span-2 h-[32rem]' : 'h-80') : 'w-full h-80'} 
        ${isWide ? 'sm:col-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden flex items-center justify-center shrink-0 border-b border-slate-100 bg-slate-50
        ${isLarge ? 'h-64' : 'h-36'}`}
      >
        {!imgError ? (
          <img 
            src={imgSrc} 
            alt={bookmark.title} 
            className={`${isLarge ? 'w-32 h-32' : 'w-16 h-16'} object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500`} 
            onError={() => setImgError(true)} 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
            <ImageIcon size={isLarge ? 64 : 32} className="text-indigo-200" />
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <div onClick={(e) => {
            e.stopPropagation();
            const updated = { ...bookmark, isChecked: bookmark.isChecked ? 0 : 1 };
            onUpdate(updated);
          }}>
            {bookmark.isChecked ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500 text-white text-[10px] font-bold shadow-lg cursor-pointer hover:bg-green-600 transition-colors">
                <CheckCircle2 size={12} />
                Checked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold shadow-sm cursor-pointer hover:bg-slate-300 transition-colors">
                <Activity size={12} />
                Unchecked
              </span>
            )}
          </div>
          
          {bookmark.status !== 'alive' && bookmark.status !== 'unknown' && (
            <StatusBadge status={bookmark.status} />
          )}
          
          <div className="flex gap-2">
            {bookmark.readLater && (
              <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                <BookOpen size={12} />
              </div>
            )}
          </div>
        </div>

        {/* Gradient Overlay for large cards */}
        {isLarge && (
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">
          <Folder size={10} className="text-indigo-400" />
          <span className="truncate">{bookmark.folder || 'Uncategorized'}</span>
        </div>

        <div className="flex items-start gap-3 mb-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-3.5 h-3.5" onError={(e) => e.currentTarget.style.display = 'none'} referrerPolicy="no-referrer" />
          </div>
          <h3 className={`font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors
            ${isLarge ? 'text-xl' : 'text-sm line-clamp-2'}`} title={bookmark.title}>
            {bookmark.title}
          </h3>
        </div>

        <p className="text-[10px] text-slate-400 font-mono truncate mb-4 opacity-60">{bookmark.url}</p>
        
        {bookmark.summary && (
          <p className={`text-slate-500 leading-relaxed mb-4
            ${isLarge ? 'text-sm line-clamp-6' : 'text-xs line-clamp-2'}`}>
            {bookmark.summary}
          </p>
        )}

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {bookmark.tags.slice(0, isLarge ? 6 : 3).map((tag: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-tighter border border-slate-200">
                {tag}
              </span>
            ))}
            {bookmark.tags.length > (isLarge ? 6 : 3) && (
              <span className="text-[9px] text-slate-400 font-bold">+{bookmark.tags.length - (isLarge ? 6 : 3)}</span>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
              {bookmark.title.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-900">Added</span>
              <span className="text-[9px] text-slate-400 font-medium">{bookmark.dateAdded ? new Date(bookmark.dateAdded).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => {
                const updated = { ...bookmark, isChecked: bookmark.isChecked ? 0 : 1 };
                onUpdate(updated);
              }} 
              className={`p-2 rounded-xl transition-colors ${bookmark.isChecked ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
              title={bookmark.isChecked ? "Mark as Unchecked" : "Mark as Checked"}
            >
              <CheckCircle2 size={14} />
            </button>
            <button onClick={onGeekMode} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Geek Mode">
              <Terminal size={14} />
            </button>
            <button 
              onClick={onArchive} 
              disabled={isArchiving}
              className={`p-2 rounded-xl transition-colors ${bookmark.archivedAt ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} 
            >
              {isArchiving ? <Loader2 size={14} className="animate-spin" /> : <Ghost size={14} />}
            </button>
            <button onClick={() => {
              const updated = { ...bookmark, readLater: bookmark.readLater ? 0 : 1 };
              onUpdate(updated);
            }} className={`p-2 rounded-xl transition-colors ${bookmark.readLater ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
              <BookOpen size={14} />
            </button>
            <a href={bookmark.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <LinkIcon size={14} />
            </a>
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BookmarkDetailModal({ isOpen, onClose, bookmark, onUpdate, onDelete }: any) {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'alive' | 'dead' | 'redirect' | 'idle'>('idle');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  
  useEffect(() => {
    if (isOpen && bookmark) {
      setEditedTitle(bookmark.title);
      setHealthStatus('checking');
      fetch('/api/check-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bookmark.url })
      })
      .then(res => res.json())
      .then(data => setHealthStatus(data.status))
      .catch(() => setHealthStatus('dead'));
    } else {
      setHealthStatus('idle');
    }
  }, [isOpen, bookmark]);

  const handleFetchTitle = async () => {
    if (!bookmark) return;
    setIsFetchingTitle(true);
    try {
      const res = await fetch('/api/fetch-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bookmark.url })
      });
      const data = await res.json();
      if (data.title) {
        setEditedTitle(data.title);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingTitle(false);
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== bookmark.title) {
      onUpdate({ ...bookmark, title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  if (!isOpen || !bookmark) return null;

  const domain = new URL(bookmark.url).hostname;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh]"
      >
        {/* Left Side: Preview & Visuals */}
        <div className="w-full md:w-1/2 bg-slate-50 border-r border-slate-100 flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" className="w-8 h-8 rounded-lg" />
              <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{domain}</span>
            </div>
            <div className="flex items-center gap-2">
              {healthStatus === 'checking' ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Loader2 size={14} className="animate-spin" />
                  Checking status...
                </div>
              ) : (
                <StatusBadge status={healthStatus} />
              )}
            </div>
          </div>
          
          <div className="flex-1 relative bg-slate-200 overflow-hidden">
            {/* Iframe Preview - Note: Many sites block this via X-Frame-Options */}
            <iframe 
              src={bookmark.url} 
              className="w-full h-full border-none bg-white" 
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-900/5 backdrop-blur-[1px]">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
                <Info size={14} className="text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Live Preview Mode</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]">{bookmark.url}</p>
            <a href={bookmark.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
              <LinkIcon size={14} />
              Open Original
            </a>
          </div>
        </div>

        {/* Right Side: Metadata & Actions */}
        <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                <Folder size={12} />
                {bookmark.folder || 'Uncategorized'}
              </div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    autoFocus
                    type="text" 
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="text-2xl font-black text-slate-900 leading-tight border-b-2 border-indigo-500 focus:outline-none bg-transparent w-full"
                  />
                  <button onClick={handleSaveTitle} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    <Check size={20} />
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{bookmark.title}</h2>
                  <button onClick={() => setIsEditingTitle(true)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover/title:opacity-100 transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={handleFetchTitle} 
                    disabled={isFetchingTitle}
                    className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover/title:opacity-100 transition-all disabled:opacity-50"
                    title="Fetch Title from URL"
                  >
                    {isFetchingTitle ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <XCircle size={24} />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Summary Section */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles size={12} className="text-indigo-400" />
                AI Summary
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {bookmark.summary || "No summary available. Use 'AI Enrich' to generate one."}
                </p>
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tags & Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {bookmark.tags && bookmark.tags.length > 0 ? (
                  bookmark.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-xs font-bold">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No tags assigned</span>
                )}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date Added</span>
                <span className="text-sm font-bold text-slate-900">{new Date(bookmark.dateAdded).toLocaleDateString()}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Source</span>
                <span className="text-sm font-bold text-slate-900 capitalize">{bookmark.source || 'Manual'}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdate({ ...bookmark, isChecked: bookmark.isChecked ? 0 : 1 })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${bookmark.isChecked ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <CheckCircle2 size={16} />
                  {bookmark.isChecked ? 'Checked' : 'Unchecked'}
                </button>
                <button 
                  onClick={() => onUpdate({ ...bookmark, readLater: bookmark.readLater ? 0 : 1 })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${bookmark.readLater ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <BookOpen size={16} />
                  Read Later
                </button>
              </div>
              <button 
                onClick={async () => {
                  if (confirm("Permanently delete this bookmark?")) {
                    try {
                      await fetch(`/api/bookmarks/${bookmark.id}`, { method: 'DELETE' });
                      setBookmarks(bookmarks.filter(b => b.id !== bookmark.id));
                      onClose();
                    } catch (err) {
                      console.error("Failed to delete bookmark", err);
                      alert("Failed to delete bookmark.");
                    }
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
