"use client";

import { memo, useEffect, useRef, useState, useCallback } from "react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';
import Homepage from "../homepage/Homepage";
import HistoryPage from "./HistoryPage";
import BookmarksPage from "./BookmarksPage";
import ReadingListPage from "./ReadingListPage";
import ReaderPage from "./ReaderPage";
import DownloadsPage from "./DownloadsPage";
import ExtensionsPage from "./ExtensionsPage";
import SettingsPage from "./SettingsPage";

const TabWebview = memo(({ tab, isActive, onFocus, styleClass }) => {
  const containerRef = useRef(null);
  const { updateTab, updateFindState, addToHistory, updateHistoryMeta, checkLoginState, isIncognitoWindow, removeTab } = useBrowserStore(
    useShallow((state) => ({
      updateTab: state.updateTab,
      updateFindState: state.updateFindState,
      addToHistory: state.addToHistory,
      updateHistoryMeta: state.updateHistoryMeta,
      checkLoginState: state.checkLoginState,
      isIncognitoWindow: state.isIncognitoWindow,
      removeTab: state.removeTab,
    }))
  );
  
  const internalUrl = useRef(tab.url);
  const [initialUrl] = useState(tab.url);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const isMounted = useRef(false);

  // 1. Create & Destroy Tab
  useEffect(() => {
    if (!window.electron || !window.electron.tabManager) return;
    
    window.electron.tabManager.create({ 
      tabId: tab.id, 
      url: initialUrl, 
      partition: isIncognitoWindow ? 'incognito' : 'persist:main' 
    });
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.electron.tabManager.destroy(tab.id);
    };
  }, [tab.id, initialUrl, isIncognitoWindow]);

  // 2. Event Listener
  useEffect(() => {
    if (!window.electron || !window.electron.tabManager) return;
    const cleanup = window.electron.tabManager.onTabEvent(({ tabId, eventName, data }) => {
      if (tabId !== tab.id) return;
      
      switch (eventName) {
        case 'did-navigate':
        case 'did-navigate-in-page':
          internalUrl.current = data.url;
          if (!isIncognitoWindow) addToHistory(data.url);
          updateTab(tab.id, { url: data.url, error: null });
          break;
        case 'page-title-updated':
          updateTab(tab.id, { title: data.title });
          if (!isIncognitoWindow) updateHistoryMeta(internalUrl.current, { title: data.title });
          break;
        case 'page-favicon-updated':
          if (data.favicons && data.favicons.length > 0) {
            updateTab(tab.id, { favicon: data.favicons[0] });
            if (!isIncognitoWindow) updateHistoryMeta(internalUrl.current, { favicon: data.favicons[0] });
          }
          break;
        case 'did-start-loading':
          updateTab(tab.id, { isLoading: true, error: null });
          break;
        case 'did-stop-loading':
          updateTab(tab.id, { isLoading: false });
          if (internalUrl.current && internalUrl.current.includes('google.com')) checkLoginState();
          break;
        case 'did-fail-load':
          updateTab(tab.id, { isLoading: false, error: data.errorDescription });
          break;
        case 'zoom-changed':
          useBrowserStore.getState().setZoomLevel(tab.id, data.level);
          break;
        case 'found-in-page':
          console.log(`[WebviewContainer] found-in-page event received:`, data);
          updateFindState(tab.id, { 
            activeMatchOrdinal: data.activeMatchOrdinal, 
            matches: data.matches 
          });
          break;
        case 'media-started-playing':
          updateTab(tab.id, { isPlayingAudio: true });
          break;
        case 'media-paused':
          updateTab(tab.id, { isPlayingAudio: false });
          break;
        case 'close':
          removeTab(tab.id);
          break;
      }
    });
    return cleanup;
  }, [tab.id, updateTab, addToHistory, updateHistoryMeta, checkLoginState, isIncognitoWindow, updateFindState, removeTab]);

  // 3. Bounds & Visibility
  useEffect(() => {
    if (!window.electron || !window.electron.tabManager || !containerRef.current) return;
    
    const updateBounds = () => {
      if (!isMounted.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // If the container has no size yet, don't update bounds
      if (rect.width === 0 || rect.height === 0) return;
      
      window.electron.tabManager.updateBounds({
        tabId: tab.id,
        bounds: { 
          x: Math.round(rect.x), 
          y: Math.round(rect.y), 
          width: Math.round(rect.width), 
          height: Math.round(Math.max(0, rect.height))
        },
        isActive: isActive // Always keep the active tab attached to prevent Chromium network throttling
      });
    };

    const resizeObserver = new ResizeObserver(() => updateBounds());
    resizeObserver.observe(containerRef.current);
    
    // Slight delay for initial bounds to ensure React has fully painted
    const timer = setTimeout(updateBounds, 50);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [tab.id, isActive]);

  // 4. Remote Navigation
  useEffect(() => {
    if (tab.url !== internalUrl.current && window.electron?.tabManager) {
      internalUrl.current = tab.url;
      window.electron.tabManager.navigate({ tabId: tab.id, url: tab.url });
    }
  }, [tab.url, tab.id]);

  // 5. Audio Muted state
  useEffect(() => {
    if (window.electron?.tabManager) {
      window.electron.tabManager.action({ tabId: tab.id, action: 'set-muted', data: { muted: tab.isMuted } });
    }
  }, [tab.isMuted, tab.id]);
  
  // 6. Keyboard Shortcuts
  useEffect(() => {
    if (!isActive || !window.electron?.onKeyboardShortcut) return;
    
    const cleanup = window.electron.onKeyboardShortcut((action) => {
      try {
        if (action === 'reload' || action === 'hard-reload' || action === 'toggle-devtools') {
          window.electron.tabManager.action({ tabId: tab.id, action });
        }
      } catch (e) {
        console.error('Failed to handle keyboard shortcut on webview:', e);
      }
    });
    
    return cleanup;
  }, [isActive, tab.id]);

  return (
    <div 
      className={`absolute ${styleClass ? styleClass : 'inset-0 w-full h-full'} ${isActive ? 'z-10' : 'z-0 pointer-events-none'}`}
      onClick={onFocus}
      onMouseDown={() => {
        // Transfer keyboard focus to the native WebContentsView so key events
        // (e.g. 'F' for fullscreen, Space for pause) reach the page content
        if (isActive && window.electron?.tabManager?.focusTab) {
          window.electron.tabManager.focusTab(tab.id);
        }
      }}
    >
      {tab.error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background text-foreground">
          <div className="text-red-500 mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">This site can&apos;t be reached</h2>
          <p className="text-foreground/70 mb-6">{tab.url}</p>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <p className="text-sm text-foreground/80 font-mono">ERR: {tab.error}</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        id={`webview-${tab.id}`}
        className={`w-full h-full border-none outline-none relative overflow-hidden ${tab.error ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
});
TabWebview.displayName = 'TabWebview';

export default function WebviewContainer() {
  const { tabs, activeTabId, splitTabId, focusedPane, setFocusedPane, isDraggingTab } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      splitTabId: state.splitTabId,
      focusedPane: state.focusedPane,
      setFocusedPane: state.setFocusedPane,
      isDraggingTab: state.isDraggingTab,
    }))
  );

  const [isStacked, setIsStacked] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsStacked(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="w-full h-full relative flex">
      {tabs.map((tab) => {
        const isPrimary = tab.id === activeTabId;
        const isSecondary = tab.id === splitTabId;
        const isActive = isPrimary || isSecondary;
        
        let styleClass = 'inset-0 w-full h-full';
        if (splitTabId) {
          if (isStacked) {
            if (isPrimary) {
              styleClass = `top-0 w-full h-1/2 border-b border-border ${focusedPane === 'primary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
            } else if (isSecondary) {
              styleClass = `bottom-0 w-full h-1/2 ${focusedPane === 'secondary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
            }
          } else {
            if (isPrimary) {
              styleClass = `left-0 w-1/2 h-full border-r border-border ${focusedPane === 'primary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
            } else if (isSecondary) {
              styleClass = `right-0 w-1/2 h-full ${focusedPane === 'secondary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
            }
          }
        }
        
        const handleClick = () => {
          if (isPrimary) setFocusedPane('primary');
          if (isSecondary) setFocusedPane('secondary');
        };

        const isNewTab = tab.url === 'browser://newtab';
        const isHistory = tab.url === 'browser://history';
        
        if (isNewTab) {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <Homepage />
            </div>
          );
        }
        
        if (isHistory) {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <HistoryPage />
            </div>
          );
        }

        if (tab.url === 'browser://bookmarks') {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <BookmarksPage />
            </div>
          );
        }

        if (tab.url === 'browser://readinglist') {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <ReadingListPage />
            </div>
          );
        }

        if (tab.url.startsWith('browser://reader')) {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <ReaderPage />
            </div>
          );
        }

        if (tab.url === 'browser://downloads') {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <DownloadsPage />
            </div>
          );
        }

        if (tab.url === 'browser://extensions') {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <ExtensionsPage />
            </div>
          );
        }

        if (tab.url === 'browser://settings') {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <SettingsPage />
            </div>
          );
        }

        return <TabWebview key={tab.id} tab={tab} isActive={isActive} styleClass={styleClass} onFocus={handleClick} />;
      })}
      
      {/* Invisible overlay during drag to prevent webviews from swallowing mouse events */}
      {isDraggingTab && (
        <div className="absolute inset-0 z-50 w-full h-full cursor-grabbing" />
      )}
    </div>
  );
}
