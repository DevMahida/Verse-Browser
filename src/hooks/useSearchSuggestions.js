import { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';

export function useSearchSuggestions(query, delay = 250) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query ? query.trim() : '';

    const getHistoryMatches = (searchQuery) => {
      const history = useBrowserStore.getState().history || [];
      const isIncognito = useBrowserStore.getState().isIncognitoWindow;
      
      // Do not show history in incognito mode
      if (isIncognito) return [];

      const uniqueUrls = new Set();
      const matches = [];

      const maxResults = searchQuery ? 2 : 6;
      const lowerQuery = searchQuery.toLowerCase();

      for (const item of history) {
        if (!item.url || item.url.startsWith('browser://') || uniqueUrls.has(item.url)) continue;

        if (!searchQuery) {
          matches.push({ type: 'history', text: item.title || item.url, url: item.url });
          uniqueUrls.add(item.url);
        } else {
          const titleMatch = (item.title || '').toLowerCase().includes(lowerQuery);
          const urlMatch = item.url.toLowerCase().includes(lowerQuery);
          if (titleMatch || urlMatch) {
            matches.push({ type: 'history', text: item.title || item.url, url: item.url });
            uniqueUrls.add(item.url);
          }
        }

        if (matches.length >= maxResults) break;
      }
      return matches;
    };

    if (!trimmed || (trimmed.includes('.') && !trimmed.includes(' '))) {
      const timer = setTimeout(() => {
        setSuggestions(getHistoryMatches(trimmed));
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const historyMatches = getHistoryMatches(trimmed);
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
        setSuggestions(getHistoryMatches(trimmed));
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
