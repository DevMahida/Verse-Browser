import { useState, useEffect } from 'react';

export function useSearchSuggestions(query, delay = 300) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }

    // Don't search if it looks like a URL (very basic check)
    if (query.includes('.') && !query.includes(' ')) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
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
