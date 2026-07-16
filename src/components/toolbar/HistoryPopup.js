import React, { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Clock, ChevronRight, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function HistoryPopup({ onClose }) {
  const { openHistoryTab, firebaseUid, currentUser, navigate, activeTabId, profileId, history: localHistory } = useBrowserStore();
  const [firebaseHistory, setFirebaseHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fbProfile = String(profileId);

  useEffect(() => {
    let isMounted = true;
    if (firebaseUid) {
      const q = query(
        collection(db, "users", firebaseUid, "profiles", fbProfile, "history"),
        orderBy("visit_time", "desc"),
        limit(5)
      );
      getDocs(q).then((snapshot) => {
        if (isMounted) {
          setFirebaseHistory(snapshot.docs.map(doc => {
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
  }, [firebaseUid, fbProfile]);

  const combinedHistoryMap = new Map();
  localHistory.forEach(item => combinedHistoryMap.set(item.id, {
    ...item,
    timestamp: item.timestamp || item.visit_time || 0
  }));
  firebaseHistory.forEach(item => combinedHistoryMap.set(item.id, item));
  
  const combinedHistory = Array.from(combinedHistoryMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  const displayHistory = combinedHistory.slice(0, 5);

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
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : displayHistory.length > 0 ? (
          <div className="py-2">
            {displayHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.url)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface border-b border-border last:border-b-0 transition-colors text-left"
              >
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-foreground text-sm font-medium truncate">{item.title}</span>
                  <span className="text-foreground/50 text-xs truncate">{item.url}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No recent history
          </div>
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
