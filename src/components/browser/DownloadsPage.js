import React, { useState, useMemo } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { 
  Download, 
  Trash2, 
  Folder, 
  FileIcon, 
  Play, 
  Pause, 
  X,
  Search,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  ArrowDownToLine,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
} from 'lucide-react';
import clsx from 'clsx';

// Map file extensions to icons
const getFileIcon = (fileName) => {
  if (!fileName) return FileIcon;
  const ext = fileName.split('.').pop()?.toLowerCase();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'];
  const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yml', 'yaml'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'csv'];
  
  if (imageExts.includes(ext)) return FileImage;
  if (videoExts.includes(ext)) return FileVideo;
  if (audioExts.includes(ext)) return FileAudio;
  if (archiveExts.includes(ext)) return FileArchive;
  if (codeExts.includes(ext)) return FileCode;
  if (docExts.includes(ext)) return FileText;
  return FileIcon;
};

export default function DownloadsPage() {
  const { 
    downloads, downloadSettings, updateDownloadSettings, 
    clearCompletedDownloads, clearAllDownloads, removeDownload,
    retryDownload, resumeInterruptedDownload 
  } = useBrowserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'failed'

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

  const formatETA = (receivedBytes, totalBytes, speed) => {
    if (!speed || speed <= 0 || !totalBytes || totalBytes <= 0) return '';
    const remainingBytes = totalBytes - receivedBytes;
    if (remainingBytes <= 0) return '';
    const seconds = Math.round(remainingBytes / speed);
    if (seconds < 60) return `${seconds}s left`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${seconds % 60}s left`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m left`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`;
  };

  const getProgress = (received, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((received / total) * 100));
  };

  const downloadsList = useMemo(() => {
    let list = downloads || [];
    
    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        d.fileName?.toLowerCase().includes(q) || 
        d.url?.toLowerCase().includes(q)
      );
    }
    
    // Filter by status
    if (filter === 'active') {
      list = list.filter(d => d.state === 'progressing' || d.state === 'paused');
    } else if (filter === 'completed') {
      list = list.filter(d => d.state === 'completed');
    } else if (filter === 'failed') {
      list = list.filter(d => d.state === 'cancelled' || d.state === 'interrupted');
    }
    
    return list;
  }, [downloads, searchQuery, filter]);

  const activeCount = (downloads || []).filter(d => d.state === 'progressing' || d.state === 'paused').length;
  const completedCount = (downloads || []).filter(d => d.state === 'completed').length;
  const failedCount = (downloads || []).filter(d => d.state === 'cancelled' || d.state === 'interrupted').length;

  const handleRemoveDownload = (item) => {
    // If it's an active download, cancel it first
    if (item.state === 'progressing' || item.state === 'paused') {
      window.electron?.cancelDownload(item.id);
    }
    // Remove the partial file if it's not completed
    if (item.state !== 'completed' && (item.savePath || item.path)) {
      window.electron?.removeDownloadFile({ filePath: item.savePath || item.path });
    }
    removeDownload(item.id);
  };

  const getStatusConfig = (item) => {
    switch (item.state) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' };
      case 'interrupted':
        return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Interrupted' };
      case 'paused':
        return { icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Paused' };
      default:
        return { icon: ArrowDownToLine, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Downloading' };
    }
  };

  const filters = [
    { key: 'all', label: 'All', count: (downloads || []).length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'failed', label: 'Failed', count: failedCount },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-semibold flex items-center gap-3">
              <Download size={28} className="text-blue-400" />
              Downloads
            </h1>
            <div className="flex gap-2">
              <button
                onClick={clearCompletedDownloads}
                aria-label="Clear completed downloads"
                className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg bg-surface hover:bg-surface-hover transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
              >
                <Trash2 size={16} />
                Clear Completed
              </button>
              {(downloads || []).length > 0 && (
                <button
                  onClick={clearAllDownloads}
                  aria-label="Clear all downloads"
                  className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloads..."
                className="w-full h-10 pl-10 pr-4 bg-surface border border-border rounded-lg text-sm text-foreground placeholder-foreground/40 outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-surface rounded-lg p-1 border border-border">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    filter === f.key
                      ? "bg-accent/20 text-accent"
                      : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={clsx(
                      "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                      filter === f.key ? "bg-accent/20" : "bg-foreground/10"
                    )}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Downloads List */}
          {downloadsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-foreground/40">
              <Download size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery || filter !== 'all' ? 'No matching downloads' : 'No downloads yet'}
              </p>
              <p className="text-sm mt-1 text-foreground/30">
                {searchQuery ? 'Try a different search term' : 'Files you download will appear here'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {downloadsList.map((item) => {
                const progress = getProgress(item.receivedBytes, item.totalBytes);
                const isDone = item.state === 'completed';
                const isCancelled = item.state === 'cancelled';
                const isPaused = item.state === 'paused';
                const isInterrupted = item.state === 'interrupted';
                const isProgressing = item.state === 'progressing';
                const statusConfig = getStatusConfig(item);
                const FileTypeIcon = getFileIcon(item.fileName);
                const canResume = isInterrupted && item.url;
                const canRetry = (isCancelled || isInterrupted) && item.url;
                
                return (
                  <div 
                    key={item.id} 
                    className="group bg-surface border border-border rounded-xl p-4 transition-all hover:border-border/80 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      {/* File Icon */}
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        statusConfig.bg, statusConfig.color
                      )}>
                        <FileTypeIcon size={24} />
                      </div>

                      {/* Main Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground/90 truncate text-sm" title={item.fileName}>
                              {item.fileName}
                            </h3>
                            <p className="text-xs text-foreground/40 truncate mt-0.5" title={item.url}>
                              {item.url}
                            </p>
                          </div>

                          {/* Remove button */}
                          <button 
                            onClick={() => handleRemoveDownload(item)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-all focus-visible:opacity-100"
                            title="Remove from list"
                            aria-label="Remove download"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Status Line */}
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                          {isDone ? (
                            <span className="text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 size={13} />
                              Completed • {formatBytes(item.totalBytes)}
                            </span>
                          ) : isCancelled ? (
                            <span className="text-red-400 flex items-center gap-1.5">
                              <XCircle size={13} />
                              Cancelled
                              {item.receivedBytes > 0 && ` • ${formatBytes(item.receivedBytes)} downloaded`}
                            </span>
                          ) : isInterrupted ? (
                            <span className="text-amber-400 flex items-center gap-1.5">
                              <AlertTriangle size={13} />
                              Interrupted
                              {item.receivedBytes > 0 && ` • ${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes)}`}
                            </span>
                          ) : isPaused ? (
                            <span className="text-yellow-400 flex items-center gap-1.5">
                              <Pause size={13} />
                              Paused • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}
                            </span>
                          ) : (
                            <>
                              <span className="text-blue-400 flex items-center gap-1.5">
                                <ArrowDownToLine size={13} className="animate-bounce" />
                                {progress}% • {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}
                              </span>
                              {item.speed > 0 && (
                                <span className="text-foreground/50 flex items-center gap-1">
                                  <Zap size={12} />
                                  {formatSpeed(item.speed)}
                                </span>
                              )}
                              {item.speed > 0 && item.totalBytes > 0 && (
                                <span className="text-foreground/40 flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatETA(item.receivedBytes, item.totalBytes, item.speed)}
                                </span>
                              )}
                            </>
                          )}

                          {/* Timestamp */}
                          {item.startTime && (
                            <span className="text-foreground/30 ml-auto hidden sm:block">
                              {formatDate(item.startTime)}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar (for active/paused downloads) */}
                        {!isDone && !isCancelled && (
                          <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden mt-2.5">
                            <div 
                              className={clsx(
                                "h-full transition-all duration-300 rounded-full",
                                isPaused ? "bg-yellow-500" : 
                                isInterrupted ? "bg-amber-500" :
                                "bg-blue-500"
                              )} 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {isProgressing && (
                            <>
                              <button 
                                aria-label="Pause download" 
                                onClick={() => window.electron?.pauseDownload(item.id)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <Pause size={14} />
                                Pause
                              </button>
                              <button 
                                aria-label="Cancel download" 
                                onClick={() => window.electron?.cancelDownload(item.id)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          )}
                          {isPaused && (
                            <>
                              <button 
                                aria-label="Resume download" 
                                onClick={() => window.electron?.resumeDownload(item.id)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <Play size={14} />
                                Resume
                              </button>
                              <button 
                                aria-label="Cancel download" 
                                onClick={() => window.electron?.cancelDownload(item.id)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          )}
                          {canRetry && (
                            <button 
                              aria-label="Retry download" 
                              onClick={() => retryDownload(item.id)} 
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <RotateCw size={14} />
                              Retry
                            </button>
                          )}
                          {isDone && item.path && (
                            <>
                              <button 
                                aria-label="Open file" 
                                onClick={() => window.electron?.openFile(item.path)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <FileIcon size={14} />
                                Open
                              </button>
                              <button 
                                aria-label="Show in folder" 
                                onClick={() => window.electron?.showInFolder(item.path)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <Folder size={14} />
                                Show in Folder
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
