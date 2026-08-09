import { useState, useRef, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { useShallow } from 'zustand/react/shallow';
import clsx from 'clsx';
import { QRCodeSVG } from 'qrcode.react';
import {
  MoreVertical, Plus, AppWindow, EyeOff, Key, CreditCard, MapPin,
  Clock, Download, Bookmark, ZoomIn, ZoomOut, Maximize, Printer,
  Cast, Save, Share, QrCode, Search, Scissors, Copy, Clipboard,
  Puzzle, Activity, List, Trash2, Terminal, SquareTerminal, Settings,
  HelpCircle, LogOut, ChevronRight, ChevronLeft, Moon, Sun, MonitorSmartphone, Minus
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, onClick, hasSubmenu, shortcut, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "w-full text-left px-4 py-1.5 text-sm flex items-center justify-between group transition-colors",
      disabled ? "opacity-50 cursor-not-allowed text-foreground/50" : "text-foreground hover:bg-foreground/10"
    )}
  >
    <div className="flex items-center min-w-0 flex-1">
      {Icon && <Icon size={16} className={clsx("mr-3 shrink-0", disabled ? "text-foreground/30" : "text-foreground/70 group-hover:text-foreground/90")} />}
      <span className="truncate">{label}</span>
    </div>
    <div className="flex items-center space-x-2">
      {shortcut && <span className="text-xs text-foreground/50">{shortcut}</span>}
      {hasSubmenu && <ChevronRight size={14} className="text-foreground/50" />}
    </div>
  </button>
);

const MenuDivider = () => <div className="h-px bg-border my-1.5" />;

