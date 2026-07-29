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
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[1])) {
            setSuggestions(data[1].slice(0, 6));
          } else {
            setSuggestions([]);
          }
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
