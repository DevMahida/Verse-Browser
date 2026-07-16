"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Shield, Download, Bookmark, Sparkles, Languages, Moon, Sun, X, Clock, Puzzle, MoreVertical, Settings, Plus, LogOut, Printer, Minus, Terminal, EyeOff, ZoomIn } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';
import clsx from "clsx";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import SuggestionsDropdown from "@/components/common/SuggestionsDropdown";
import PermissionPrompt from "./PermissionPrompt";
import SiteSettingsPopup from "./SiteSettingsPopup";
import HistoryPopup from "./HistoryPopup";
import DownloadsPopup from "./DownloadsPopup";
import BrowserMenu from "./BrowserMenu";
import ProfileMenu from "./ProfileMenu";

export default function NavigationBar() {
    const { toggleAISidebar, isAISidebarOpen, tabs, activeTabId, splitTabId, focusedPane, clearSplitView, navigate, openHistoryTab, bookmarks, toggleBookmark, openDownloadsTab, openExtensionsTab, openSettingsTab, theme, toggleTheme, addTab, setDropdownOffset, isIncognitoWindow, userProfilePic, currentUser, downloads, showHomeButton } = useBrowserStore(
      useShallow((state) => ({
        toggleAISidebar: state.toggleAISidebar,
        isAISidebarOpen: state.isAISidebarOpen,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        splitTabId: state.splitTabId,
      focusedPane: state.focusedPane,
      clearSplitView: state.clearSplitView,
      navigate: state.navigate,
      openHistoryTab: state.openHistoryTab,
      bookmarks: state.bookmarks,
      toggleBookmark: state.toggleBookmark,
      openDownloadsTab: state.openDownloadsTab,
      openExtensionsTab: state.openExtensionsTab,
      openSettingsTab: state.openSettingsTab,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      addTab: state.addTab,
      setDropdownOffset: state.setDropdownOffset,
      isIncognitoWindow: state.isIncognitoWindow,
      userProfilePic: state.userProfilePic,
      currentUser: state.currentUser,
      downloads: state.downloads,
      showHomeButton: state.showHomeButton,
    }))
  );
  
  const activePaneTabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
  const activeTab = tabs.find(t => t.id === activePaneTabId);
  const zoomLevel = activeTab?.zoomLevel || 0;
  const zoomPercentage = Math.round(Math.pow(1.2, zoomLevel) * 100);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [downloadAnimate, setDownloadAnimate] = useState(false);
  const [downloadJustFinished, setDownloadJustFinished] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState('main');
  const prevCompletedCount = useRef(0);
  const { suggestions } = useSearchSuggestions(inputValue);
  const overflowMenuRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const downloadsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentProfileId(params.get('profileId') || 'main');
    }
  }, []);

  useEffect(() => {
    if (window.electron && window.electron.getProfiles) {
      window.electron.getProfiles().then(setProfiles).catch(console.error);
      
      // Also poll for profile updates periodically in case we updated the name/email via Google Login
      const interval = setInterval(() => {
        window.electron.getProfiles().then(setProfiles).catch(console.error);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistoryPopup(false);
      }
      if (downloadsRef.current && !downloadsRef.current.contains(e.target)) {
        setShowDownloadsPopup(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let offset = 0;
    if (showHistoryPopup) offset = 420;
    else if (showDownloadsPopup) offset = 420;
    else if (showSiteSettings) offset = 250;
    else if (isFocused && suggestions.length > 0) offset = Math.min(suggestions.length * 40 + 16, 250);
    
    setDropdownOffset(offset);
  }, [showHistoryPopup, showDownloadsPopup, showSiteSettings, isFocused, suggestions.length, setDropdownOffset]);

  useEffect(() => {
    if (!downloads) return;
    
    const completedCount = downloads.filter(d => d.state === 'completed').length;
    if (completedCount > prevCompletedCount.current) {
      // A new download finished
      setDownloadAnimate(true);
      setShowDownloadsPopup(true);
      setDownloadJustFinished(true);
      
      const hideTimer = setTimeout(() => {
        setShowDownloadsPopup(false);
        setDownloadJustFinished(false);
      }, 3000);
      
      const animTimer = setTimeout(() => setDownloadAnimate(false), 300);
      
      prevCompletedCount.current = completedCount;
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(animTimer);
      };
    }
    
    prevCompletedCount.current = completedCount;
  }, [downloads]);

  const hasActiveDownloads = (downloads || []).some(d => d.state === 'progressing');
  const showDownloadBtn = hasActiveDownloads || downloadJustFinished || showDownloadsPopup;


  useEffect(() => {
    if (activeTab) {
      const isNewTab = activeTab.url === 'browser://newtab';
      // Visually display verse:// instead of browser://
      const displayUrl = activeTab.url.replace('browser://', 'verse://');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(isNewTab ? '' : displayUrl);
      
      if (isNewTab && inputRef.current) {
        // Use a small timeout to ensure the tab switch and render are complete
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 10);
      }
    }
  }, [activeTab]);

  const isBookmarked = activeTab && bookmarks.some(b => b.url === activeTab.url);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      let targetUrl = inputValue.trim();
      // Convert verse:// back to browser:// for internal routing
      if (targetUrl.startsWith('verse://')) {
        targetUrl = targetUrl.replace('verse://', 'browser://');
      }
      navigate(activePaneTabId, targetUrl);
      setIsFocused(false);
    }
  };

  const handleBack = () => {
    if (activeTab?.canGoBack) {
      if (window.electron?.tabManager) {
        window.electron.tabManager.action({ tabId: activePaneTabId, action: 'goBack' });
      }
    } else if (activeTab?.url !== 'browser://newtab') {
      // Save current URL so we can go "forward" back to it later
      useBrowserStore.getState().updateTab(activePaneTabId, { fallbackForwardUrl: activeTab?.url });
      navigate(activePaneTabId, 'browser://newtab');
    }
  };

  const handleForward = () => {
    // If we are on the new tab page and have a fallback forward URL, restore it!
    if (activeTab?.url === 'browser://newtab' && activeTab?.fallbackForwardUrl) {
      navigate(activePaneTabId, activeTab.fallbackForwardUrl);
      useBrowserStore.getState().updateTab(activePaneTabId, { fallbackForwardUrl: null });
      return;
    }

    if (activeTab?.canGoForward && window.electron?.tabManager) {
      window.electron.tabManager.action({ tabId: activePaneTabId, action: 'goForward' });
    }
  };

  const handleReloadOrStop = () => {
    if (!window.electron?.tabManager) return;
    
    if (activeTab?.isLoading) {
      window.electron.tabManager.action({ tabId: activePaneTabId, action: 'stop' });
    } else {
      window.electron.tabManager.action({ tabId: activePaneTabId, action: 'reload' });
    }
  };

  const handleHome = () => {
    navigate(activePaneTabId, 'browser://newtab');
  };

  const canGoBack = activeTab?.canGoBack || activeTab?.url !== 'browser://newtab';
  const canGoForward = activeTab?.canGoForward || (activeTab?.url === 'browser://newtab' && !!activeTab?.fallbackForwardUrl);

  const activeDownload = (downloads || []).find(d => d.state === 'progressing');
  const downloadProgress = activeDownload && activeDownload.totalBytes > 0 
    ? (activeDownload.receivedBytes / activeDownload.totalBytes) * 100 
    : 0;

  return (
    <div className="h-12 bg-surface border-b border-border flex items-center px-4 space-x-4 select-none">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1 text-foreground/70 relative">
        <PermissionPrompt />
        <button 
          onClick={handleBack} 
          aria-label="Go back"
          className={clsx(
            "p-2 rounded-full transition-colors min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none mx-0.5",
            canGoBack ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={handleForward} 
          aria-label="Go forward"
          className={clsx(
            "p-2 rounded-full transition-colors min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none mx-0.5",
            canGoForward ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowRight size={18} />
        </button>
        <button 
          onClick={handleReloadOrStop}
          aria-label={activeTab?.isLoading ? "Stop loading" : "Reload page"}
          className="p-2 rounded-full transition-colors hover:bg-foreground/10 hover:text-foreground min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none mx-0.5"
        >
          {activeTab?.isLoading ? <X size={18} /> : <RotateCw size={18} />}
        </button>
        {showHomeButton && (
          <button 
            onClick={handleHome}
            aria-label="Go home"
            className="p-2 rounded-full transition-colors hover:bg-foreground/10 hover:text-foreground min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none mx-0.5"
          >
            <Home size={18} />
          </button>
        )}
      </div>

      {/* URL / Search Bar */}
      <div className="flex-1 relative mx-2">
        <div className="flex items-center h-10 bg-surface-hover hover:bg-surface-hover/80 rounded-full px-4 border border-transparent focus-within:border-accent focus-within:bg-background transition-colors shadow-sm">
          <div className="relative flex items-center">
            <FcGoogle size={18} className="mr-2 opacity-80 grayscale-[20%] hover:grayscale-0 transition-all" />
            <button 
              onClick={() => setShowSiteSettings(!showSiteSettings)}
              className="mr-2 text-foreground/50 hover:text-foreground transition-colors p-1 rounded-full hover:bg-foreground/10"
              title="Site settings"
            >
              <Shield size={14} />
            </button>
            {showSiteSettings && (
              <SiteSettingsPopup 
                url={activeTab?.url} 
                onClose={() => setShowSiteSettings(false)} 
              />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground placeholder-foreground/50 h-full w-full min-w-0"
            placeholder="Ask Google or type a URL"
          />
          {zoomPercentage !== 100 && (
            <div className="flex items-center ml-1 bg-foreground/5 rounded-md border border-border/50 h-6">
              <button 
                onClick={() => window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'zoom-out' })}
                className="px-1.5 h-full text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-l-md transition-colors flex items-center justify-center"
                title="Zoom Out"
              >
                <Minus size={12} />
              </button>
              <button 
                onClick={() => window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'zoom-reset' })}
                className="px-2 h-full text-[11px] font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors flex items-center justify-center min-w-[36px]"
                title="Reset zoom"
              >
                {zoomPercentage}%
              </button>
              <button 
                onClick={() => window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action: 'zoom-in' })}
                className="px-1.5 h-full text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-r-md transition-colors flex items-center justify-center"
                title="Zoom In"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
          <button 
            onClick={() => toggleBookmark(activeTab?.url, activeTab?.title, activeTab?.favicon)}
            className={clsx(
              "p-1 rounded-md transition-colors ml-1",
              isBookmarked 
                ? "text-yellow-400 fill-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20" 
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            )}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this tab"}
          >
            <Star size={16} className={isBookmarked ? "fill-current" : ""} />
          </button>
        </div>
        {isFocused && suggestions.length > 0 && (
          <SuggestionsDropdown
            suggestions={suggestions}
            onSelect={(suggestion) => {
              setInputValue(suggestion);
              navigate(activeTabId, suggestion);
              setIsFocused(false);
            }}
            className="top-full mt-2 left-0 w-full"
          />
        )}
      </div>

      {/* Extensions & Tools */}
      <div className="flex items-center space-x-0.5 text-foreground/70" ref={overflowMenuRef}>
        {showDownloadBtn && (
          <div className="relative hidden lg:flex" ref={downloadsRef}>
            <button 
              onClick={() => setShowDownloadsPopup(!showDownloadsPopup)}
              aria-label="Downloads"
              className={clsx(
                "relative p-2 rounded-full hover:bg-foreground/10 hover:text-foreground transition-colors min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                downloadAnimate && "animate-in zoom-in-90 duration-200"
              )}
              title="Downloads"
            >
              {activeDownload && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="16" fill="none" className="stroke-foreground/10" strokeWidth="2.5" />
                  <circle 
                    cx="22" cy="22" r="16" 
                    fill="none" 
                    className="stroke-accent transition-all duration-300 ease-out" 
                    strokeWidth="2.5" 
                    strokeDasharray={100.5} 
                    strokeDashoffset={100.5 - (downloadProgress / 100) * 100.5}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <Download size={18} className={activeDownload ? "text-accent" : ""} />
            </button>
            {showDownloadsPopup && <DownloadsPopup onClose={() => setShowDownloadsPopup(false)} />}
          </div>
        )}
        <button 
          disabled
          aria-label="Extensions"
          className="p-2 rounded-full transition-colors hidden lg:flex min-w-10 min-h-10 items-center justify-center focus-visible:ring-2 focus-visible:outline-none opacity-50 cursor-not-allowed"
          title="Extensions (Coming Soon)"
        >
          <Puzzle size={18} />
        </button>

        {/* User Account / Incognito */}
        <div className="relative flex items-center pl-1" ref={profileRef}>
          {isIncognitoWindow ? (
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-center space-x-1 px-3 py-1 mr-1 rounded-full bg-surface-hover border border-border text-foreground/70"
            >
              <EyeOff size={16} />
              <span className="text-xs font-medium">Incognito</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-1 rounded-full hover:bg-foreground/10 transition-colors w-8 h-8 flex items-center justify-center shrink-0 focus-visible:ring-2 focus-visible:outline-none"
            >
              {userProfilePic ? (
                <img src={userProfilePic} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : currentProfileId !== 'guest' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profiles.find(p => p.id === currentProfileId)?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=main"} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border border-border/50 bg-background"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <User size={16} />
                </div>
              )}
            </button>
          )}
          {showProfileMenu && <ProfileMenu onClose={() => setShowProfileMenu(false)} />}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Split View Toggle / Close */}
        {splitTabId && (
          <button 
            onClick={clearSplitView}
            aria-label="Close Split View"
            className="p-2 rounded-full transition-colors flex items-center justify-center bg-accent text-white hover:bg-accent-hover px-3 text-sm font-medium mr-1 min-h-10 focus-visible:ring-2 focus-visible:outline-none"
          >
            Close Split
          </button>
        )}

        <button 
          onClick={toggleAISidebar}
          aria-label="Toggle AI Sidebar"
          className={`p-2 rounded-full transition-colors flex items-center justify-center min-w-10 min-h-10 focus-visible:ring-2 focus-visible:outline-none ${isAISidebarOpen ? 'bg-accent/20 text-accent hover:bg-accent/30' : 'hover:bg-foreground/10 hover:text-foreground'}`}
        >
          <Sparkles size={18} />
        </button>
        <button 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-full hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-10 min-h-10 items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Browser Menu Button */}
        <BrowserMenu />
      </div>
    </div>
  );
}
