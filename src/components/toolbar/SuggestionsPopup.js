import { useState, useEffect } from 'react';
import SuggestionsDropdown from '@/components/common/SuggestionsDropdown';

export default function SuggestionsPopup() {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (window.electron && window.electron.tabManager && window.electron.tabManager.onSuggestionsUpdate) {
      const cleanup = window.electron.tabManager.onSuggestionsUpdate((data) => {
        setSuggestions(data.suggestions);
        setSelectedIndex(data.selectedIndex);
      });
      return cleanup;
    }
  }, []);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="w-full bg-transparent">
      <SuggestionsDropdown
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        onSelect={(suggestion) => {
          if (window.electron && window.electron.tabManager) {
            window.electron.tabManager.hideSuggestionsPopup();
            window.electron.tabManager.selectSuggestion(suggestion);
          }
        }}
        className="w-full relative shadow-xl rounded-xl border border-border bg-surface"
      />
    </div>
  );
}
