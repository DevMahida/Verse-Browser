import { Search } from 'lucide-react';
import clsx from 'clsx';
import { useRef, useEffect } from 'react';

export default function SuggestionsDropdown({ suggestions, onSelect, selectedIndex, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Only resize if we are in an electron popup window environment!
    if (window.electron && window.electron.tabManager && window.electron.tabManager.resizeSuggestionsPopup) {
      const observer = new ResizeObserver(() => {
        if (containerRef.current) {
          // Send the EXACT rendered pixel height of the container to electron to perfectly fit the popup window
          window.electron.tabManager.resizeSuggestionsPopup({
             width: containerRef.current.offsetWidth,
             height: containerRef.current.offsetHeight
          });
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [suggestions.length]); // Re-bind observer if needed, though the same DOM element usually persists

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div ref={containerRef} className={clsx("absolute w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50", className)}>
      <ul className="py-2">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button
              onClick={() => onSelect(suggestion)}
              className={clsx(
                "w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-foreground/90 hover:text-foreground",
                selectedIndex === index ? "bg-foreground/10 text-foreground" : "hover:bg-foreground/10"
              )}
            >
              <Search className="w-4 h-4 text-gray-500" />
              <span className="truncate">{suggestion}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
