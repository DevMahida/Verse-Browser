import { useBrowserStore } from "@/store/useBrowserStore";
import { Bookmark, Search, Trash2, ExternalLink, X } from "lucide-react";
import { useState } from "react";

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, navigate, activeTabId, addTab } = useBrowserStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookmarks = bookmarks.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }).format(new Date(timestamp));
  };

  const handleOpenInNewTab = (e, url) => {
    e.stopPropagation();
    addTab(url);
  };

  const handleRemoveItem = (e, id) => {
    e.stopPropagation();
    removeBookmark(id);
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto custom-scrollbar flex justify-center p-8">
      <div className="max-w-4xl w-full flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-yellow-500/20 text-yellow-500">
              <Bookmark className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Bookmarks</h1>
          </div>
        </div>

        <div className="relative mb-6 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search your bookmarks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 transition-colors placeholder:text-gray-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-12">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-4">
              <Bookmark className="w-12 h-12 opacity-20" />
              <p>{searchQuery ? "No matching bookmarks found." : "Your bookmarks list is empty."}</p>
            </div>
          ) : (
            filteredBookmarks.map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(activeTabId, item.url)}
                className="group flex items-center p-4 bg-surface/50 hover:bg-surface border border-transparent hover:border-border rounded-xl cursor-pointer transition-all"
              >
                <div className="mr-4 shrink-0">
                  {item.favicon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.favicon} alt="" className="w-6 h-6 rounded bg-foreground/" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-surface-hover/80 flex items-center justify-center">
                      <Bookmark className="w-3 h-3 text-foreground/70" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0 mr-4">
                  <span className="text-foreground/90 font-medium truncate mb-1">{item.title}</span>
                  <span className="text-gray-500 text-sm truncate">{item.url}</span>
                </div>
                <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-gray-500 text-xs whitespace-nowrap">Added {formatDate(item.timestamp)}</span>
                  <button 
                    onClick={(e) => handleOpenInNewTab(e, item.url)}
                    className="p-2 text-foreground/70 hover:text-accent bg-background rounded-md transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleRemoveItem(e, item.id)}
                    className="p-2 text-foreground/70 hover:text-red-400 bg-background rounded-md transition-colors"
                    title="Remove bookmark"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
