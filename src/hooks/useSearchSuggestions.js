import { useState, useEffect } from 'react';

export function useSearchSuggestions(query, delay = 250) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query ? query.trim() : '';

    if (!trimmed || (trimmed.includes('.') && !trimmed.includes(' '))) {
      const timer = setTimeout(() => {
        setSuggestions([]);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const targetUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}`;
        let data = null;
        
        if (window.electron?.tabManager?.fetchSource) {
          const text = await window.electron.tabManager.fetchSource({ url: targetUrl });
          data = JSON.parse(text);
        } else {
          const res = await fetch(targetUrl);
          if (res.ok) data = await res.json();
        }

        if (data && Array.isArray(data) && Array.isArray(data[1])) {
          setSuggestions(data[1].slice(0, 6));
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setSuggestions([]);
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
