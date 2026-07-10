"use client";

import { useEffect, useRef, useState } from "react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';
import Homepage from "../homepage/Homepage";
import HistoryPage from "./HistoryPage";
import DownloadsPage from "./DownloadsPage";
import ExtensionsPage from "./ExtensionsPage";
import ExtensionStorePage from "./ExtensionStorePage";
import SettingsPage from "./SettingsPage";

function TabWebview({ tab, isActive, onFocus, styleClass }) {
  const webviewRef = useRef(null);
  const { updateTab, addToHistory, updateHistoryTitle, checkLoginState } = useBrowserStore(
    useShallow((state) => ({
      updateTab: state.updateTab,
      addToHistory: state.addToHistory,
      updateHistoryTitle: state.updateHistoryTitle,
      checkLoginState: state.checkLoginState,
    }))
  );
  
  // Track the internal URL to avoid reacting to our own navigation events
  const internalUrl = useRef(tab.url);
  // Only set the HTML src attribute once on mount
  const [initialUrl] = useState(tab.url);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleNavigate = (e) => {
      internalUrl.current = e.url;
      addToHistory(e.url);
      updateTab(tab.id, { 
        url: e.url,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        error: null // clear error on navigation
      });
    };

    const handleTitleUpdate = (e) => {
      updateTab(tab.id, { title: e.title });
      updateHistoryTitle(internalUrl.current, e.title);
    };
    const handleFaviconUpdate = (e) => {
      if (e.favicons && e.favicons.length > 0) {
        updateTab(tab.id, { favicon: e.favicons[0] });
      }
    };
    const handleStartLoading = () => updateTab(tab.id, { isLoading: true, error: null });
    const handleStopLoading = () => {
      updateTab(tab.id, { 
        isLoading: false,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward()
      });
      if (internalUrl.current && internalUrl.current.includes('google.com')) {
        checkLoginState();
      }
    };
    const handleFailLoad = (e) => {
      // Ignore abort errors (-3) as they are typically caused by navigating away
      // before the page finishes loading
      if (e.errorCode !== -3) {
        updateTab(tab.id, { isLoading: false, error: e.errorDescription });
      }
    };

    const handleMediaStarted = () => updateTab(tab.id, { isPlayingAudio: true });
    const handleMediaPaused = () => updateTab(tab.id, { isPlayingAudio: false });

    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    webview.addEventListener('page-title-updated', handleTitleUpdate);
    webview.addEventListener('page-favicon-updated', handleFaviconUpdate);
    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('did-stop-loading', handleStopLoading);
    webview.addEventListener('did-fail-load', handleFailLoad);
    webview.addEventListener('media-started-playing', handleMediaStarted);
    webview.addEventListener('media-paused', handleMediaPaused);
    
    // Apply mute state as soon as the webview is ready
    const handleDomReady = () => {
      try {
        if (webviewRef.current) {
          webviewRef.current.setAudioMuted(useBrowserStore.getState().tabs.find(t => t.id === tab.id)?.isMuted || false);
        }
      } catch (e) {
        console.error("Failed to set audio muted on dom-ready", e);
      }
    };
    webview.addEventListener('dom-ready', handleDomReady);

    // Prevent new windows from middle-clicking links, open as new tabs instead
    const handleNewWindow = (e) => {
      if (e.preventDefault) e.preventDefault();
      useBrowserStore.getState().addTab(e.url, 'New Tab', tab.id);
    };
    webview.addEventListener('new-window', handleNewWindow);

    return () => {
      webview.removeEventListener('did-navigate', handleNavigate);
      webview.removeEventListener('did-navigate-in-page', handleNavigate);
      webview.removeEventListener('page-title-updated', handleTitleUpdate);
      webview.removeEventListener('page-favicon-updated', handleFaviconUpdate);
      webview.removeEventListener('did-start-loading', handleStartLoading);
      webview.removeEventListener('did-stop-loading', handleStopLoading);
      webview.removeEventListener('did-fail-load', handleFailLoad);
      webview.removeEventListener('media-started-playing', handleMediaStarted);
      webview.removeEventListener('media-paused', handleMediaPaused);
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('new-window', handleNewWindow);
      if (onFocus) webview.removeEventListener('focus', onFocus);
    };
  }, [tab.id, updateTab, addToHistory, updateHistoryTitle, checkLoginState, onFocus]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview && onFocus) {
      webview.addEventListener('focus', onFocus);
    }
    return () => {
      if (webview && onFocus) webview.removeEventListener('focus', onFocus);
    };
  }, [onFocus]);

  useEffect(() => {
    if (webviewRef.current) {
      try {
        webviewRef.current.setAudioMuted(tab.isMuted);
      } catch (e) {
        // Ignored: webview might not be dom-ready yet, it will be handled by the dom-ready listener
      }
    }
  }, [tab.isMuted]);

  useEffect(() => {
    // If the URL was changed from the outside (e.g. address bar)
    if (tab.url !== internalUrl.current) {
      internalUrl.current = tab.url;
      const webview = webviewRef.current;
      if (webview) {
        try {
          if (typeof webview.loadURL === 'function') {
            webview.loadURL(tab.url);
          } else {
            webview.src = tab.url;
          }
        } catch (e) {
          // Fallback if loadURL fails (e.g. before dom-ready)
          webview.src = tab.url;
        }
      }
    }
  }, [tab.url]);

  useEffect(() => {
    if (!isActive || !window.electron?.onKeyboardShortcut) return;
    
    const cleanup = window.electron.onKeyboardShortcut((action) => {
      const webview = webviewRef.current;
      if (!webview) return;
      
      try {
        if (action === 'reload') {
          webview.reload();
        } else if (action === 'hard-reload') {
          webview.reloadIgnoringCache();
        }
      } catch (e) {
        console.error('Failed to reload webview:', e);
      }
    });
    
    return cleanup;
  }, [isActive]);


  return (
    <div className={`absolute ${styleClass ? styleClass : 'inset-0 w-full h-full'} ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
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
      <webview 
        ref={webviewRef}
        id={`webview-${tab.id}`}
        src={initialUrl} 
        className={`w-full h-full border-none outline-none bg-white ${tab.error ? 'opacity-0' : 'opacity-100'}`}
        allowpopups="true"
        partition="persist:main"
      />
    </div>
  );
}

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

        if (tab.url === 'browser://extensions/store') {
          return (
            <div 
              key={tab.id} 
              onClick={handleClick}
              className={`absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
            >
              <ExtensionStorePage />
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
