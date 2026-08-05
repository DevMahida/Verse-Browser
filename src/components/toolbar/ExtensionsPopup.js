import React from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Puzzle, Settings, Pin } from 'lucide-react';
import clsx from 'clsx';

export default function ExtensionsPopup({ onClose, isStandalone }) {
  const { installedExtensions, toggleExtension, togglePinExtension, openExtensionsTab } = useBrowserStore();
  const profileId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('profileId') || 'main' : 'main';
  
  const handleManageExtensions = () => {
    if (window.electron && window.electron.tabManager && window.electron.tabManager.openNewTab) {
      window.electron.tabManager.openNewTab({ url: 'browser://extensions' });
    } else {
      openExtensionsTab();
    }
    if (window.electron && window.electron.tabManager && window.electron.tabManager.closePopup) {
      window.electron.tabManager.closePopup();
    }
    if (onClose) onClose();
  };

  const handleExtensionClick = (ext, e) => {
    // Don't trigger click when clicking toggle/pin buttons
    if (e.target.closest('button') || e.target.closest('label')) return;
  };

  return (
    <div className={clsx(
      "bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md",
      isStandalone ? "w-full h-full" : "absolute right-0 top-full mt-2 w-80 z-50 animate-in fade-in zoom-in-95"
    )}>
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <Puzzle size={16} className="mr-2 text-blue-400" />
          Extensions
        </h3>
      </div>
      
      <div className="flex flex-col max-h-96 overflow-y-auto custom-scrollbar">
        {!installedExtensions || installedExtensions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No extensions installed
          </div>
        ) : (
          installedExtensions.map(ext => (
            <div 
              key={ext.id} 
              onClick={(e) => handleExtensionClick(ext, e)}
              className="flex items-center justify-between p-3 border-b border-border hover:bg-surface-hover transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={clsx(
                  "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border text-lg transition-colors",
                  ext.isEnabled 
                    ? "bg-background border-border" 
                    : "bg-background/50 border-border/50 opacity-60"
                )}>
                  {ext.icon || "🧩"}
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className={clsx(
                    "text-sm font-medium truncate transition-colors",
                    ext.isEnabled ? "text-foreground" : "text-foreground/50"
                  )}>{ext.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinExtension(ext.id);
                  }}
                  title={ext.isPinned ? "Unpin from toolbar" : "Pin to toolbar"}
                  className={clsx(
                    "p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2",
                    ext.isPinned 
                      ? "text-blue-500 hover:bg-blue-500/10" 
                      : "text-foreground/40 hover:text-foreground hover:bg-foreground/10"
                  )}
                >
                  {ext.isPinned ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                </button>
                <label className="relative inline-flex items-center cursor-pointer ml-1" title={ext.isEnabled ? "Disable" : "Enable"}>
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={ext.isEnabled} 
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleExtension(ext.id);
                    }} 
                  />
                  <div className="w-7 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-border bg-surface-hover/50">
        <button
          onClick={handleManageExtensions}
          className="w-full py-2 px-3 flex items-center justify-center text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <Settings size={14} className="mr-2" />
          Manage Extensions
        </button>
      </div>
    </div>
  );
}
