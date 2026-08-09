"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { useEffect } from "react";
import TopBar from "../toolbar/TopBar";
import NavigationBar from "../toolbar/NavigationBar";
import BookmarkBar from "../toolbar/BookmarkBar";
import FindBar from "../toolbar/FindBar";
import AISidebar from "../ai/AISidebar";
import WebviewContainer from "../browser/WebviewContainer";
import ClearDataModal from "../modals/ClearDataModal";
import SavePasswordPrompt from "../toolbar/SavePasswordPrompt";



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
    reopenLastClosedTab,
    updateTab,
    mergeTabs,
    bookmarkBarVisibility,
    setBookmarkBarVisibility,
    downloadSettings,
    updateDownloadSettings,
    openDownloadsTab,
    openExtensionsTab,
    theme,
    customColors
  } = useBrowserStore();

  useEffect(() => {
    // Reset custom inline styles
    document.documentElement.style.removeProperty('--background');
    document.documentElement.style.removeProperty('--surface');
    document.documentElement.style.removeProperty('--surface-hover');
    document.documentElement.style.removeProperty('--border');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--foreground');

    if (theme === 'custom' && customColors) {
      document.body.classList.remove('light-theme');
      document.documentElement.dataset.theme = 'custom';
      
      if (customColors.background) document.documentElement.style.setProperty('--background', customColors.background);
      if (customColors.surface) {
        document.documentElement.style.setProperty('--surface', customColors.surface);
        // Simple hover calculation: just use the same or we could darken/lighten it
        document.documentElement.style.setProperty('--surface-hover', customColors.surface);
      }
      if (customColors.border) document.documentElement.style.setProperty('--border', customColors.border);
      if (customColors.primary) document.documentElement.style.setProperty('--accent', customColors.primary);
      if (customColors.text) document.documentElement.style.setProperty('--foreground', customColors.text);
    } else if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.dataset.theme = 'light';
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.dataset.theme = 'dark';
    }
  }, [theme, customColors]);

  useEffect(() => {
    if (window.electron && window.electron.themeAPI) {
      window.electron.themeAPI.get().then(data => {
        useBrowserStore.setState({ theme: data.effective });
      });
      window.electron.themeAPI.onChange((data) => {
        useBrowserStore.setState({ theme: data.effective });
      });
    }

  }, []);

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
    
    // Set incognito state on the client to avoid hydration mismatch
    const isIncognito = searchParams.get('incognito') === 'true';
    if (isIncognito !== useBrowserStore.getState().isIncognitoWindow) {
      useBrowserStore.setState({ isIncognitoWindow: isIncognito });
    }

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
    } else {
      // No initialTab param provided (e.g. fresh New Window).
      // If the current tab is the hardcoded '1', replace it with a unique ID
      // so that multiple windows don't share the same tabId in Electron tabManager!
      const state = useBrowserStore.getState();
      if (state.tabs.length === 1 && state.tabs[0].id === '1') {
        const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        const uniqueTab = { ...state.tabs[0], id: uniqueId };
        useBrowserStore.setState({
          tabs: [uniqueTab],
          activeTabId: uniqueId
        });
      }
    }
  }, []);

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

    // Handle context menu actions
    const cleanupContextMenu = window.electron.onContextMenuCommand?.((data) => {
      const { action, url } = data;
      const { addTab, activeTabId } = useBrowserStore.getState();
      
      if (action === 'open-new-tab') {
        addTab(url, 'New Tab', activeTabId);
      } else if (action === 'open-new-window') {
        if (window.electron.detachTab) {
          window.electron.detachTab({ url, title: 'New Tab', id: Date.now().toString() }, false);
        }
      } else if (action === 'open-incognito') {
        if (window.electron.detachTab) {
          window.electron.detachTab({ url, title: 'New Tab', id: Date.now().toString() }, true);
        }
      }
    });

    // Handle global keyboard shortcuts
    const cleanupShortcut = window.electron.onKeyboardShortcut?.((action) => {
      const state = useBrowserStore.getState();
      const activePaneTabId = state.focusedPane === 'secondary' && state.splitTabId ? state.splitTabId : state.activeTabId;

      if (action === 'new-tab') {
        state.addTab();
      } else if (action === 'close-tab') {
        state.removeTab(state.activeTabId);
      } else if (action === 'find') {
        state.updateFindState(state.activeTabId, { isVisible: true });
      } else if (action === 'go-back' || action === 'go-forward') {
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action });
      }
    });

    return () => {
      cleanupRequest?.();
      cleanupReceive?.();
      cleanupNewWindow?.();
      cleanupContextMenu?.();
      cleanupShortcut?.();
    };
  }, [mergeTabs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const state = useBrowserStore.getState();
      const activePaneTabId = state.focusedPane === 'secondary' && state.splitTabId ? state.splitTabId : state.activeTabId;
      
      // F11 does not need Ctrl
      if (key === 'f11') {
        e.preventDefault();
        window.electron?.toggleFullscreen?.();
        return;
      }
      
      // F5 / Shift+F5 (Reload / Hard Reload)
      if (key === 'f5') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: e.shiftKey ? 'hard-reload' : 'reload' });
        return;
      }

      // F6 (Focus Omnibox)
      if (key === 'f6') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-address-bar'));
        return;
      }

      // Esc (Stop)
      if (key === 'escape') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'stop' });
        return;
      }

      // Alt+Left / Backspace (Back)
      if ((e.altKey && key === 'arrowleft') || (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && key === 'backspace' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'go-back' });
        return;
      }

      // Alt+Right / Shift+Backspace (Forward)
      if ((e.altKey && key === 'arrowright') || (e.shiftKey && key === 'backspace' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'go-forward' });
        return;
      }

      // Alt+D (Focus Omnibox)
      if (e.altKey && key === 'd') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-address-bar'));
        return;
      }

      // Verse-specific non-ctrl shortcuts (Alt+Shift+S, Alt+Shift+R, Alt+Shift+T, Alt+Shift+D)
      if (e.altKey && e.shiftKey) {
        if (key === 's') { // Split view
          e.preventDefault();
          const state = useBrowserStore.getState();
          if (state.splitTabId) state.clearSplit();
          else if (state.tabs.length > 1) state.setSplitTab(state.tabs.find(t => t.id !== state.activeTabId)?.id);
          return;
        }
        if (key === 'r') { // Reading mode
          e.preventDefault();
          window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'toggle-reader-mode' });
          return;
        }
        if (key === 't') { // Theme (not implemented yet, but reserved)
          e.preventDefault();
          return;
        }
        if (key === 'd') { // Deep Research (using Alt+Shift+D to avoid Ctrl+Shift+R clash)
          e.preventDefault();
          const state = useBrowserStore.getState();
          state.setResearchMode(!state.researchMode);
          if (!state.isAISidebarOpen) state.setAISidebarOpen(true);
          return;
        }
      }

      // Must have Ctrl or Cmd key for the rest
      if (!e.ctrlKey && !e.metaKey) return;
      
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

      if (key === 'f') {
        e.preventDefault();
        useBrowserStore.getState().updateFindState(activePaneTabId, { isVisible: true });
        return;
      }

      if (key === 'g') {
        e.preventDefault();
        // F3 is typically find next, but we capture Ctrl+G
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: e.shiftKey ? 'find-previous' : 'find-next' });
        return;
      }

      if (key === 'p') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'print' });
        return;
      }

      if (key === 's') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'save-page' });
        return;
      }

      if (key === 'r') {
        e.preventDefault();
        if (window.electron?.tabManager) {
          window.electron.tabManager.action({ tabId: activePaneTabId, action: e.shiftKey ? 'hard-reload' : 'reload' });
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

      if (key === 'o') {
        e.preventDefault();
        if (e.shiftKey) {
          openBookmarksTab();
        } else {
          window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'open-file' });
        }
        return;
      }

      if (key === 'l') {
        e.preventDefault();
        if (e.shiftKey) { // Ctrl+Shift+L: Toggle AI Sidebar
          const state = useBrowserStore.getState();
          state.setAISidebarOpen(!state.isAISidebarOpen);
        } else { // Ctrl+L: Focus Omnibox
          window.dispatchEvent(new CustomEvent('focus-address-bar'));
        }
        return;
      }

      if (key === 'k' || key === 'e') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-address-bar', { detail: { search: true } }));
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (e.shiftKey) { // Ctrl+Shift+Delete
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-clear-data'));
        }
        return;
      }

      if (key === 't') {
        e.preventDefault();
        if (e.shiftKey) {
          reopenLastClosedTab();
        } else {
          addTab();
        }
        return;
      }

      if (key === 'w') {
        e.preventDefault();
        removeTab(activeTabId);
        return;
      }
      
      if (key === 'n') {
        e.preventDefault();
        if (e.shiftKey) {
          window.electron?.newIncognitoWindow?.();
        } else {
          window.electron?.newWindow?.();
        }
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
      // Ctrl + =/+ (Zoom in), Ctrl + - (Zoom out), Ctrl + 0 (Zoom reset)
      if (key === '=' || key === '+') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'zoom-in' });
        return;
      }
      if (key === '-') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'zoom-out' });
        return;
      }
      if (key === '0') {
        e.preventDefault();
        window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'zoom-reset' });
        return;
      }
    };

    const cleanupWebviewKeydown = window.electron?.tabManager?.onWebviewKeydown?.((data) => {
      handleKeyDown({
        key: data.key,
        code: data.code,
        ctrlKey: data.ctrlKey,
        shiftKey: data.shiftKey,
        altKey: data.altKey,
        metaKey: data.metaKey,
        preventDefault: () => {}, // mock
        target: { tagName: 'WEBVIEW' } // mock target
      });
    });

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cleanupWebviewKeydown?.();
    };
  }, [
    openHistoryTab, 
    openBookmarksTab, 
    openDownloadsTab,
    openExtensionsTab,
    toggleBookmark, 
    bookmarkBarVisibility,
    setBookmarkBarVisibility,
    reopenLastClosedTab,
    tabs, 
    activeTabId, 
    setActiveTab, 
    addTab, 
    removeTab
  ]);

  useEffect(() => {
    if (!window.electron) return;

    // On app startup, mark any downloads that were progressing/paused as interrupted
    // since the Electron DownloadItem references are lost after restart
    useBrowserStore.getState().markStaleDownloads();

    window.electron.onDownloadStarted((item) => {
      useBrowserStore.getState().addDownload(item);
    });

    window.electron.onDownloadProgress((data) => {
      useBrowserStore.getState().updateDownload(data.id, data);
    });

    window.electron.onDownloadDone((data) => {
      useBrowserStore.getState().updateDownload(data.id, data);
    });

    if (window.electron.onPermissionUpdated) {
      window.electron.onPermissionUpdated(({ origin, permission, granted }) => {
        useBrowserStore.getState().updateSessionPermission(origin, permission, granted);
      });
    }

    if (window.electron?.tabManager?.onTabEvent) {
      const cleanup = window.electron.tabManager.onTabEvent((data) => {
        if (data && data.action === 'open-tab') {
          if (data.url === 'browser://extensions') {
            useBrowserStore.getState().openExtensionsTab();
          } else if (data.url) {
            useBrowserStore.getState().addTab(data.url);
          }
        }
      });
      return cleanup;
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden font-sans">
      {/* Top Toolbar Area */}
      <div className="flex flex-col w-full z-50 relative shadow-sm" role="navigation" aria-label="Main toolbar">
        <TopBar />
        <NavigationBar />
        {(bookmarkBarVisibility === 'always' || (bookmarkBarVisibility === 'new-tab' && tabs.find(t => t.id === activeTabId)?.url === 'browser://newtab')) && (
          <BookmarkBar />
        )}
        <FindBar tabId={useBrowserStore.getState().focusedPane === 'secondary' && useBrowserStore.getState().splitTabId ? useBrowserStore.getState().splitTabId : activeTabId} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative" role="main">
        {/* Browser Content (Webviews) */}
        <div className="flex-1 bg-surface relative overflow-auto">
          <WebviewContainer />
        </div>

        {/* AI Sidebar */}
        {isAISidebarOpen && (
          <div className="border-l border-border bg-background shrink-0 shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.5)] z-20">
            <AISidebar />
          </div>
        )}
      </div>

      {/* Clear Data Modal */}
      <ClearDataModal />
      <SavePasswordPrompt />
    </div>
  );
}
