"use client";

import { useState, useMemo } from "react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from "zustand/react/shallow";
import { Search, Pin, Puzzle, Filter } from "lucide-react";

const CATEGORIES = ["All", "Design", "Accessibility", "Media", "Privacy", "Productivity"];

const CATEGORY_COLORS = {
  Design: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  Accessibility: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  Media: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  Privacy: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  Productivity: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
};

export default function ExtensionsPage() {
  const { installedExtensions, toggleExtension, togglePinExtension } = useBrowserStore(
    useShallow((state) => ({
      installedExtensions: state.installedExtensions,
      toggleExtension: state.toggleExtension,
      togglePinExtension: state.togglePinExtension,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredExtensions = useMemo(() => {
    return (installedExtensions || []).filter(ext => {
      const matchesSearch = !searchQuery || 
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || ext.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [installedExtensions, searchQuery, activeCategory]);

  const enabledCount = (installedExtensions || []).filter(e => e.isEnabled).length;
  const totalCount = (installedExtensions || []).length;

  return (
    <div className="w-full h-full bg-background text-foreground overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
              <Puzzle size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Extensions</h1>
              <p className="text-sm text-foreground/50">
                {enabledCount} of {totalCount} extensions enabled
              </p>
            </div>
          </div>
          <p className="text-foreground/60 text-sm max-w-xl leading-relaxed">
            Manage Verse Browser&apos;s built-in extensions. Enable powerful native features to enhance your browsing experience.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extensions..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={14} className="text-foreground/40 mr-1 hidden sm:block" />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : "bg-surface border border-border text-foreground/60 hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Extensions Grid */}
        {filteredExtensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/40">
            <Puzzle size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">No extensions found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtensions.map(ext => {
              const catColor = CATEGORY_COLORS[ext.category] || CATEGORY_COLORS.Design;
              
              return (
                <div
                  key={ext.id}
                  className={`group relative bg-surface border rounded-2xl p-5 flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-black/5 ${
                    ext.isEnabled 
                      ? "border-border hover:border-foreground/20" 
                      : "border-border/60 opacity-70 hover:opacity-90"
                  }`}
                >
                  {/* Top Row: Icon + Toggle */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${catColor.bg} border ${catColor.border} transition-transform group-hover:scale-105`}>
                      {ext.icon || "🧩"}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePinExtension(ext.id)}
                        title={ext.isPinned ? "Unpin from toolbar" : "Pin to toolbar"}
                        className={`p-1.5 rounded-lg transition-all ${
                          ext.isPinned
                            ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                            : "text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <Pin size={14} fill={ext.isPinned ? "currentColor" : "none"} />
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer" title={ext.isEnabled ? "Disable" : "Enable"}>
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={ext.isEnabled}
                          onChange={() => toggleExtension(ext.id)}
                        />
                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-base font-semibold mb-1.5 text-foreground truncate">{ext.name}</h3>
                  <p className="text-foreground/55 text-sm leading-relaxed grow mb-4">{ext.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${catColor.bg} ${catColor.text} ${catColor.border} border`}>
                      {ext.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {ext.isPinned && (
                        <span className="text-[10px] text-blue-400/70 font-medium flex items-center gap-0.5">
                          <Pin size={10} fill="currentColor" /> Pinned
                        </span>
                      )}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        ext.isEnabled 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-surface-hover text-foreground/40"
                      }`}>
                        {ext.isEnabled ? "Active" : "Off"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
