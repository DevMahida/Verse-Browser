import { useEffect, useRef } from "react";
import { Plus, Minus, Maximize } from "lucide-react";

export default function ZoomPopup({ onClose, zoomPercentage, activePaneTabId }) {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleAction = (action) => {
    window.electron?.tabManager?.action?.({ tabId: activePaneTabId, action });
  };

  return (
    <div 
      ref={popupRef}
      className="absolute top-full mt-2 right-0 bg-surface border border-border rounded-xl shadow-xl py-2 px-3 z-100 animate-in fade-in zoom-in-95 duration-100 flex flex-col w-56 origin-top-right"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-medium text-foreground">Zoom</span>
        <button 
          onClick={() => { window.electron?.toggleFullscreen?.(); onClose(); }}
          className="p-1 hover:bg-foreground/10 rounded-md transition-colors text-foreground/70 hover:text-foreground flex items-center"
          title="Fullscreen"
        >
          <Maximize size={14} className="mr-1" />
          <span className="text-xs">Fullscreen</span>
        </button>
      </div>

      <div className="flex items-center space-x-1 border border-border rounded-lg bg-surface-hover p-1">
        <button 
          onClick={() => handleAction('zoom-out')}
          className="p-1.5 flex-1 hover:bg-foreground/10 rounded-md transition-colors flex justify-center items-center text-foreground/80 hover:text-foreground"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={() => { handleAction('zoom-reset'); onClose(); }}
          className="px-3 py-1.5 text-sm font-medium hover:bg-foreground/10 min-w-16 text-center transition-colors rounded-md text-foreground"
          title="Reset zoom"
        >
          {zoomPercentage}%
        </button>
        <button 
          onClick={() => handleAction('zoom-in')}
          className="p-1.5 flex-1 hover:bg-foreground/10 rounded-md transition-colors flex justify-center items-center text-foreground/80 hover:text-foreground"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
