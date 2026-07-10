import React from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Download, FileIcon, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function DownloadsPopup({ onClose }) {
  const { downloads, openDownloadsTab } = useBrowserStore();
  const downloadsList = (downloads || []).slice(0, 3); // Get 3 most recent

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgress = (received, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((received / total) * 100));
  };

  const handleShowAll = () => {
    openDownloadsTab();
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <Download size={16} className="mr-2 text-blue-400" />
          Recent Downloads
        </h3>
      </div>
      
      <div className="flex flex-col max-h-75 overflow-y-auto custom-scrollbar">
        {downloadsList.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No recent downloads
          </div>
        ) : (
          downloadsList.map(item => {
            const isDone = item.state === 'completed';
            const isCancelled = item.state === 'cancelled';
            const isPaused = item.state === 'paused';
            const isInterrupted = item.state === 'interrupted';
            const isProgressing = item.state === 'progressing';
            const progress = getProgress(item.receivedBytes, item.totalBytes);

            return (
              <div key={item.id} className="p-3 border-b border-border/50 hover:bg-surface-hover transition-colors flex items-center gap-3">
                <div className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isDone ? "bg-green-500/10 text-green-400" : 
                  isCancelled || isInterrupted ? "bg-red-500/10 text-red-400" : 
                  "bg-blue-500/10 text-blue-400"
                )}>
                  <FileIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-foreground/90 truncate" title={item.fileName}>
                    {item.fileName}
                  </h4>
                  <div className="text-xs mt-0.5 font-medium truncate">
                    {isDone ? (
                      <span className="text-green-400">Completed • {formatBytes(item.totalBytes)}</span>
                    ) : isCancelled ? (
                      <span className="text-red-400">Cancelled</span>
                    ) : isInterrupted ? (
                      <span className="text-red-400">Interrupted</span>
                    ) : isPaused ? (
                      <span className="text-yellow-400">Paused</span>
                    ) : (
                      <span className="text-blue-400">{progress}% • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}</span>
                    )}
                  </div>
                  {!isDone && !isCancelled && !isInterrupted && (
                    <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-300",
                          isPaused ? "bg-yellow-500" : "bg-blue-500"
                        )} 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button 
        onClick={handleShowAll}
        className="p-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
      >
        Show all downloads
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
}
