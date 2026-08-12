import { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';

export function useSearchSuggestions(query, delay = 250) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query ? query.trim() : '';

    // When the input is empty, show nothing
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const getSearchHistoryMatches = (searchQuery) => {
      const searchHistory = useBrowserStore.getState().searchHistory || [];
      const isIncognito = useBrowserStore.getState().isIncognitoWindow;
      
      // Do not show search history in incognito mode
      if (isIncognito) return [];

      const seenQueries = new Set();
      const matches = [];
      const lowerQuery = searchQuery.toLowerCase();
      const maxResults = 5;

      for (const item of searchHistory) {
        if (!item.query) continue;

        // Deduplicate by query text (case-insensitive)
        const queryKey = item.query.toLowerCase();
        if (seenQueries.has(queryKey)) continue;

        // Match against query, url, title, and domain
        const queryMatch = queryKey.includes(lowerQuery);
        const urlMatch = (item.url || '').toLowerCase().includes(lowerQuery);
        const titleMatch = (item.title || '').toLowerCase().includes(lowerQuery);
        const domainMatch = (item.domain || '').toLowerCase().includes(lowerQuery);

        if (queryMatch || urlMatch || titleMatch || domainMatch) {
          // For direct URL searches, show domain as display text
          // For text searches, show the query
          const displayText = item.isDirectUrl
            ? (item.title && item.title !== item.query ? item.title : item.domain || item.query)
            : (item.title && item.title !== item.query ? item.title : item.query);

          matches.push({
            type: 'history',
            text: displayText,
            url: item.url,
            domain: item.domain,
            favicon: item.favicon,
          });
          seenQueries.add(queryKey);
        }

        if (matches.length >= maxResults) break;
      }
      return matches;
    };

    // For URL-like inputs (has a dot, no spaces), show filtered search history only
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      const timer = setTimeout(() => {
        setSuggestions(getSearchHistoryMatches(trimmed));
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const historyMatches = getSearchHistoryMatches(trimmed);
        const targetUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}`;
        let data = null;
        
        if (window.electron?.tabManager?.fetchSource) {
          const text = await window.electron.tabManager.fetchSource({ url: targetUrl });
          data = JSON.parse(text);
        } else {
          const res = await fetch(targetUrl);
          if (res.ok) data = await res.json();
        }

        let searchMatches = [];
        if (data && Array.isArray(data) && Array.isArray(data[1])) {
          searchMatches = data[1].slice(0, 6).map(text => ({ type: 'search', text, url: null }));
        }

        setSuggestions([...historyMatches, ...searchMatches]);
      } catch (err) {
        setSuggestions(getSearchHistoryMatches(trimmed));
      } finally {
        setIsLoading(false);
      }
    };

    const timerId = setTimeout(fetchSuggestions, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [query, delay]);

  return { suggestions, isLoading };
}


