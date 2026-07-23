import { useBrowserStore } from "@/store/useBrowserStore";
import { BookOpen, Search, X, ExternalLink, Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function ReadingListPage() {
  const { readingList, removeFromReadingList, toggleReadingListStatus, navigate, activeTabId, addTab } = useBrowserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'

  const filteredList = (readingList || []).filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "unread") return matchesSearch && !item.isRead;
    if (filter === "read") return matchesSearch && item.isRead;
    return matchesSearch;
  });

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
    removeFromReadingList(id);
  };

  const handleToggleRead = (e, id) => {
    e.stopPropagation();
    toggleReadingListStatus(id);
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto custom-scrollbar flex justify-center p-8">
      <div className="max-w-4xl w-full flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Reading List</h1>
          </div>
          <div className="flex bg-surface p-1 rounded-xl">
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search your reading list..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 transition-colors placeholder:text-gray-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-12">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-4">
              <BookOpen className="w-12 h-12 opacity-20" />
              <p>{searchQuery ? "No matching articles found." : "Your reading list is empty."}</p>
            </div>
          ) : (
            filteredList.map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(activeTabId, item.url)}
                className={`group flex items-center p-4 hover:bg-surface border border-transparent hover:border-border rounded-xl cursor-pointer transition-all ${item.isRead ? 'bg-surface/30 opacity-70' : 'bg-surface/70'}`}
              >
                <div className="mr-4 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isRead ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {item.isRead ? <CheckCircle2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0 mr-4">
                  <span className={`text-foreground/90 font-medium truncate mb-1 ${item.isRead ? 'line-through' : ''}`}>{item.title}</span>
                  <span className="text-gray-500 text-sm truncate">{item.url}</span>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-gray-500 text-xs whitespace-nowrap mr-2">Added {formatDate(item.timestamp)}</span>
                  
                  <button 
                    onClick={(e) => handleToggleRead(e, item.id)}
                    className="p-2 text-foreground/70 hover:text-green-400 bg-background rounded-md transition-colors"
                    title={item.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    <Check className="w-4 h-4" />
                  </button>
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
                    title="Remove from list"
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
