import { useBrowserStore } from "@/store/useBrowserStore";
import { Clock, Search, Trash2, ExternalLink, X } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc, writeBatch } from "firebase/firestore";

export default function HistoryPage() {
  const { firebaseUid, currentUser, navigate, activeTabId, addTab, profileId } = useBrowserStore();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fbProfile = String(profileId);

  useEffect(() => {
    if (firebaseUid) {
      const q = query(
        collection(db, "users", firebaseUid, "profiles", fbProfile, "history"),
        orderBy("visit_time", "desc"),
        limit(500)
      );
      getDocs(q).then((snapshot) => {
        setHistory(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            url: data.url,
            title: data.title,
            timestamp: typeof data.visit_time === 'number' ? data.visit_time : (data.visit_time?.toMillis?.() || Date.now())
          };
        }));
      }).catch(console.error);
    }
  }, [firebaseUid, fbProfile]);

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const handleOpenInNewTab = (e, url) => {
    e.stopPropagation();
    addTab(url);
  };

  const handleClearHistory = async () => {
    if (firebaseUid) {
      try {
        const batch = writeBatch(db);
        history.forEach((item) => {
          batch.delete(doc(db, "users", firebaseUid, "profiles", fbProfile, "history", item.id));
        });
        await batch.commit();
        setHistory([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemoveItem = async (e, id) => {
    e.stopPropagation();
    if (firebaseUid) {
      try {
        await deleteDoc(doc(db, "users", firebaseUid, "profiles", fbProfile, "history", id));
        setHistory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto custom-scrollbar flex justify-center p-8">
      <div className="max-w-4xl w-full flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-accent/20 text-accent">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-foreground tracking-tight">History</h1>
          </div>
          <button 
            onClick={handleClearHistory}
            aria-label="Clear all history"
            className="flex items-center px-4 py-2 min-h-[44px] text-sm text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </button>
        </div>

        <div className="relative mb-6 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search your history..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 transition-colors placeholder:text-gray-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-12">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-4">
              <Clock className="w-12 h-12 opacity-20" />
              <p>{searchQuery ? "No matching history found." : "Your history is empty."}</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(activeTabId, item.url)}
                className="group flex items-center p-4 bg-surface/50 hover:bg-surface border border-transparent hover:border-border rounded-xl cursor-pointer transition-all"
              >
                <div className="flex flex-col flex-1 min-w-0 mr-4">
                  <span className="text-foreground/90 font-medium truncate mb-1">{item.title}</span>
                  <span className="text-gray-500 text-sm truncate">{item.url}</span>
                </div>
                <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(item.timestamp)}</span>
                  <button 
                    onClick={(e) => handleOpenInNewTab(e, item.url)}
                    aria-label="Open in new tab"
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-accent bg-background rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleRemoveItem(e, item.id)}
                    aria-label="Remove from history"
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-red-400 bg-background rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    title="Remove from history"
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
