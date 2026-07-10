import { useEffect, useRef } from "react";
import { Plus, Copy, Pin, Volume2, VolumeX, X, LayoutTemplate } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";

export default function TabContextMenu({ x, y, tabId, onClose }) {
  const menuRef = useRef(null);
  const { tabs, addTab, removeMultipleTabs, togglePin, toggleMute, setSplitTabId, activeTabId, splitTabId } = useBrowserStore();
  
  const tab = tabs.find(t => t.id === tabId);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside, true);
    const handleContext = (e) => { e.preventDefault(); onClose(); };
    document.addEventListener("contextmenu", handleContext);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("contextmenu", handleContext);
    };
  }, [onClose]);

  if (!tab) return null;

  const handleNewTabToRight = () => {
    addTab('browser://newtab', 'New Tab', tabId);
    onClose();
  };

  const handleDuplicate = () => {
    addTab(tab.url, tab.title, tabId);
    onClose();
  };

  const handleCloseOtherTabs = () => {
    const idsToClose = tabs
      .filter(t => t.id !== tabId && !t.isPinned)
      .map(t => t.id);
    if (idsToClose.length > 0) removeMultipleTabs(idsToClose);
    onClose();
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
    onClose();
  };

  const handleClose = () => {
    removeMultipleTabs([tabId]);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="fixed bg-surface border border-border rounded-lg shadow-2xl z-9999 w-56 py-1 text-sm text-foreground/90 animate-in fade-in zoom-in-95 duration-100 font-sans"
      style={{ left: Math.min(x, window.innerWidth - 224), top: y }}
    >
      <button 
        onClick={handleNewTabToRight}
          className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Plus size={14} className="mr-2" /> New tab to the right
      </button>
      
      {tab.id !== activeTabId && tab.id !== splitTabId && (
        <button 
          onClick={() => { setSplitTabId(tab.id); onClose(); }}
            className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <LayoutTemplate size={14} className="mr-2" /> Split view with this tab
        </button>
      )}

      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={handleDuplicate}
          className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Copy size={14} className="mr-2" /> Duplicate
      </button>
      
      <button 
        onClick={() => { togglePin(tab.id); onClose(); }}
          className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Pin size={14} className="mr-2" /> {tab.isPinned ? "Unpin" : "Pin"}
      </button>
      
      <button 
        onClick={() => { toggleMute(tab.id); onClose(); }}
          className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {tab.isMuted ? <Volume2 size={14} className="mr-2" /> : <VolumeX size={14} className="mr-2" />} 
        {tab.isMuted ? "Unmute site" : "Mute site"}
      </button>
      
      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={handleCloseOtherTabs}
          className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Close other tabs
      </button>
      
      <button 
        onClick={handleCloseTabsToRight}
          className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Close tabs to the right
      </button>
      
      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={handleClose}
          className="w-full text-left px-4 py-2 min-h-[44px] text-red-500 hover:bg-red-500 hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <X size={14} className="mr-2" /> Close
      </button>
    </div>
  );
}
