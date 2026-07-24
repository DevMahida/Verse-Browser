"use client";

import { useState, useEffect } from "react";

export default function ClearDataModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-clear-data", handleOpen);
    return () => window.removeEventListener("open-clear-data", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.electron?.sessionManager?.clearBrowsingData) {
      window.electron.sessionManager.clearBrowsingData();
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-semibold text-foreground mb-4">Clear Browsing Data</h2>
        <p className="text-foreground/70 mb-6">
          This will clear your cache, cookies, and other browsing data. Your history and bookmarks will remain intact (managed by Firebase). Are you sure?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg text-foreground hover:bg-foreground/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-sm"
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  );
}
