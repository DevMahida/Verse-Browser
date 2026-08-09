import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { useShallow } from 'zustand/react/shallow';
import { X } from 'lucide-react';

export default function TabSearchMenu({ isStandalone }) {
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const menuRef = useRef(null);
  
  const { tabs, setActiveTab, removeTab } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      setActiveTab: state.setActiveTab,
      removeTab: state.removeTab
    }))
  );

  const handleClose = useCallback(() => {
    if (isStandalone && window.electron?.tabManager?.closePopup) {
      window.electron.tabManager.closePopup();
    }
  }, [isStandalone]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStandalone, handleClose]);

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
  }, [isStandalone, tabs, tabSearchQuery]);

  return (
    <div ref={menuRef} className="w-full h-fit max-h-125 bg-surface border-t border-border flex flex-col overflow-hidden" style={{ borderRadius: isStandalone ? '0px' : '0.5rem' }}>
      <div className="p-2 border-b border-border">
        <input
          type="text"
          autoFocus
          value={tabSearchQuery}
          onChange={(e) => setTabSearchQuery(e.target.value)}
          placeholder="Search tabs..."
          className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:border-accent/50 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-1 flex flex-col space-y-1 bg-surface">
        {tabs.filter(t => t.title?.toLowerCase().includes(tabSearchQuery.toLowerCase()) || t.url?.toLowerCase().includes(tabSearchQuery.toLowerCase())).map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setTabSearchQuery('');
              handleClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-surface-hover rounded-md text-left group cursor-pointer"
          >
            {t.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.favicon} className="w-4 h-4 rounded-sm shrink-0 bg-foreground/10" alt="" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-foreground/10 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground font-medium truncate leading-tight">{t.title}</div>
              <div className="text-[10px] text-foreground/50 truncate leading-tight">{t.url}</div>
            </div>
            <X 
              size={14} 
              className="opacity-0 group-hover:opacity-100 text-foreground/50 hover:text-red-400 transition-opacity shrink-0 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                removeTab(t.id);
              }}
            />
          </button>
        ))}
        {tabs.filter(t => t.title?.toLowerCase().includes(tabSearchQuery.toLowerCase()) || t.url?.toLowerCase().includes(tabSearchQuery.toLowerCase())).length === 0 && (
          <div className="text-xs text-foreground/50 text-center py-4">No tabs found</div>
        )}
      </div>
    </div>
  );
}
