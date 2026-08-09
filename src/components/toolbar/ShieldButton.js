"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import clsx from "clsx";
import { useBrowserStore } from "@/store/useBrowserStore";

export default function ShieldButton({ activePaneTabId, activeTab }) {
  const [shieldBlockedCount, setShieldBlockedCount] = useState(0);
  const [showShieldPopup, setShowShieldPopup] = useState(false);
  const shieldRef = useRef(null);

  const setDropdownOffset = useBrowserStore(state => state.setDropdownOffset);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shieldRef.current && !shieldRef.current.contains(e.target)) {
        setShowShieldPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showShieldPopup) {
      setDropdownOffset(380);
    }
  }, [showShieldPopup, setDropdownOffset]);

  useEffect(() => {
    if (!window.electron?.tabManager?.onAdBlockerStatUpdate) return;
    const cleanup = window.electron.tabManager.onAdBlockerStatUpdate((data) => {
      if (data.tabId === activePaneTabId && data.tab) {
        setShieldBlockedCount(data.tab.ads || 0);
      }
    });
    return cleanup;
  }, [activePaneTabId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShieldBlockedCount(0);
      setShowShieldPopup(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [activePaneTabId]);

  if (activeTab?.url === 'browser://newtab' || activeTab?.url === '') {
    return <div></div>;
  }

  return (
    <div className="relative flex items-center" ref={shieldRef}>
      <span className="text-gray-500 me-1">|</span>
      <button
        onClick={(e) => {
          if (window.electron && window.electron.tabManager && window.electron.tabManager.openPopup) {
            const rect = e.currentTarget.getBoundingClientRect();
            const popupWidth = 360;
            const popupHeight = 460;
            const x = Math.round(window.screenX + rect.right - popupWidth);
            const y = Math.round(window.screenY + rect.bottom + 8);
            
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const urlParam = activeTab?.url ? `&url=${encodeURIComponent(activeTab.url)}` : '';
            const popupUrl = `${baseUrl}/popup?type=shield&tabId=${activePaneTabId}${urlParam}`;

            window.electron.tabManager.openPopup({
              url: popupUrl,
              width: popupWidth,
              height: popupHeight,
              x,
              y
            });
          }
        }}
        className={clsx(
          "relative mr-2 transition-colors p-1 rounded-full hover:bg-foreground/10",
          showShieldPopup ? "text-emerald-400" : "text-foreground/50 hover:text-foreground"
        )}
        title="Verse Shield — Ad & Tracker Blocker"
        aria-label="Verse Shield"
        aria-haspopup="dialog"
        aria-expanded={showShieldPopup}
      >
        <Image src="/favicon.png" alt="Verse Shield" width={20} height={20} className="w-5 h-5" />
        {shieldBlockedCount > 0 && !showShieldPopup && (
          <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow-sm">
            {shieldBlockedCount > 99 ? '99+' : shieldBlockedCount}
          </span>
        )}
      </button>
    </div>
  );
}
