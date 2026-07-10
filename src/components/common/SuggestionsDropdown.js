import { Search } from 'lucide-react';
import clsx from 'clsx';

export default function SuggestionsDropdown({ suggestions, onSelect, className }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={clsx("absolute w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50", className)}>
      <ul className="py-2">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button
              onClick={() => onSelect(suggestion)}
              className="w-full text-left px-4 py-2.5 hover:bg-foreground/10 flex items-center gap-3 transition-colors text-foreground/90 hover:text-foreground"
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
