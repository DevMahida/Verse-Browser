"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import SuggestionsDropdown from "@/components/common/SuggestionsDropdown";
import TopSites from "./TopSites";

export default function HeroSection() {
  const { activeTabId, navigate, currentUser } = useBrowserStore();
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { suggestions } = useSearchSuggestions(inputValue);

  const handleSearch = (queryOrEvent) => {
    const q = typeof queryOrEvent === 'string' ? queryOrEvent : inputValue;
    if (q.trim() !== '') {
      navigate(activeTabId, q.trim());
      setIsFocused(false);
    }
  };

  const handleAISearch = () => {
    if (inputValue.trim() !== '') {
      const { setAISidebarOpen, setAiQueryToExecute } = useBrowserStore.getState();
      setAiQueryToExecute(inputValue.trim());
      setAISidebarOpen(true);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(inputValue);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const greetingText = () => {
    const timeGreeting = getGreeting();
    if (currentUser?.name) {
      return `${timeGreeting}, ${currentUser.name.split(' ')[0]}!`;
    }
    return `${timeGreeting}!`;
  };

  return (
    <div className="w-full flex flex-col items-center mt-[5vh] mb-4 px-8">
      {/* Animated Logo Placeholder */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(107,70,193,0.3)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="Verse Logo" className="w-12 h-12 object-contain" />
        </div>
        {/* Orbital rings mockup */}
        <div className="absolute inset-0 border border-accent/40 rounded-full scale-[1.5] rotate-12" />
        <div className="absolute inset-0 border border-blue-500/30 rounded-full scale-[1.3] -rotate-12" />
      </div>

      <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-foreground mb-3 tracking-tight" suppressHydrationWarning>
        {greetingText()} <span className="inline-block animate-wave"></span>
      </h1>
      <p className="text-foreground/70 mb-8 text-[clamp(1rem,2vw,1.125rem)]">
        What would you like to explore or ask today?
      </p>

      {/* Search Bar */}
      <div className="w-full max-w-200 relative flex items-center group">
        <div className="absolute inset-0 bg-linear-to-r from-accent/20 to-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center w-full bg-surface border border-border rounded-full p-2 pl-4 focus-within:border-accent/50 focus-within:bg-surface-hover transition-all">
          <Search className="text-foreground/70 mr-3 w-5 h-5" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-gray-500 text-base"
            placeholder="Search the web or ask AI anything..."
          />
          <button 
            onClick={handleAISearch}
            className="bg-accent text-white hover:bg-accent-hover px-5 py-2.5 rounded-full font-medium flex items-center shadow-[0_0_15px_rgba(107,70,193,0.4)] transition-all ml-2 text-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Search
          </button>
        </div>
        {isFocused && suggestions.length > 0 && (
          <SuggestionsDropdown
            suggestions={suggestions}
            onSelect={(suggestion) => {
              setInputValue(suggestion);
              handleSearch(suggestion);
            }}
            className="top-full mt-2"
          />
        )}
      </div>

      <TopSites />
    </div>
  );
}
