"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Shield, ShieldCheck, Download, Bookmark, Sparkles, Languages, Moon, Sun, X, Clock, Puzzle, MoreVertical, Settings, Plus, LogOut, Printer, Minus, Terminal, EyeOff, ZoomIn, User, BookOpen, Pipette, PictureInPicture2, Zap, Type, QrCode } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';
import clsx from "clsx";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import SuggestionsDropdown from "@/components/common/SuggestionsDropdown";
import PermissionPrompt from "./PermissionPrompt";
import SiteSettingsPopup from "./SiteSettingsPopup";
import VerseShieldPopup from "./VerseShieldPopup";
import HistoryPopup from "./HistoryPopup";
import DownloadsPopup from "./DownloadsPopup";
import ExtensionsPopup from "./ExtensionsPopup";
import BrowserMenu from "./BrowserMenu";
import ProfileMenu from "./ProfileMenu";
import ZoomPopup from "./ZoomPopup";
export default function NavigationBar() {
  const { toggleAISidebar, isAISidebarOpen, tabs, activeTabId, splitTabId, focusedPane, clearSplitView, navigate, openHistoryTab, bookmarks, toggleBookmark, openDownloadsTab, openExtensionsTab, openSettingsTab, theme, toggleTheme, addTab, setDropdownOffset, isIncognitoWindow, userProfilePic, currentUser, downloads, showHomeButton, installedExtensions, toggleExtension } = useBrowserStore(
    useShallow((state) => ({
      toggleAISidebar: state.toggleAISidebar,
      isAISidebarOpen: state.isAISidebarOpen,
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      splitTabId: state.splitTabId,
      openReaderMode: state.openReaderMode,
      readingList: state.readingList,
      addToReadingList: state.addToReadingList,
      removeFromReadingList: state.removeFromReadingList,
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
      installedExtensions: state.installedExtensions,
      toggleExtension: state.toggleExtension,
    }))
  );

  const activePaneTabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
  const activeTab = tabs.find(t => t.id === activePaneTabId);
  const zoomLevel = activeTab?.zoomLevel || 0;
  const zoomPercentage = Math.round(Math.pow(1.2, zoomLevel) * 100);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [showShieldPopup, setShowShieldPopup] = useState(false);
  const [shieldBlockedCount, setShieldBlockedCount] = useState(0);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showZoomPopup, setShowZoomPopup] = useState(false);
  const [showExtensionsPopup, setShowExtensionsPopup] = useState(false);
  const [downloadAnimate, setDownloadAnimate] = useState(false);
  const [copiedColor, setCopiedColor] = useState(null);
  const [pipMessage, setPipMessage] = useState(null);
  const [downloadJustFinished, setDownloadJustFinished] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('profileId') || 'main';
    }
    return 'main';
  });
  const prevCompletedCount = useRef(0);
  const { suggestions } = useSearchSuggestions(inputValue);
  const overflowMenuRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const downloadsRef = useRef(null);
  const profileRef = useRef(null);
  const zoomRef = useRef(null);
  const shieldRef = useRef(null);
  const extensionsRef = useRef(null);

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
      if (zoomRef.current && !zoomRef.current.contains(e.target)) {
        setShowZoomPopup(false);
      }
      if (shieldRef.current && !shieldRef.current.contains(e.target)) {
        setShowShieldPopup(false);
      }
      if (extensionsRef.current && !extensionsRef.current.contains(e.target)) {
        setShowExtensionsPopup(false);
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
    else if (showShieldPopup) offset = 380;
    else if (showProfileMenu) offset = 500;
    else if (showZoomPopup) offset = 200;
    else if (showExtensionsPopup) offset = 300;
    else if (isFocused && suggestions.length > 0) offset = Math.min(suggestions.length * 40 + 16, 250);

    setDropdownOffset(offset);
  }, [showHistoryPopup, showDownloadsPopup, showSiteSettings, showShieldPopup, showProfileMenu, showZoomPopup, showExtensionsPopup, isFocused, suggestions.length, setDropdownOffset]);

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

  const isColorPickerEnabled = installedExtensions?.some(e => e.id === 'ext-color-picker' && e.isEnabled);

  const handleColorPicker = async () => {
    if (!window.EyeDropper) {
      alert("Your system does not support the EyeDropper API");
      return;
    }
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      await navigator.clipboard.writeText(result.sRGBHex);
      setCopiedColor(result.sRGBHex);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (e) {
      console.log("EyeDropper cancelled or failed:", e);
    }
  };

  const handlePiP = async () => {
    if (!activePaneTabId || activePaneTabId.includes('browser://')) return;
    const code = `
      (async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            return "EXITED";
          }
          const video = document.querySelector('video');
          if (!video) {
            return "NO_VIDEO";
          }
          await video.requestPictureInPicture();
          return "SUCCESS";
        } catch(e) {
          console.error('PiP Error:', e);
          return "ERROR";
        }
      })();
    `;
    try {
      const result = await window.electron.tabManager.executeJavaScript({ tabId: activePaneTabId, code });
      if (result === "NO_VIDEO") {
        setPipMessage("No video found on page");
      } else if (result === "ERROR") {
        setPipMessage("Failed to enter PiP. Is video playing?");
      } else {
        return; // SUCCESS or EXITED
      }
      setTimeout(() => setPipMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };


  // --- Verse Shield: listen for live blocked-count updates ---
  useEffect(() => {
    if (!window.electron?.tabManager?.onAdBlockerStatUpdate) return;
    const cleanup = window.electron.tabManager.onAdBlockerStatUpdate((data) => {
      // Only update badge if it's for the currently active tab
      if (data.tabId === activePaneTabId && data.tab) {
        setShieldBlockedCount(data.tab.ads || 0);
      }
    });
    return cleanup;
  }, [activePaneTabId]);

  // Reset shield badge count when switching tabs
  useEffect(() => {
    const timer = setTimeout(() => {
      setShieldBlockedCount(0);
      setShowShieldPopup(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [activePaneTabId]);


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

  useEffect(() => {
    const handleFocusAddressBar = (e) => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (e.detail?.search) {
          setInputValue('? ');
          // Don't select, let the user type after "? "
        } else {
          inputRef.current.select();
        }
      }
    };
    window.addEventListener('focus-address-bar', handleFocusAddressBar);
    return () => window.removeEventListener('focus-address-bar', handleFocusAddressBar);
  }, []);

  const isBookmarked = activeTab && bookmarks.some(b => b.url === activeTab.url);
  const { readingList, addToReadingList, removeFromReadingList } = useBrowserStore();
  const isReadingListSaved = activeTab && (readingList || []).some(r => r.url === activeTab.url);
  const activeReadingListItem = activeTab && (readingList || []).find(r => r.url === activeTab.url);
  const { openReaderMode } = useBrowserStore();
  const canReadMode = activeTab && activeTab.url.startsWith('http') && !activeTab.url.startsWith('browser://reader');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      let targetUrl = inputValue.trim();

      // Ctrl+Enter autocomplete (add www. and .com)
      if ((e.ctrlKey || e.metaKey) && !targetUrl.includes('.') && !targetUrl.includes(' ') && !targetUrl.startsWith('verse://')) {
        targetUrl = `www.${targetUrl}.com`;
      }

      // Convert verse:// back to browser:// for internal routing
      if (targetUrl.startsWith('verse://')) {
        targetUrl = targetUrl.replace('verse://', 'browser://');
      }
      navigate(activePaneTabId, targetUrl);
      setIsFocused(false);
    }
  };

  const handleBack = () => {
    if (activeTab?.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[newIndex];
      useBrowserStore.getState().updateTab(activePaneTabId, {
        historyIndex: newIndex,
        url: targetUrl,
        title: targetUrl
      });
    }
  };

  const handleForward = () => {
    if (activeTab?.history && activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const targetUrl = activeTab.history[newIndex];
      useBrowserStore.getState().updateTab(activePaneTabId, {
        historyIndex: newIndex,
        url: targetUrl,
        title: targetUrl
      });
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

  const canGoBack = activeTab?.historyIndex > 0;
  const canGoForward = activeTab?.history && activeTab.historyIndex < activeTab.history.length - 1;

  const activeDownload = (downloads || []).find(d => d.state === 'progressing');
  const downloadProgress = activeDownload && activeDownload.totalBytes > 0
    ? (activeDownload.receivedBytes / activeDownload.totalBytes) * 100
    : 0;

  return (
    <>
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
      <div className="flex-1 relative mx-2" role="search">
        <div className="flex items-center h-10 bg-surface-hover hover:bg-surface-hover/80 rounded-full px-4 border border-transparent focus-within:border-accent focus-within:bg-background transition-colors shadow-sm">
          {(activeTab?.url === 'browser://newtab' || activeTab?.url === '') && (
            <FcGoogle size={18} className="mr-2 opacity-80 grayscale-20 hover:grayscale-0 transition-all" />
          ) }

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="Address and search bar"
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground placeholder-foreground/50 h-full w-full min-w-0"
            placeholder="Ask Google or type a URL"
          />
          {zoomPercentage !== 100 && (
            <div className="relative flex items-center ml-1" ref={zoomRef}>
              <button
                onClick={() => setShowZoomPopup(!showZoomPopup)}
                className="p-1 rounded-md transition-colors text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                title="Zoom: this page is zoomed"
                aria-label="Zoom controls"
                aria-haspopup="dialog"
                aria-expanded={showZoomPopup}
              >
                <ZoomIn size={16} />
              </button>
              {showZoomPopup && (
                <ZoomPopup
                  onClose={() => setShowZoomPopup(false)}
                  zoomPercentage={zoomPercentage}
                  activePaneTabId={activePaneTabId}
                />
              )}
            </div>
          )}

          {/* bookmark button */}
          <button
            onClick={() => toggleBookmark(activeTab?.url, activeTab?.title, activeTab?.favicon)}
            className={clsx(
              "p-1 rounded-md transition-colors ml-1",
              isBookmarked
                ? "text-yellow-400 fill-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            )}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this tab"}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this tab"}
          >
            <Star size={16} className={isBookmarked ? "fill-current" : ""} />
          </button>

          {/* readlsit btn */}
          <button
            onClick={() => {
              if (isReadingListSaved && activeReadingListItem) {
                removeFromReadingList(activeReadingListItem.id);
              } else if (activeTab) {
                addToReadingList(activeTab.url, activeTab.title);
              }
            }}
            className={clsx(
              "p-1 rounded-md transition-colors ml-1",
              isReadingListSaved
                ? "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            )}
            title={isReadingListSaved ? "Remove from Reading List" : "Add to Reading List"}
            aria-label={isReadingListSaved ? "Remove from Reading List" : "Add to Reading List"}
          >
            <Bookmark size={16} className={isReadingListSaved ? "fill-current" : ""} />
          </button>

          <div className="relative flex items-center" ref={shieldRef}>

            {canReadMode && (
              <button
                onClick={async () => {
                  let liveHtml = null;
                  try {
                    liveHtml = await window.electron.tabManager.executeJavaScript({
                      tabId: activePaneTabId,
                      code: 'document.documentElement.outerHTML'
                    });
                  } catch (e) {
                    console.error("Failed to get live HTML for reader mode:", e);
                  }
                  openReaderMode(activeTab.url, liveHtml);
                }}
                className="mr-2 text-foreground/50 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-blue-500/10"
                title="Enter Reader Mode"
                aria-label="Enter Reader Mode"
              >
                <BookOpen size={14} />
              </button>
            )}

            {(activeTab?.url === 'browser://newtab' || activeTab?.url === '') ? (
              <div></div>
              // <FcGoogle size={18} className="mr-2 opacity-80 grayscale-20 hover:grayscale-0 transition-all" />
            ) : (
              <>
                <span className="text-gray-500 me-1">|</span>
                <button
                  onClick={(e) => {
                    if (window.electron && window.electron.tabManager && window.electron.tabManager.openPopup) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const popupWidth = 360;
                      const popupHeight = 460;
                      const x = Math.round(window.screenX + rect.right - popupWidth);
                      const y = Math.round(window.screenY + rect.bottom + 8);
                      
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                      const urlParam = activeTab?.url ? `&url=${encodeURIComponent(activeTab.url)}` : '';
                      const popupUrl = `${baseUrl}/popup?type=shield&tabId=${activePaneTabId}${urlParam}`;

                      window.electron.tabManager.openPopup({
                        url: popupUrl,
                        width: popupWidth,
                        height: popupHeight,
                        x,
                        y
                      });
                    }
                  }}
                  className={clsx(
                    "relative mr-2 transition-colors p-1 rounded-full hover:bg-foreground/10",
                    showShieldPopup ? "text-emerald-400" : "text-foreground/50 hover:text-foreground"
                  )}
                  title="Verse Shield — Ad & Tracker Blocker"
                  aria-label="Verse Shield"
                  aria-haspopup="dialog"
                  aria-expanded={showShieldPopup}
                >
                  <Image src="/favicon.png" alt="Verse Shield" width={20} height={20} className="w-5 h-5" />
                  {shieldBlockedCount > 0 && !showShieldPopup && (
                    <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow-sm">
                      {shieldBlockedCount > 99 ? '99+' : shieldBlockedCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
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
              aria-haspopup="dialog"
              aria-expanded={showDownloadsPopup}
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
        
        {/* Render pinned extensions (only enabled + pinned) */}
        {installedExtensions?.filter(e => e.isPinned && e.isEnabled).map(ext => {
          if (ext.id === 'ext-color-picker') {
            return (
              <div key={ext.id} className="relative flex items-center justify-center">
                <button
                  onClick={handleColorPicker}
                  aria-label="Color Picker"
                  className="p-2 rounded-full hover:bg-foreground/10 hover:text-foreground transition-colors min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none text-blue-500"
                  title="Color Auto-Picker"
                >
                  <Pipette size={18} />
                </button>
                {copiedColor && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface text-foreground border border-border px-3 py-1.5 rounded shadow-lg text-xs font-medium whitespace-nowrap z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: copiedColor }}></div>
                    {copiedColor} copied!
                  </div>
                )}
              </div>
            );
          }
          if (ext.id === 'ext-pip') {
            return (
              <div key={ext.id} className="relative flex items-center justify-center">
                <button
                  onClick={handlePiP}
                  aria-label="Picture-in-Picture"
                  className="p-2 rounded-full hover:bg-foreground/10 hover:text-foreground transition-colors min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
                  title="Picture-in-Picture Video Pop-out"
                >
                  <PictureInPicture2 size={18} />
                </button>
                {pipMessage && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-3 py-1.5 rounded shadow-lg text-xs font-medium whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
                    {pipMessage}
                  </div>
                )}
              </div>
            );
          }

          if (ext.id === 'ext-verse-shield') {
            return null; // Shield has its own dedicated toolbar icon
          }
          return null; // Other extensions don't have toolbar actions yet
        })}

        <div className="relative flex items-center justify-center" ref={extensionsRef}>
          <button
            onClick={(e) => {
              if (window.electron && window.electron.tabManager && window.electron.tabManager.openPopup) {
                const rect = e.currentTarget.getBoundingClientRect();
                const popupWidth = 340;
                const extCount = (installedExtensions || []).length;
                const popupHeight = Math.min(520, 120 + extCount * 52);
                const x = Math.round(window.screenX + rect.right - popupWidth);
                const y = Math.round(window.screenY + rect.bottom + 8);
                
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const popupUrl = `${baseUrl}/popup?type=extensions&profileId=${currentProfileId}`;

                window.electron.tabManager.openPopup({
                  url: popupUrl,
                  width: popupWidth,
                  height: popupHeight,
                  x,
                  y
                });
              } else {
                setShowExtensionsPopup(!showExtensionsPopup);
              }
            }}
            aria-label="Extensions"
            aria-haspopup="dialog"
            aria-expanded={showExtensionsPopup}
            className={clsx(
              "p-2 rounded-full transition-colors hidden lg:flex min-w-10 min-h-10 items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
              showExtensionsPopup ? "bg-foreground/10 text-foreground" : "hover:bg-foreground/10 hover:text-foreground"
            )}
            title="Extensions"
          >
            <Puzzle size={18} />
          </button>
          {showExtensionsPopup && <ExtensionsPopup onClose={() => setShowExtensionsPopup(false)} />}
        </div>

        {/* User Account / Incognito */}
        <div className="relative flex items-center pl-1" ref={profileRef}>
          {isIncognitoWindow ? (
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-center space-x-1 px-3 py-1 mr-1 rounded-full bg-surface-hover border border-border text-foreground/70"
              aria-label="Incognito mode"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
            >
              <EyeOff size={16} />
              <span className="text-xs font-medium">Incognito</span>
            </button>
          ) : (
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-1 rounded-full hover:bg-foreground/10 transition-colors w-8 h-8 flex items-center justify-center shrink-0 focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Profile menu"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
            >
              {userProfilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
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


        {/* Browser Menu Button */}
        <BrowserMenu />
      </div>
    </div>
    </>
  );
}
