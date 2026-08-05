"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, ShieldOff, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Lock, Fingerprint, Cookie, Zap } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import clsx from "clsx";

const LEVEL_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'disabled', label: 'Disabled' },
];

const COOKIE_OPTIONS = [
  { value: 'cross-site', label: 'Cross-site only' },
  { value: 'all', label: 'Block all' },
  { value: 'disabled', label: 'Disabled' },
];

function SelectDropdown({ value, options, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={clsx(
        "bg-surface-hover border border-border rounded-md px-2 py-1 text-xs font-medium text-foreground outline-none cursor-pointer transition-colors",
        "hover:border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function VerseShieldPopup({ url, initialStats, tabId, onClose, isStandalone }) {
  const popupRef = useRef(null);
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showReloadHint, setShowReloadHint] = useState(false);
  const [stats, setStats] = useState(() => initialStats || { ads: 0, fingerprints: 0, httpUpgrades: 0 });
  const [siteSettings, setSiteSettings] = useState({
    enabled: true,
    trackingLevel: 'standard',
    fingerprintLevel: 'standard',
    cookieLevel: 'cross-site',
    httpsUpgrade: true,
  });

  let hostname = '';
  try { hostname = new URL(url).hostname; } catch {}

  const isInternalPage = !url || url.startsWith('browser://') || url.startsWith('file://') || url.startsWith('verse://');

  // Load site settings and current tab stats from backend on mount
  useEffect(() => {
    if (!hostname || isInternalPage) return;
    
    if (window.electron?.tabManager?.shield?.getStatus) {
      window.electron.tabManager.shield.getStatus({ hostname, tabId }).then((res) => {
        if (res) {
          setShieldEnabled(res.enabled);
          setStats({ ...res.counts, httpUpgrades: 0 });
        }
      }).catch(() => {});
    }
  }, [hostname, isInternalPage, tabId]);

  // Listen for live stat updates while popup is open
  useEffect(() => {
    if (!window.electron?.tabManager || isInternalPage) return;

    const cleanup = window.electron.tabManager.onAdBlockerStatUpdate((data) => {
      if (data.tabId === tabId) {
        setStats({
          ads: data.tab.ads || 0,
          fingerprints: data.tab.fingerprints || 0,
          httpUpgrades: data.tab.httpUpgrades || 0
        });
      }
    });

    return cleanup;
  }, [tabId, isInternalPage]);

  // Auto-resize native popup window
  useEffect(() => {
    if (!isStandalone || !window.electron?.tabManager?.resizePopup || !popupRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (popupRef.current) {
        const height = popupRef.current.getBoundingClientRect().height;
        if (height > 0) {
          window.electron.tabManager.resizePopup({ width: 360, height: height });
        }
      }
    });
    
    resizeObserver.observe(popupRef.current);
    return () => resizeObserver.disconnect();
  }, [isStandalone]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleToggleShield = () => {
    const newEnabled = !shieldEnabled;
    setShieldEnabled(newEnabled);
    setSiteSettings(prev => ({ ...prev, enabled: newEnabled }));
    setShowReloadHint(true);

    if (window.electron?.tabManager?.shield?.setForSite) {
      window.electron.tabManager.shield.setForSite(hostname, newEnabled);
    }
  };

  const handleLevelChange = (category, level) => {
    setSiteSettings(prev => ({ ...prev, [category]: level }));
    setShowReloadHint(true);

    if (window.electron?.tabManager?.shield?.setSetting) {
      window.electron.tabManager.shield.setSetting(hostname, category, level);
    }
  };

  const handleReload = () => {
    if (window.electron?.tabManager) {
      window.electron.tabManager.action({ tabId, action: 'reload' });
    }
    onClose();
  };

  const totalBlocked = stats.ads + stats.fingerprints + stats.httpUpgrades;

  if (isInternalPage) {
    return (
      <div ref={popupRef} className={clsx("bg-surface border border-border shadow-2xl p-4", !isStandalone ? "absolute top-9 left-0 w-80 rounded-xl z-50" : "w-full rounded-none")}>
        <div className="flex items-center space-x-2 text-foreground/70">
          <Shield size={18} />
          <span className="text-sm">Verse Shield is not available for internal pages.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={popupRef}
      className={clsx(
        "bg-surface/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden text-foreground animate-in fade-in slide-in-from-top-1 duration-150",
        !isStandalone ? "absolute top-9 -left-60 w-[320px] rounded-xl z-50" : "w-full h-max rounded-none"
      )}
    >
      {/* ─── Header: Domain + Shield Toggle ─── */}
      <div className={clsx(
        "px-4 py-3 border-b border-border transition-colors",
        shieldEnabled ? "bg-emerald-950/20" : "bg-surface-hover/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors p-1 border",
              shieldEnabled ? "bg-emerald-500/15 border-emerald-500/30" : "bg-gray-500/15 border-gray-500/20"
            )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.png"
                alt="Verse Logo"
                className={clsx(
                  "w-5 h-5 object-contain transition-all",
                  shieldEnabled ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] scale-100" : "grayscale opacity-40 scale-95"
                )}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{hostname}</p>
              <p className={clsx(
                "text-[11px] font-medium",
                shieldEnabled ? "text-emerald-400" : "text-foreground/50"
              )}>
                {shieldEnabled ? 'Shields are UP' : 'Shields are DOWN'}
              </p>
            </div>
          </div>

          {/* Master toggle */}
          <button
            onClick={handleToggleShield}
            className={clsx(
              "relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0",
              shieldEnabled ? "bg-emerald-500" : "bg-gray-600"
            )}
            aria-label={shieldEnabled ? "Disable shields for this site" : "Enable shields for this site"}
          >
            <span className={clsx(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200",
              shieldEnabled ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>
      </div>

      {/* ─── Stats Section ─── */}
      <div className="px-4 py-3 space-y-2.5">
        {shieldEnabled ? (
          <>
            <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
              Blocked on this page
            </p>

            <div className="space-y-1.5">
              <StatRow
                icon={<Shield size={14} />}
                label="Ads & Trackers"
                count={stats.ads}
                color="text-orange-400"
                bgColor="bg-orange-400/10"
              />
              <StatRow
                icon={<Fingerprint size={14} />}
                label="Fingerprinting"
                count={stats.fingerprints}
                color="text-purple-400"
                bgColor="bg-purple-400/10"
              />
              <StatRow
                icon={<Lock size={14} />}
                label="HTTPS Upgrades"
                count={stats.httpUpgrades}
                color="text-blue-400"
                bgColor="bg-blue-400/10"
              />
            </div>

            {totalBlocked > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ads & Trackers Blocked</span>
                <span className="font-semibold text-foreground">{stats.ads}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-4 text-center space-y-2">
            <ShieldOff size={28} className="text-foreground/30" />
            <p className="text-sm text-foreground/60">Shields are down for this site</p>
            <p className="text-xs text-foreground/40">All ads, trackers, and scripts are allowed</p>
          </div>
        )}
      </div>

      {/* ─── Advanced Controls Toggle ─── */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-foreground/70 hover:bg-foreground/5 transition-colors"
        >
          <span>Advanced Controls</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* ─── Advanced Panel ─── */}
        {showAdvanced && (
          <div className="px-4 pb-3 space-y-3 animate-in slide-in-from-top-1 duration-150">
            <AdvancedRow
              icon={<Zap size={14} className="text-orange-400" />}
              label="Trackers & Ads"
              value={siteSettings.trackingLevel}
              options={LEVEL_OPTIONS}
              onChange={(v) => handleLevelChange('trackingLevel', v)}
              disabled={!shieldEnabled}
            />
            <AdvancedRow
              icon={<Fingerprint size={14} className="text-purple-400" />}
              label="Fingerprinting"
              value={siteSettings.fingerprintLevel}
              options={LEVEL_OPTIONS}
              onChange={(v) => handleLevelChange('fingerprintLevel', v)}
              disabled={!shieldEnabled}
            />
            <AdvancedRow
              icon={<Cookie size={14} className="text-amber-400" />}
              label="Cookie Blocking"
              value={siteSettings.cookieLevel}
              options={COOKIE_OPTIONS}
              onChange={(v) => handleLevelChange('cookieLevel', v)}
              disabled={!shieldEnabled}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-foreground/80">
                <Lock size={14} className="text-blue-400" />
                <span className="text-xs font-medium">HTTPS Upgrade</span>
              </div>
              <button
                onClick={() => handleLevelChange('httpsUpgrade', !siteSettings.httpsUpgrade)}
                disabled={!shieldEnabled}
                className={clsx(
                  "relative w-8 h-4.5 rounded-full transition-colors duration-200 cursor-pointer",
                  siteSettings.httpsUpgrade && shieldEnabled ? "bg-blue-500" : "bg-gray-600",
                  !shieldEnabled && "opacity-40 cursor-not-allowed"
                )}
              >
                <span className={clsx(
                  "absolute top-[1px] left-[1px] w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200",
                  siteSettings.httpsUpgrade && shieldEnabled ? "translate-x-3.5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Reload Hint Banner ─── */}
      {showReloadHint && (
        <div className="px-4 py-2 bg-emerald-500/15 border-t border-emerald-500/30 flex items-center justify-between animate-in fade-in duration-150">
          <span className="text-[11px] text-emerald-400 font-medium">⚡ Reload page to apply changes</span>
          <button
            onClick={handleReload}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw size={11} />
            <span>Reload</span>
          </button>
        </div>
      )}

      {/* ─── Footer ─── */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={handleReload}
          className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          <RefreshCw size={12} />
          <span>Reload page</span>
        </button>
        <button
          onClick={onClose}
          className="text-xs text-foreground/50 hover:text-foreground/80 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StatRow({ icon, label, count, color, bgColor }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className={clsx("w-6 h-6 rounded flex items-center justify-center", bgColor, color)}>
          {icon}
        </div>
        <span className="text-xs text-foreground/80">{label}</span>
      </div>
      <span className={clsx("text-sm font-bold tabular-nums", count > 0 ? color : "text-foreground/30")}>
        {count}
      </span>
    </div>
  );
}

function AdvancedRow({ icon, label, value, options, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 text-foreground/80">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <SelectDropdown value={value} options={options} onChange={onChange} disabled={disabled} />
    </div>
  );
}
