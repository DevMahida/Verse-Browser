"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Shield, Download, Bookmark, Sparkles, Languages, Moon, Sun, X, Clock, Puzzle, MoreVertical, Settings, Plus, LogOut, Printer, Minus, Terminal, EyeOff } from "lucide-react";
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
  const { toggleAISidebar, isAISidebarOpen, tabs, activeTabId, splitTabId, focusedPane, clearSplitView, navigate, openHistoryTab, bookmarks, toggleBookmark, openDownloadsTab, openExtensionsTab, openSettingsTab, theme, toggleTheme, addTab, setDropdownOffset, isIncognitoWindow, userProfilePic, currentUser } = useBrowserStore(
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
    }))
  );
  
  const activePaneTabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
  const activeTab = tabs.find(t => t.id === activePaneTabId);
  const zoomLevel = activeTab?.zoomLevel || 1.0;
  const zoomPercentage = Math.round(zoomLevel * 100);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { suggestions } = useSearchSuggestions(inputValue);
  const overflowMenuRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const downloadsRef = useRef(null);
  const profileRef = useRef(null);

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

  return (
    <div className="h-12 bg-surface border-b border-border flex items-center px-4 space-x-4 select-none">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1 text-foreground/70 relative">
        <PermissionPrompt />
        <button 
          onClick={handleBack} 
          aria-label="Go back"
          className={clsx(
            "p-2 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
            canGoBack ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={handleForward} 
          aria-label="Go forward"
          className={clsx(
            "p-2 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
            canGoForward ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowRight size={18} />
        </button>
        <button 
          onClick={handleReloadOrStop}
          aria-label={activeTab?.isLoading ? "Stop loading" : "Reload page"}
          className="p-2 rounded-lg transition-colors hover:bg-foreground/10 hover:text-foreground min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
        >
          {activeTab?.isLoading ? <X size={18} /> : <RotateCw size={18} />}
        </button>
        <button 
          onClick={handleHome}
          aria-label="Go home"
          className="p-2 rounded-lg transition-colors hover:bg-foreground/10 hover:text-foreground min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
        >
          <Home size={18} />
        </button>
      </div>

      {/* URL / Search Bar */}
      <div className="flex-1 relative">
        <div className="flex items-center h-8 bg-background rounded-full px-3 border border-border focus-within:border-accent transition-colors">
          <div className="relative">
            <button 
              onClick={() => setShowSiteSettings(!showSiteSettings)}
              className="mr-2 text-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-foreground/10"
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
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder-gray-500 h-full"
            placeholder="Search Google or type a URL"
          />
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
      <div className="flex items-center space-x-1 text-foreground/70" ref={overflowMenuRef}>
        <div className="relative hidden lg:flex" ref={downloadsRef}>
          <button 
            onClick={() => setShowDownloadsPopup(!showDownloadsPopup)}
            aria-label="Downloads"
            className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
            title="Downloads"
          >
            <Download size={18} />
          </button>
          {showDownloadsPopup && <DownloadsPopup onClose={() => setShowDownloadsPopup(false)} />}
        </div>
        <div className="relative hidden lg:flex" ref={historyRef}>
          <button 
            onClick={() => setShowHistoryPopup(!showHistoryPopup)}
            aria-label="History"
            className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
            title="History"
          >
            <Clock size={18} />
          </button>
          {showHistoryPopup && <HistoryPopup onClose={() => setShowHistoryPopup(false)} />}
        </div>
        <button 
          onClick={openExtensionsTab}
          aria-label="Extensions"
          className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-11 min-h-11 items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          title="Extensions"
        >
          <Puzzle size={18} />
        </button>

        {/* User Account / Incognito */}
        <div className="relative flex items-center" ref={profileRef}>
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
              ) : (
                <div className="w-full h-full rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
              )}
            </button>
          )}
          {showProfileMenu && <ProfileMenu onClose={() => setShowProfileMenu(false)} />}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-border mx-1" />

        {/* Split View Toggle / Close */}
        {splitTabId && (
          <button 
            onClick={clearSplitView}
            aria-label="Close Split View"
            className="p-2 rounded-lg transition-colors flex items-center justify-center bg-accent text-white hover:bg-accent-hover px-3 text-sm font-medium mr-2 min-h-11 focus-visible:ring-2 focus-visible:outline-none"
          >
            Close Split
          </button>
        )}

        <button 
          onClick={toggleAISidebar}
          aria-label="Toggle AI Sidebar"
          className={`p-2 rounded-lg transition-colors flex items-center justify-center min-w-11 min-h-11 focus-visible:ring-2 focus-visible:outline-none ${isAISidebarOpen ? 'bg-accent/20 text-accent hover:bg-accent/30' : 'hover:bg-foreground/10 hover:text-foreground'}`}
        >
          <Sparkles size={18} />
        </button>
        <button 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-11 min-h-11 items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
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
