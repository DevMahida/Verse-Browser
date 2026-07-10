import { useRef, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { useShallow } from 'zustand/react/shallow';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function FindBar({ tabId }) {
  const { tabs, updateFindState } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      updateFindState: state.updateFindState,
    }))
  );

  const inputRef = useRef(null);
  
  const tab = tabs.find(t => t.id === tabId);
  const findState = tab?.findState || { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 };
  
  useEffect(() => {
    if (findState.isVisible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [findState.isVisible]);

  if (!findState.isVisible) return null;

  const handleClose = () => {
    updateFindState(tabId, { isVisible: false, text: '', matches: 0, activeMatchOrdinal: 0 });
    window.electron?.tabManager?.action?.({ tabId, action: 'stop-find-in-page' });
  };

  const handleSearch = (text) => {
    updateFindState(tabId, { text });
    if (text) {
      window.electron?.tabManager?.action?.({ tabId, action: 'findInPage', data: { text } });
    } else {
      window.electron?.tabManager?.action?.({ tabId, action: 'stop-find-in-page' });
    }
  };

  const handleNext = () => {
    if (findState.text) {
      window.electron?.tabManager?.action?.({ tabId, action: 'find-next', data: { text: findState.text } });
    }
  };

  const handlePrev = () => {
    if (findState.text) {
      window.electron?.tabManager?.action?.({ tabId, action: 'find-prev', data: { text: findState.text } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="w-full flex items-center justify-between bg-surface border-b border-border px-4 py-1.5 animate-in slide-in-from-top-2 fade-in">
      <div className="flex items-center text-sm font-medium text-foreground/80">
        Find in page
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-background border border-border rounded-md px-2 py-1">
          <Search size={14} className="text-foreground/50 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={findState.text}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 text-foreground"
          />
          {findState.text && (
            <span className="text-xs text-foreground/50 ml-2 min-w-10 text-right">
              {findState.matches > 0 ? `${findState.activeMatchOrdinal}/${findState.matches}` : '0/0'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            disabled={!findState.text || findState.matches === 0}
            className="p-1.5 rounded hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground/70 hover:text-foreground"
            aria-label="Previous match"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={handleNext}
            disabled={!findState.text || findState.matches === 0}
            className="p-1.5 rounded hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground/70 hover:text-foreground"
            aria-label="Next match"
          >
            <ChevronDown size={16} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-red-500/20 text-foreground/70 hover:text-red-400 transition-colors"
            aria-label="Close find bar"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
