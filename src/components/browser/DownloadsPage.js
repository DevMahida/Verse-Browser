import React, { useState, useEffect } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { 
  Download, 
  Trash2, 
  Folder, 
  FileIcon, 
  Play, 
  Pause, 
  X,
  Settings
} from 'lucide-react';
import clsx from 'clsx';

export default function DownloadsPage() {
  const { downloads, downloadSettings, updateDownloadSettings, clearCompletedDownloads } = useBrowserStore();

  useEffect(() => {
    // Fetch default path if not set
    if (!downloadSettings.defaultPath && window.electron) {
      window.electron.getDefaultDownloadPath().then(path => {
        updateDownloadSettings({ defaultPath: path });
      });
    }
  }, [downloadSettings.defaultPath, updateDownloadSettings]);


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

  const downloadsList = downloads || [];

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-semibold flex items-center gap-3">
              <Download size={28} className="text-blue-400" />
              Downloads
            </h1>
            <div className="flex gap-4">
              <button
                onClick={clearCompletedDownloads}
                aria-label="Clear completed downloads"
                className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg bg-surface hover:bg-surface-hover transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
              >
                <Trash2 size={16} />
                Clear Completed
              </button>
            </div>
          </div>


          {downloadsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Download size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No downloads yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {downloadsList.map((item) => {
                const progress = getProgress(item.receivedBytes, item.totalBytes);
                const isDone = item.state === 'completed';
                const isCancelled = item.state === 'cancelled';
                const isPaused = item.state === 'paused';
                const isInterrupted = item.state === 'interrupted';
                const isProgressing = item.state === 'progressing';
                
                return (
                  <div key={item.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-border/60">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={clsx(
                          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                          isDone ? "bg-green-500/10 text-green-400" : 
                          isCancelled || isInterrupted ? "bg-red-500/10 text-red-400" : 
                          "bg-blue-500/10 text-blue-400"
                        )}>
                          <FileIcon size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-foreground/90 truncate">{item.fileName}</h3>
                          <p className="text-xs text-foreground/70 truncate mt-1">{item.url}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs font-medium">
                            {isDone ? (
                              <span className="text-green-400">Completed • {formatBytes(item.totalBytes)}</span>
                            ) : isCancelled ? (
                              <span className="text-red-400">Cancelled</span>
                            ) : isInterrupted ? (
                              <span className="text-red-400">Interrupted</span>
                            ) : isPaused ? (
                              <span className="text-yellow-400">Paused • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}</span>
                            ) : (
                              <span className="text-blue-400">Downloading • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {isProgressing && (
                          <button aria-label="Pause download" onClick={() => window.electron?.pauseDownload(item.id)} className="p-2 min-w-11 min-h-11 flex items-center justify-center hover:bg-foreground/10 rounded-lg text-foreground/70 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none" title="Pause">
                            <Pause size={18} />
                          </button>
                        )}
                        {isPaused && (
                          <button aria-label="Resume download" onClick={() => window.electron?.resumeDownload(item.id)} className="p-2 min-w-11 min-h-11 flex items-center justify-center hover:bg-foreground/10 rounded-lg text-foreground/70 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none" title="Resume">
                            <Play size={18} />
                          </button>
                        )}
                        {(isProgressing || isPaused) && (
                          <button aria-label="Cancel download" onClick={() => window.electron?.cancelDownload(item.id)} className="p-2 min-w-11 min-h-11 flex items-center justify-center hover:bg-red-500/20 rounded-lg text-foreground/70 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:outline-none" title="Cancel">
                            <X size={18} />
                          </button>
                        )}
                        {isDone && item.path && (
                          <>
                            <button aria-label="Open file" onClick={() => window.electron?.openFile(item.path)} className="px-3 py-1.5 min-h-11 text-sm font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none">
                              Open File
                            </button>
                            <button aria-label="Show in folder" onClick={() => window.electron?.showInFolder(item.path)} className="p-2 min-w-11 min-h-11 flex items-center justify-center hover:bg-foreground/10 rounded-lg text-foreground/70 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none" title="Show in folder">
                              <Folder size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {!isDone && !isCancelled && !isInterrupted && (
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-1">
                        <div 
                          className={clsx(
                            "h-full transition-all duration-300 rounded-full",
                            isPaused ? "bg-yellow-500" : "bg-blue-500"
                          )} 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
