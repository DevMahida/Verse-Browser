import React from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { 
  Download, FileIcon, ChevronRight, Play, Pause, X, 
  RotateCw, CheckCircle2, XCircle, AlertTriangle, 
  ArrowDownToLine, Zap, Folder
} from 'lucide-react';
import clsx from 'clsx';

export default function DownloadsPopup({ onClose }) {
  const { downloads, openDownloadsTab, removeDownload, retryDownload, resumeInterruptedDownload } = useBrowserStore();
  const downloadsList = (downloads || []).slice(0, 5); // Get 5 most recent

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    return formatBytes(bytesPerSec) + '/s';
  };

  const getProgress = (received, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((received / total) * 100));
  };

  const handleShowAll = () => {
    openDownloadsTab();
    onClose();
  };

  const handleRemove = (e, item) => {
    e.stopPropagation();
    if (item.state === 'progressing' || item.state === 'paused') {
      window.electron?.cancelDownload(item.id);
    }
    if (item.state !== 'completed' && (item.savePath || item.path)) {
      window.electron?.removeDownloadFile({ filePath: item.savePath || item.path });
    }
    removeDownload(item.id);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[340px] bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <Download size={16} className="mr-2 text-blue-400" />
          Downloads
        </h3>
      </div>
      
      <div className="flex flex-col max-h-80 overflow-y-auto custom-scrollbar">
        {downloadsList.length === 0 ? (
          <div className="p-6 text-center text-foreground/40 text-sm">
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
            const canResume = isInterrupted && item.url;
            const canRetry = (isCancelled || isInterrupted) && item.url;

            return (
              <div key={item.id} className="group p-3 border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isDone ? "bg-emerald-500/10 text-emerald-400" : 
                    isCancelled || isInterrupted ? "bg-red-500/10 text-red-400" : 
                    isPaused ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-blue-500/10 text-blue-400"
                  )}>
                    <FileIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[13px] font-medium text-foreground/90 truncate" title={item.fileName}>
                        {item.fileName}
                      </h4>
                      <button
                        onClick={(e) => handleRemove(e, item)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-all shrink-0"
                        title="Remove"
                        aria-label="Remove download"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="text-[11px] mt-0.5 font-medium">
                      {isDone ? (
                        <span className="text-emerald-400">Completed • {formatBytes(item.totalBytes)}</span>
                      ) : isCancelled ? (
                        <span className="text-red-400">Cancelled</span>
                      ) : isInterrupted ? (
                        <span className="text-amber-400">Interrupted • {formatBytes(item.receivedBytes || 0)} / {formatBytes(item.totalBytes)}</span>
                      ) : isPaused ? (
                        <span className="text-yellow-400">Paused • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}</span>
                      ) : (
                        <span className="text-blue-400 flex items-center gap-1.5">
                          {progress}% • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}
                          {item.speed > 0 && (
                            <span className="text-foreground/40 flex items-center gap-0.5">
                              <Zap size={10} />
                              {formatSpeed(item.speed)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {!isDone && !isCancelled && (
                      <div className="w-full h-1 bg-foreground/5 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={clsx(
                            "h-full rounded-full transition-all duration-300",
                            isPaused ? "bg-yellow-500" : 
                            isInterrupted ? "bg-amber-500" :
                            "bg-blue-500"
                          )} 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    {/* Inline action buttons */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {isProgressing && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.electron?.pauseDownload(item.id); }}
                            className="p-1 rounded hover:bg-yellow-500/10 text-foreground/50 hover:text-yellow-400 transition-colors"
                            title="Pause"
                            aria-label="Pause download"
                          >
                            <Pause size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.electron?.cancelDownload(item.id); }}
                            className="p-1 rounded hover:bg-red-500/10 text-foreground/50 hover:text-red-400 transition-colors"
                            title="Cancel"
                            aria-label="Cancel download"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                      {isPaused && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.electron?.resumeDownload(item.id); }}
                            className="p-1 rounded hover:bg-emerald-500/10 text-foreground/50 hover:text-emerald-400 transition-colors"
                            title="Resume"
                            aria-label="Resume download"
                          >
                            <Play size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.electron?.cancelDownload(item.id); }}
                            className="p-1 rounded hover:bg-red-500/10 text-foreground/50 hover:text-red-400 transition-colors"
                            title="Cancel"
                            aria-label="Cancel download"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                      {canRetry && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); retryDownload(item.id); }}
                          className="p-1 rounded hover:bg-blue-500/10 text-foreground/50 hover:text-blue-400 transition-colors"
                          title="Retry"
                          aria-label="Retry download"
                        >
                          <RotateCw size={14} />
                        </button>
                      )}
                      {isDone && item.path && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.electron?.openFile(item.path); }}
                            className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            aria-label="Open file"
                          >
                            Open
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.electron?.showInFolder(item.path); }}
                            className="p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-foreground/70 transition-colors"
                            title="Show in folder"
                            aria-label="Show in folder"
                          >
                            <Folder size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
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
