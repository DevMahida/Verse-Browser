"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { useEffect } from "react";
import TopBar from "../toolbar/TopBar";
import NavigationBar from "../toolbar/NavigationBar";
import BookmarkBar from "../toolbar/BookmarkBar";
import AISidebar from "../ai/AISidebar";
import WebviewContainer from "../browser/WebviewContainer";



export default function BrowserLayout() {
  const { 
    isAISidebarOpen, 
    openHistoryTab, 
    openBookmarksTab,
    toggleBookmark,
    tabs, 
    activeTabId, 
    setActiveTab, 
    addTab, 
    removeTab,
    updateTab,
    mergeTabs,
    bookmarkBarVisibility,
    setBookmarkBarVisibility,
    downloadSettings,
    updateDownloadSettings,
    openDownloadsTab,
    openExtensionsTab,
    theme
  } = useBrowserStore();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    // Fetch default path if not set
    if (!downloadSettings?.defaultPath && window.electron) {
      window.electron.getDefaultDownloadPath().then(path => {
        updateDownloadSettings({ defaultPath: path });
      });
    }
  }, [downloadSettings?.defaultPath, updateDownloadSettings]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialTabParam = searchParams.get('initialTab');
    if (initialTabParam) {
      try {
        const initialTab = JSON.parse(initialTabParam);
        useBrowserStore.setState({
          tabs: [initialTab],
          activeTabId: initialTab.id
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse initialTab", e);
      }
    }
  }, [updateTab]);

  // Listen for cross-window tab merge events and new window events
  useEffect(() => {
    if (!window.electron) return;

    // Main process asks us to send our tabs for merging into another window
    const cleanupRequest = window.electron.onRequestTabsForMerge?.(() => {
      const currentTabs = useBrowserStore.getState().tabs;
      window.electron.sendTabsForMerge(currentTabs);
    });

    // Main process sends us tabs from another window to absorb
    const cleanupReceive = window.electron.onReceiveMergedTabs?.((incomingTabs) => {
      mergeTabs(incomingTabs);
    });

    // Main process tells us a webview tried to open a new window
    const cleanupNewWindow = window.electron.onWebviewNewWindow?.((data) => {
      useBrowserStore.getState().addTab(data.url, 'New Tab');
    });

    return () => {
      cleanupRequest?.();
      cleanupReceive?.();
      cleanupNewWindow?.();
    };
  }, [mergeTabs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Must have Ctrl or Cmd key
      if (!e.ctrlKey && !e.metaKey) return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'h') {
        e.preventDefault();
        openHistoryTab();
        return;
      }

      if (key === 'j') {
        e.preventDefault();
        openDownloadsTab();
        return;
      }

      if (key === 'e' && e.shiftKey) {
        e.preventDefault();
        openExtensionsTab();
        return;
      }

      if (key === 'b' && e.shiftKey) {
        e.preventDefault();
        setBookmarkBarVisibility(bookmarkBarVisibility === 'always' ? 'new-tab' : 'always');
        return;
      }

      if (key === 'r') {
        e.preventDefault();
        const webview = document.getElementById(`webview-${activeTabId}`);
        if (webview && webview.reload) {
          webview.reload();
        }
        return;
      }

      if (key === 'd') {
        e.preventDefault();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && activeTab.url) {
          toggleBookmark(activeTab.url, activeTab.title, activeTab.favicon);
        }
        return;
      }

      if (key === 'o' && e.shiftKey) {
        e.preventDefault();
        openBookmarksTab();
        return;
      }

      if (key === 't') {
        e.preventDefault();
        addTab();
        return;
      }

      if (key === 'w') {
        e.preventDefault();
        removeTab(activeTabId);
        return;
      }
      
      // Ctrl + 1-8
      if (key >= '1' && key <= '8') {
        e.preventDefault();
        const index = parseInt(key) - 1;
        if (index < tabs.length) {
          setActiveTab(tabs[index].id);
        }
        return;
      }

      // Ctrl + 9 (Last tab)
      if (key === '9') {
        e.preventDefault();
        if (tabs.length > 0) {
          setActiveTab(tabs[tabs.length - 1].id);
        }
        return;
      }
      
      // Ctrl + Tab and Ctrl + Shift + Tab
      if (key === 'tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        if (currentIndex === -1) return;
        
        let nextIndex;
        if (e.shiftKey) {
          // Previous tab
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else {
          // Next tab
          nextIndex = (currentIndex + 1) % tabs.length;
        }
        setActiveTab(tabs[nextIndex].id);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openHistoryTab, 
    openBookmarksTab, 
    openDownloadsTab,
    openExtensionsTab,
    toggleBookmark, 
    tabs, 
    activeTabId, 
    setActiveTab, 
    addTab, 
    removeTab,
    bookmarkBarVisibility,
    setBookmarkBarVisibility
  ]);

  useEffect(() => {
    if (!window.electron) return;

    window.electron.onDownloadStarted((item) => {
      useBrowserStore.getState().addDownload(item);
    });

    window.electron.onDownloadProgress((data) => {
      useBrowserStore.getState().updateDownload(data.id, data);
    });

    window.electron.onDownloadDone((data) => {
      useBrowserStore.getState().updateDownload(data.id, data);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden font-sans">
      {/* Top Toolbar Area */}
      <div className="flex flex-col w-full z-50 relative shadow-sm">
        <TopBar />
        <NavigationBar />
        {(bookmarkBarVisibility === 'always' || (bookmarkBarVisibility === 'new-tab' && tabs.find(t => t.id === activeTabId)?.url === 'browser://newtab')) && (
          <BookmarkBar />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Browser Content (Webviews) */}
        <div className="flex-1 bg-surface relative overflow-auto">
          <WebviewContainer />
        </div>

        {/* AI Sidebar */}
        {isAISidebarOpen && (
          <div className="w-87.5 border-l border-border bg-background shrink-0 shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.5)] z-20">
            <AISidebar />
          </div>
        )}
      </div>
    </div>
  );
}
