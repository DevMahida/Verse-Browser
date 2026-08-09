"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useBrowserStore } from "@/store/useBrowserStore";

export default function AddressInput({ activePaneTabId, activeTab }) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  
  const navigate = useBrowserStore(state => state.navigate);

  const { suggestions } = useSearchSuggestions(inputValue);
  
  const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
  if (suggestions !== prevSuggestions) {
    setPrevSuggestions(suggestions);
    setSelectedIndex(-1);
  }
  
  useEffect(() => {
    if (window.electron && window.electron.tabManager && window.electron.tabManager.showSuggestionsPopup) {
      if (isFocused && suggestions.length > 0) {
        const height = suggestions.length * 45 + 18;
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          window.electron.tabManager.showSuggestionsPopup({
            x: Math.round(window.screenX + rect.left),
            y: Math.round(window.screenY + rect.bottom + 8),
            width: Math.round(rect.width),
            height: Math.round(height)
          });
        }
        window.electron.tabManager.updateSuggestions({
          suggestions,
          selectedIndex
        });
      } else {
        window.electron.tabManager.hideSuggestionsPopup();
      }
    }
  }, [isFocused, suggestions, selectedIndex]);

  useEffect(() => {
    if (window.electron && window.electron.tabManager && window.electron.tabManager.onSuggestionSelected) {
      const cleanup = window.electron.tabManager.onSuggestionSelected((suggestion) => {
        setInputValue(suggestion);
        navigate(activePaneTabId, suggestion);
        setIsFocused(false);
      });
      return cleanup;
    }
  }, [navigate, activePaneTabId]);
  
  useEffect(() => {
    if (window.electron && window.electron.tabManager && window.electron.tabManager.onSuggestionsBlur) {
      const cleanup = window.electron.tabManager.onSuggestionsBlur(() => {
        setIsFocused(false);
      });
      return cleanup;
    }
  }, []);

  useEffect(() => {
    if (activeTab) {
      const isNewTab = activeTab.url === 'browser://newtab';
      const displayUrl = activeTab.url.replace('browser://', 'verse://');
      setInputValue(isNewTab ? '' : displayUrl);

      if (isNewTab && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 10);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handleFocusAddressBar = (e) => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (e.detail?.search) {
          setInputValue('? ');
        } else {
          inputRef.current.select();
        }
      }
    };
    window.addEventListener('focus-address-bar', handleFocusAddressBar);
    return () => window.removeEventListener('focus-address-bar', handleFocusAddressBar);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && inputValue.trim() !== '') {
      let targetUrl = selectedIndex >= 0 && suggestions[selectedIndex] ? suggestions[selectedIndex] : inputValue.trim();

      if ((e.ctrlKey || e.metaKey) && !targetUrl.includes('.') && !targetUrl.includes(' ') && !targetUrl.startsWith('verse://')) {
        targetUrl = `www.${targetUrl}.com`;
      }

      if (targetUrl.startsWith('verse://')) {
        targetUrl = targetUrl.replace('verse://', 'browser://');
      }
      navigate(activePaneTabId, targetUrl);
      setIsFocused(false);
      setSelectedIndex(-1);
      e.target?.blur?.();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={selectedIndex >= 0 && suggestions[selectedIndex] ? suggestions[selectedIndex] : inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        setSelectedIndex(-1);
      }}
      aria-label="Address and search bar"
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground placeholder-foreground/50 h-full w-full min-w-0"
      placeholder="Ask Google or type a URL"
    />
  );
}
