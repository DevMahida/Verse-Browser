import { useEffect, useRef, useCallback } from "react";
import { Plus, Copy, Pin, Volume2, VolumeX, X, LayoutTemplate, PanelLeft, Columns2 } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';

export default function TabContextMenu({ x, y, tabId, onClose, isStandalone }) {
  const menuRef = useRef(null);
  const { tabs, addTab, removeMultipleTabs, togglePin, toggleMute, setSplitTabId, activeTabId, splitTabId, sideTabsEnabled, toggleSideTabs } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      addTab: state.addTab,
      removeMultipleTabs: state.removeMultipleTabs,
      togglePin: state.togglePin,
      toggleMute: state.toggleMute,
      setSplitTabId: state.setSplitTabId,
      activeTabId: state.activeTabId,
      splitTabId: state.splitTabId,
      sideTabsEnabled: state.sideTabsEnabled,
      toggleSideTabs: state.toggleSideTabs,
    }))
  );
  
  const tab = tabs.find(t => t.id === tabId);

  const handleCloseMenu = useCallback(() => {
    if (isStandalone && window.electron?.tabManager?.closePopup) {
      window.electron.tabManager.closePopup();
    } else if (onClose) {
      onClose();
    }
  }, [isStandalone, onClose]);

  useEffect(() => {
    if (isStandalone) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleCloseMenu();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside, true);
    const handleContext = (e) => { e.preventDefault(); handleCloseMenu(); };
    document.addEventListener("contextmenu", handleContext);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("contextmenu", handleContext);
    };
  }, [isStandalone, handleCloseMenu]);

  useEffect(() => {
    if (isStandalone && menuRef.current && window.electron?.tabManager?.resizePopup) {
      setTimeout(() => {
        if (menuRef.current) {
          const height = menuRef.current.offsetHeight;
          window.electron.tabManager.resizePopup({ width: 224, height });
        }
      }, 0);
    }
  }, [isStandalone, tab]);

  if (!tab) return null;

  const handleNewTabToRight = () => {
    addTab('browser://newtab', 'New Tab', tabId);
    handleCloseMenu();
  };

  const handleDuplicate = () => {
    addTab(tab.url, tab.title, tabId);
    handleCloseMenu();
  };

  const handleCloseOtherTabs = () => {
    const idsToClose = tabs
      .filter(t => t.id !== tabId && !t.isPinned)
      .map(t => t.id);
    if (idsToClose.length > 0) removeMultipleTabs(idsToClose);
    handleCloseMenu();
  };

  const handleCloseTabsToRight = () => {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx !== -1) {
      const idsToClose = tabs
        .slice(idx + 1)
        .filter(t => !t.isPinned)
        .map(t => t.id);
      if (idsToClose.length > 0) removeMultipleTabs(idsToClose);
    }
    handleCloseMenu();
  };

  const handleClose = () => {
    removeMultipleTabs([tabId]);
    handleCloseMenu();
  };

  const handlePinToggle = () => {
    togglePin(tabId);
    handleCloseMenu();
  };

  const handleMuteToggle = () => {
    toggleMute(tabId);
    handleCloseMenu();
  };

  return (
    <div 
      ref={menuRef}
      className={isStandalone ? "w-full h-fit bg-surface flex flex-col text-sm text-foreground/90 overflow-hidden" : "fixed bg-surface border border-border rounded-lg shadow-2xl z-9999 w-56 py-1 text-sm text-foreground/90 animate-in fade-in zoom-in-95 duration-100 font-sans"}
      style={isStandalone ? { borderRadius: '0px' } : { left: Math.min(x, window.innerWidth - 224), top: y }}
    >
      <button 
        onClick={handleNewTabToRight}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Plus size={14} className="mr-2" /> New tab to the right
      </button>
      
      {tab.id !== activeTabId && tab.id !== splitTabId && (
        <button 
          onClick={() => { setSplitTabId(tab.id); handleCloseMenu(); }}
            className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <LayoutTemplate size={14} className="mr-2" /> Split view with this tab
        </button>
      )}

      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={handleDuplicate}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Copy size={14} className="mr-2" /> Duplicate
      </button>
      
      <button 
        onClick={() => { togglePin(tab.id); handleCloseMenu(); }}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Pin size={14} className="mr-2" /> {tab.isPinned ? "Unpin" : "Pin"}
      </button>
      
      <button 
        onClick={() => { toggleMute(tab.id); handleCloseMenu(); }}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {tab.isMuted ? <Volume2 size={14} className="mr-2" /> : <VolumeX size={14} className="mr-2" />} 
        {tab.isMuted ? "Unmute site" : "Mute site"}
      </button>
      
      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={handleCloseOtherTabs}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Close other tabs
      </button>
      
      <button 
        onClick={handleCloseTabsToRight}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Close tabs to the right
      </button>
      
      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={handleClose}
          className="w-full text-left px-4 py-2 min-h-11 text-red-500 hover:bg-red-500 hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <X size={14} className="mr-2" /> Close
      </button>

      <div className="h-px bg-border my-1" />

      <button 
        onClick={() => { toggleSideTabs(); handleCloseMenu(); }}
          className="w-full text-left px-4 py-2 min-h-11 hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {sideTabsEnabled ? (
          <><Columns2 size={14} className="mr-2" /> Use horizontal tabs</>
        ) : (
          <><PanelLeft size={14} className="mr-2" /> Use vertical tabs</>
        )}
      </button>
    </div>
  );
}
