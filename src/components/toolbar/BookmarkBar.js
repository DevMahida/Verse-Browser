"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from "zustand/react/shallow";

export default function BookmarkBar() {
  const { bookmarks, navigate, activeTabId, addTab } = useBrowserStore(
    useShallow((state) => ({
      bookmarks: state.bookmarks,
      navigate: state.navigate,
      activeTabId: state.activeTabId,
      addTab: state.addTab,
    }))
  );

  if (!bookmarks || bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="h-8 bg-surface border-b border-border flex items-center px-2 space-x-1 overflow-x-auto no-scrollbar">
      {bookmarks.map((bookmark) => (
        <button
          key={bookmark.id}
          onClick={() => navigate(activeTabId, bookmark.url)}
          onAuxClick={(e) => {
            if (e.button === 1) { // Middle click
              e.preventDefault();
              addTab(bookmark.url);
            }
          }}
          className="flex items-center max-w-37.5 px-2 py-1 rounded hover:bg-foreground/10 transition-colors text-xs text-foreground/80 hover:text-foreground"
          title={bookmark.title || bookmark.url}
        >
          {bookmark.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bookmark.favicon} className="w-3.5 h-3.5 mr-1.5 shrink-0 bg-foreground/10 rounded-sm" alt="" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-600 shrink-0 mr-1.5" />
          )}
          <span className="truncate">{bookmark.title || bookmark.url}</span>
        </button>
      ))}
    </div>
  );
}
