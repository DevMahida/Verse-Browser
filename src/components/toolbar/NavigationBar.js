"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Shield, Download, Bookmark, Sparkles, Languages, Moon, Sun, X, Clock, Puzzle, MoreVertical } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';
import clsx from "clsx";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import SuggestionsDropdown from "@/components/common/SuggestionsDropdown";
import PermissionPrompt from "./PermissionPrompt";
import SiteSettingsPopup from "./SiteSettingsPopup";

export default function NavigationBar() {
  const { toggleAISidebar, isAISidebarOpen, tabs, activeTabId, splitTabId, focusedPane, clearSplitView, navigate, openHistoryTab, bookmarks, toggleBookmark, openDownloadsTab, openExtensionsTab, theme, toggleTheme } = useBrowserStore(
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
      theme: state.theme,
      toggleTheme: state.toggleTheme,
    }))
  );
  
  const activePaneTabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
  const activeTab = tabs.find(t => t.id === activePaneTabId);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const { suggestions } = useSearchSuggestions(inputValue);
  const overflowMenuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target)) {
        setShowOverflowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const webview = document.getElementById(`webview-${activePaneTabId}`);
    if (webview && webview.canGoBack && webview.canGoBack()) {
      webview.goBack();
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

    const webview = document.getElementById(`webview-${activePaneTabId}`);
    if (webview && webview.canGoForward && webview.canGoForward()) {
      webview.goForward();
    }
  };

  const handleReloadOrStop = () => {
    const webview = document.getElementById(`webview-${activePaneTabId}`);
    if (!webview) return;
    if (activeTab?.isLoading && webview.stop) {
      webview.stop();
    } else if (webview.reload) {
      webview.reload();
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
            "p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
            canGoBack ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={handleForward} 
          aria-label="Go forward"
          className={clsx(
            "p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
            canGoForward ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowRight size={18} />
        </button>
        <button 
          onClick={handleReloadOrStop}
          aria-label={activeTab?.isLoading ? "Stop loading" : "Reload page"}
          className="p-2 rounded-lg transition-colors hover:bg-foreground/10 hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
        >
          {activeTab?.isLoading ? <X size={18} /> : <RotateCw size={18} />}
        </button>
        <button 
          onClick={handleHome}
          aria-label="Go home"
          className="p-2 rounded-lg transition-colors hover:bg-foreground/10 hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
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
        <button aria-label="Shield Security" className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none">
          <Shield size={18} />
        </button>
        <button 
          onClick={openDownloadsTab}
          aria-label="Downloads"
          className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          title="Downloads"
        >
          <Download size={18} />
        </button>
        <button 
          onClick={openHistoryTab}
          aria-label="History"
          className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          title="History"
        >
          <Clock size={18} />
        </button>
        <button 
          onClick={openExtensionsTab}
          aria-label="Extensions"
          className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          title="Extensions"
        >
          <Puzzle size={18} />
        </button>
        
        {/* Divider */}
        <div className="w-px h-4 bg-border mx-1" />

        {/* Split View Toggle / Close */}
        {splitTabId && (
          <button 
            onClick={clearSplitView}
            aria-label="Close Split View"
            className="p-2 rounded-lg transition-colors flex items-center justify-center bg-accent text-white hover:bg-accent-hover px-3 text-sm font-medium mr-2 min-h-[44px] focus-visible:ring-2 focus-visible:outline-none"
          >
            Close Split
          </button>
        )}

        <button 
          onClick={toggleAISidebar}
          aria-label="Toggle AI Sidebar"
          className={`p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] focus-visible:ring-2 focus-visible:outline-none ${isAISidebarOpen ? 'bg-accent/20 text-accent hover:bg-accent/30' : 'hover:bg-foreground/10 hover:text-foreground'}`}
        >
          <Sparkles size={18} />
        </button>
        
        <button aria-label="Languages" className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none">
          <Languages size={18} />
        </button>
        <button 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Overflow Menu Button */}
        <div className="relative flex lg:hidden">
          <button 
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            aria-label="More tools"
            className="p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          >
            <MoreVertical size={18} />
          </button>
          
          {showOverflowMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
              <button onClick={() => { openDownloadsTab(); setShowOverflowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center">
                <Download size={16} className="mr-3 text-foreground/70" /> Downloads
              </button>
              <button onClick={() => { openHistoryTab(); setShowOverflowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center">
                <Clock size={16} className="mr-3 text-foreground/70" /> History
              </button>
              <button onClick={() => { openExtensionsTab(); setShowOverflowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center">
                <Puzzle size={16} className="mr-3 text-foreground/70" /> Extensions
              </button>
              <div className="h-px bg-border my-1" />
              <button onClick={() => { toggleTheme(); setShowOverflowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center">
                {theme === 'dark' ? <Sun size={16} className="mr-3 text-foreground/70" /> : <Moon size={16} className="mr-3 text-foreground/70" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
