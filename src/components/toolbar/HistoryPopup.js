import React, { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Clock, ChevronRight, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function HistoryPopup({ onClose }) {
  const { openHistoryTab, firebaseUid, navigate, activeTabId } = useBrowserStore();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (firebaseUid) {
      const q = query(
        collection(db, "users", firebaseUid, "history"),
        orderBy("visit_time", "desc"),
        limit(5)
      );
      getDocs(q).then((snapshot) => {
        if (isMounted) {
          setHistory(snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              url: data.url,
              title: data.title,
              timestamp: typeof data.visit_time === 'number' ? data.visit_time : (data.visit_time?.toMillis?.() || Date.now())
            };
          }));
          setIsLoading(false);
        }
      }).catch(err => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setIsLoading(false);
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [firebaseUid]);

  const handleShowAll = () => {
    openHistoryTab();
    onClose();
  };

  const handleNavigate = (url) => {
    navigate(activeTabId, url);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <Clock size={16} className="mr-2 text-accent" />
          Recent History
        </h3>
      </div>
      
      <div className="flex flex-col max-h-75 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-6 text-accent">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No recent history
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleNavigate(item.url)}
              className="p-3 border-b border-border/50 hover:bg-surface-hover transition-colors flex flex-col gap-1 cursor-pointer"
            >
              <div className="text-sm font-medium text-foreground/90 truncate" title={item.title}>
                {item.title || item.url}
              </div>
              <div className="text-xs text-foreground/50 truncate" title={item.url}>
                {item.url}
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={handleShowAll}
        className="p-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
      >
        Show all history
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
}
