"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import clsx from "clsx";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';

export default function DownloadIndicator() {
  const downloads = useBrowserStore(state => state.downloads);
  
  const [downloadAnimate, setDownloadAnimate] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  const [downloadJustFinished, setDownloadJustFinished] = useState(false);
  const prevCompletedCount = useRef(0);
  const downloadsRef = useRef(null);

  const setDropdownOffset = useBrowserStore(state => state.setDropdownOffset);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadsRef.current && !downloadsRef.current.contains(e.target)) {
        setShowDownloadsPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDownloadsPopup) {
      setDropdownOffset(420);
    } else {
      setDropdownOffset(0); // This might conflict with others in NavigationBar, need to coordinate, but for now we simplify.
    }
  }, [showDownloadsPopup, setDropdownOffset]);

  useEffect(() => {
    if (!downloads) return;

    const completedCount = downloads.filter(d => d.state === 'completed').length;
    if (completedCount > prevCompletedCount.current) {
      setDownloadAnimate(true);
      setShowDownloadsPopup(true);
      setDownloadJustFinished(true);

      const hideTimer = setTimeout(() => {
        setShowDownloadsPopup(false);
        setDownloadJustFinished(false);
      }, 3000);

      const animTimer = setTimeout(() => setDownloadAnimate(false), 300);

      prevCompletedCount.current = completedCount;
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(animTimer);
      };
    }

    prevCompletedCount.current = completedCount;
  }, [downloads]);

  const hasActiveDownloads = (downloads || []).some(d => d.state === 'progressing' || d.state === 'paused' || d.state === 'interrupted');
  const showDownloadBtn = hasActiveDownloads || downloadJustFinished || showDownloadsPopup;

  if (!showDownloadBtn) return null;

  const activeDownload = (downloads || []).find(d => d.state === 'progressing');
  const pausedDownload = !activeDownload ? (downloads || []).find(d => d.state === 'paused') : null;
  const interruptedDownload = !activeDownload && !pausedDownload ? (downloads || []).find(d => d.state === 'interrupted') : null;
  const indicatorDownload = activeDownload || pausedDownload;
  const downloadProgress = indicatorDownload && indicatorDownload.totalBytes > 0
    ? (indicatorDownload.receivedBytes / indicatorDownload.totalBytes) * 100
    : 0;

  return (
    <div className="relative hidden lg:flex" ref={downloadsRef}>
      <button
        onClick={(e) => {
          if (window.electron && window.electron.tabManager && window.electron.tabManager.openPopup) {
            const rect = e.currentTarget.getBoundingClientRect();
            const popupWidth = 400; // max-w-md
            const popupHeight = 500;
            const x = Math.round(window.screenX + rect.right - popupWidth);
            const y = Math.round(window.screenY + rect.bottom + 8);
            
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const popupUrl = `${baseUrl}/popup?type=downloads`;

            window.electron.tabManager.openPopup({
              url: popupUrl,
              width: popupWidth,
              height: popupHeight,
              x,
              y
            });
          }
        }}
        aria-label="Downloads"
        aria-haspopup="dialog"
        className={clsx(
          "relative p-2 rounded-full hover:bg-foreground/10 hover:text-foreground transition-colors min-w-10 min-h-10 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
          downloadAnimate && "animate-in zoom-in-90 duration-200"
        )}
        title="Downloads"
      >
        {indicatorDownload && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="16" fill="none" className="stroke-foreground/10" strokeWidth="2.5" />
            <circle
              cx="22" cy="22" r="16"
              fill="none"
              className={clsx(
                "transition-all duration-300 ease-out",
                pausedDownload ? "stroke-yellow-500" : "stroke-accent"
              )}
              strokeWidth="2.5"
              strokeDasharray={100.5}
              strokeDashoffset={100.5 - (downloadProgress / 100) * 100.5}
              strokeLinecap="round"
            />
          </svg>
        )}
        {interruptedDownload && !indicatorDownload && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-surface" />
        )}
        <Download size={18} className={clsx(
          activeDownload ? "text-accent" : 
          pausedDownload ? "text-yellow-500" : 
          interruptedDownload ? "text-amber-500" : ""
        )} />
      </button>
    </div>
  );
}