export default function BrowserMenu({ isStandalone }) {
  const { 
    tabs, activeTabId, splitTabId, focusedPane, 
    addTab, openHistoryTab, openDownloadsTab, openExtensionsTab, openSettingsTab, openBookmarksTab,
    theme, toggleTheme,
    bookmarks, toggleBookmark, bookmarkBarVisibility, setBookmarkBarVisibility,
    recentlyClosedTabs, history
  } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      splitTabId: state.splitTabId,
      focusedPane: state.focusedPane,
      addTab: state.addTab,
      openHistoryTab: state.openHistoryTab,
      openDownloadsTab: state.openDownloadsTab,
      openExtensionsTab: state.openExtensionsTab,
      openSettingsTab: state.openSettingsTab,
      openBookmarksTab: state.openBookmarksTab,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      bookmarks: state.bookmarks,
      toggleBookmark: state.toggleBookmark,
      bookmarkBarVisibility: state.bookmarkBarVisibility,
      setBookmarkBarVisibility: state.setBookmarkBarVisibility,
      recentlyClosedTabs: state.recentlyClosedTabs,
      history: state.history,
    }))
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('main'); // main, passwords, history, bookmarks, share, find, tools, help
  const [now, setNow] = useState(() => Date.now());
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  
  const menuRef = useRef(null);

  const activePaneTabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
  const activeTab = tabs.find(t => t.id === activePaneTabId);
  const zoomLevel = activeTab?.zoomLevel || 0;
  const zoomPercentage = Math.round(Math.pow(1.2, zoomLevel) * 100);

  useEffect(() => {
    if (!isOpen && !isStandalone) return;
    
    const handleClickOutside = (e) => {
      if (!isStandalone && menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setTimeout(() => setActiveMenu('main'), 200);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    // Update 'now' every minute for relative timestamps
    const interval = setInterval(() => setNow(Date.now()), 60000);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, [isOpen, isStandalone]);

  useEffect(() => {
    if (isStandalone && menuRef.current && window.electron?.tabManager?.resizePopup) {
      setTimeout(() => {
        if (menuRef.current) {
          const height = menuRef.current.offsetHeight;
          const width = window.innerWidth;
          window.electron.tabManager.resizePopup({ width, height });
        }
      }, 0);
    }
  }, [isStandalone, activeMenu]);

  const handleAction = (action, close = true) => {
    window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action });
    
    if (close) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (isStandalone) {
      if (window.electron?.tabManager?.closePopup) {
        window.electron.tabManager.closePopup();
      }
    } else {
      setIsOpen(false);
      setTimeout(() => setActiveMenu('main'), 200);
    }
  };

  const renderMainMenu = () => (
    <>
      <MenuItem icon={Plus} label="New tab" shortcut="Ctrl+T" onClick={() => { addTab(); handleClose(); }} />
      <MenuItem icon={AppWindow} label="New window" shortcut="Ctrl+N" onClick={() => { window.electron?.newWindow?.(); handleClose(); }} />
      <MenuItem icon={EyeOff} label="New Incognito window" shortcut="Ctrl+Shift+N" onClick={() => { window.electron?.newIncognitoWindow?.(); handleClose(); }} />
      
      <MenuDivider />
      
      <MenuItem icon={Key} label="Passwords and autofill" hasSubmenu onClick={() => setActiveMenu('passwords')} />
      
      <MenuDivider />
      
      <MenuItem icon={Clock} label="History" hasSubmenu onClick={() => setActiveMenu('history')} />
      <MenuItem icon={Download} label="Downloads" shortcut="Ctrl+J" onClick={() => { openDownloadsTab(); handleClose(); }} />
      <MenuItem icon={Bookmark} label="Bookmarks and lists" hasSubmenu onClick={() => setActiveMenu('bookmarks')} />
      
      <MenuDivider />
      
      {/* Zoom Controls inline */}
      <div className="px-4 py-1.5 flex items-center justify-between text-sm text-foreground">
        <span className="text-foreground/70 flex items-center"><ZoomIn size={16} className="mr-3" /> Zoom</span>
        <div className="flex items-center space-x-1 border border-border rounded-md bg-surface-hover">
          <button 
            onClick={() => handleAction('zoom-out', false)}
            className="p-1 hover:bg-foreground/10 rounded-l-md transition-colors"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={() => handleAction('zoom-reset', false)}
            className="px-2 py-1 text-xs font-medium hover:bg-foreground/10 min-w-14 text-center transition-colors"
          >
            {zoomPercentage}%
          </button>
          <button 
            onClick={() => handleAction('zoom-in', false)}
            className="p-1 hover:bg-foreground/10 transition-colors"
          >
            <Plus size={14} />
          </button>
          <button 
            onClick={() => { window.electron?.toggleFullscreen?.(); handleClose(); }}
            className="p-1 hover:bg-foreground/10 rounded-r-md transition-colors border-l border-border pl-2 ml-1"
            title="Fullscreen"
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>
      <MenuItem icon={Printer} label="Print..." shortcut="Ctrl+P" onClick={() => handleAction('print')} />
      <MenuItem icon={Cast} label="Cast, save, and share" hasSubmenu onClick={() => setActiveMenu('share')} />
      <MenuItem icon={Search} label="Find and edit" hasSubmenu onClick={() => setActiveMenu('find')} />
      
      <MenuDivider />
      
      <MenuItem icon={Puzzle} label="More tools" hasSubmenu onClick={() => setActiveMenu('tools')} />
      
      <MenuDivider />
      
      <MenuItem icon={Settings} label="Settings" onClick={() => { openSettingsTab(); handleClose(); }} />
      <MenuItem icon={HelpCircle} label="Help" hasSubmenu onClick={() => setActiveMenu('help')} />
      <MenuItem icon={LogOut} label="Exit" onClick={() => window.electron?.close?.()} />
    </>
  );

  const SubmenuHeader = ({ title }) => (
    <div className="flex items-center px-2 py-2 border-b border-border mb-1">
      <button 
        onClick={() => setActiveMenu('main')}
        className="p-1 hover:bg-foreground/10 rounded-full mr-2 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );

  const renderPasswordsMenu = () => (
    <>
      <SubmenuHeader title="Passwords and autofill" />
      <MenuItem icon={Key} label="Google Password Manager" onClick={() => { addTab('https://passwords.google.com'); handleClose(); }} />
      <MenuItem icon={CreditCard} label="Payment methods" onClick={() => { addTab('https://pay.google.com/gp/w/home/settings'); handleClose(); }} />
      <MenuItem icon={MapPin} label="Addresses and more" disabled />
    </>
  );

  const formatTimeAgo = (timestamp) => {
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderHistoryMenu = () => (
    <>
      <SubmenuHeader title="History" />
      <MenuItem icon={Clock} label="History page" shortcut="Ctrl+H" onClick={() => { openHistoryTab(); handleClose(); }} />
      <MenuDivider />
      <div className="px-4 py-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Recently closed</div>
      {recentlyClosedTabs && recentlyClosedTabs.length > 0 ? (
        recentlyClosedTabs.slice(0, 5).map((item, idx) => (
          <MenuItem 
            key={idx}
            label={
              <div className="flex items-center min-w-0">
                {item.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.favicon} alt="" className="w-4 h-4 rounded-sm mr-2 shrink-0 bg-foreground/10" />
                ) : (
                  <div className="w-4 h-4 rounded-sm mr-2 shrink-0 bg-foreground/10" />
                )}
                <span className="truncate flex-1">{item.title || item.url}</span>
              </div>
            }
            shortcut={formatTimeAgo(item.closedAt)}
            onClick={() => { addTab(item.url, item.title); handleClose(); }}
          />
        ))
      ) : (
        <MenuItem label="No recently closed tabs" disabled />
      )}
      <MenuDivider />
      <div className="px-4 py-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Recent history</div>
      {history && history.length > 0 ? (
        history.slice(0, 5).map((item, idx) => (
          <MenuItem 
            key={`hist-${idx}`}
            label={
              <div className="flex items-center min-w-0">
                {item.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.favicon} alt="" className="w-4 h-4 rounded-sm mr-2 shrink-0 bg-foreground/10" />
                ) : (
                  <div className="w-4 h-4 rounded-sm mr-2 shrink-0 bg-foreground/10" />
                )}
                <span className="truncate flex-1">{item.title || item.url}</span>
              </div>
            }
            shortcut={formatTimeAgo(item.visit_time || item.timestamp)}
            onClick={() => { addTab(item.url); handleClose(); }}
          />
        ))
      ) : (
        <MenuItem label="No recent history" disabled />
      )}
      <MenuDivider />
      <MenuItem icon={MonitorSmartphone} label="Tabs from other devices" disabled />
    </>
  );

  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false;

  const renderBookmarksMenu = () => (
    <>
      <SubmenuHeader title="Bookmarks and lists" />
      <MenuItem 
        icon={Bookmark} 
        label={isBookmarked ? "Edit bookmark for this tab" : "Bookmark this tab"} 
        shortcut="Ctrl+D" 
        onClick={() => {
          if (activeTab) {
            toggleBookmark(activeTab.url, activeTab.title, activeTab.favicon);
          }
          handleClose();
        }} 
      />
      <MenuItem icon={List} label="Bookmark manager" shortcut="Ctrl+Shift+O" onClick={() => { openBookmarksTab(); handleClose(); }} />
      <MenuItem icon={Bookmark} label="Reading list" onClick={() => { useBrowserStore.getState().openReadingListTab(); handleClose(); }} />
      <MenuDivider />
      <MenuItem 
        label={bookmarkBarVisibility === 'always' ? "Hide bookmarks bar" : "Show bookmarks bar"} 
        shortcut="Ctrl+Shift+B" 
        onClick={() => {
          setBookmarkBarVisibility(bookmarkBarVisibility === 'always' ? 'never' : 'always');
          handleClose();
        }}
      />
      <MenuItem label="Import bookmarks and settings" disabled />
    </>
  );

  const renderShareMenu = () => (
    <>
      <SubmenuHeader title="Cast, save, and share" />
      <MenuItem icon={Cast} label="Cast..." disabled />
      <MenuItem icon={Save} label="Save page as..." shortcut="Ctrl+S" onClick={() => handleAction('save-page')} />
      <MenuItem icon={MonitorSmartphone} label="Send to your devices" disabled />
      <MenuItem icon={QrCode} label="Create QR code for this page" onClick={() => {
        if (activeTab) setQrCodeUrl(activeTab.url);
      }} />
    </>
  );

  const renderFindMenu = () => (
    <>
      <SubmenuHeader title="Find and edit" />
      <MenuItem icon={Search} label="Find in page" shortcut="Ctrl+F" onClick={() => {
        useBrowserStore.getState().updateFindState(activePaneTabId, { isVisible: true });
        handleClose();
      }} />
      <MenuDivider />
      <MenuItem icon={Scissors} label="Cut" shortcut="Ctrl+X" onClick={() => handleAction('cut')} />
      <MenuItem icon={Copy} label="Copy" shortcut="Ctrl+C" onClick={() => handleAction('copy')} />
      <MenuItem icon={Clipboard} label="Paste" shortcut="Ctrl+V" onClick={() => handleAction('paste')} />
    </>
  );

  const renderToolsMenu = () => (
    <>
      <SubmenuHeader title="More tools" />
      <MenuItem icon={Puzzle} label="Extensions" onClick={() => { openExtensionsTab(); handleClose(); }} />
      <MenuItem icon={Activity} label="Performance" disabled />
      <MenuItem icon={List} label="Task manager" disabled />
      <MenuItem icon={Trash2} label="Clear browsing data" shortcut="Ctrl+Shift+Del" onClick={() => {
        if (window.electron?.sessionManager) {
          window.electron.sessionManager.clearBrowsingData();
        }
        handleClose();
      }} />
      <MenuItem icon={Terminal} label="Developer tools" shortcut="Ctrl+Shift+I" onClick={() => handleAction('toggle-devtools')} />
      <MenuDivider />
      <MenuItem icon={SquareTerminal} label="Create shortcut..." disabled />
      <MenuItem label="Name window..." disabled />
    </>
  );

  const renderHelpMenu = () => (
    <>
      <SubmenuHeader title="Help" />
      <MenuItem icon={HelpCircle} label="Help Center" disabled />
      <MenuItem label="Report an issue" disabled />
      <MenuDivider />
      <MenuItem label="About Verse" disabled />
    </>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'passwords': return renderPasswordsMenu();
      case 'history': return renderHistoryMenu();
      case 'bookmarks': return renderBookmarksMenu();
      case 'share': return renderShareMenu();
      case 'find': return renderFindMenu();
      case 'tools': return renderToolsMenu();
      case 'help': return renderHelpMenu();
      default: return renderMainMenu();
    }
  };

  if (isStandalone) {
    return (
      <div className="w-full h-fit bg-surface flex flex-col text-sm text-foreground/90 overflow-hidden rounded-b-xl" ref={menuRef}>
        <div className="flex-1 overflow-y-auto no-scrollbar py-1.5">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Browser Menu"
        className={clsx(
          "p-2 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
          isOpen ? "bg-foreground/10 text-foreground" : "hover:bg-foreground/10 hover:text-foreground"
        )}
      >
        <MoreVertical size={18} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl py-1.5 z-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          {renderContent()}
        </div>
      )}

      {/* QR Code Modal Overlay */}
      {qrCodeUrl && (
        <div className="fixed inset-0 z-200 bg-black/60 flex items-center justify-center animate-in fade-in" onClick={() => { setQrCodeUrl(null); handleClose(); }}>
          <div 
            className="bg-surface border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">Scan QR Code</h2>
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeSVG value={qrCodeUrl} size={200} level="H" includeMargin={false} />
            </div>
            <p className="mt-4 text-sm text-foreground/70 text-center max-w-50 break-all line-clamp-2" title={qrCodeUrl}>
              {qrCodeUrl}
            </p>
            <button 
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
              onClick={() => { setQrCodeUrl(null); handleClose(); }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
