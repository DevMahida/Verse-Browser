"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from "zustand/react/shallow";
import { Check, MonitorSmartphone, ShieldAlert, X } from "lucide-react";

export default function SettingsPage() {
  const { 
    bookmarkBarVisibility, 
    setBookmarkBarVisibility, 
    downloadSettings, 
    updateDownloadSettings,
    sessionPermissions,
    revokePermission,
    clearSessionPermissions
  } = useBrowserStore(
    useShallow((state) => ({
      bookmarkBarVisibility: state.bookmarkBarVisibility,
      setBookmarkBarVisibility: state.setBookmarkBarVisibility,
      downloadSettings: state.downloadSettings,
      updateDownloadSettings: state.updateDownloadSettings,
      sessionPermissions: state.sessionPermissions,
      revokePermission: state.revokePermission,
      clearSessionPermissions: state.clearSessionPermissions,
    }))
  );

  const handleSelectFolder = async () => {
    if (window.electron) {
      const path = await window.electron.selectDownloadFolder();
      if (path) {
        updateDownloadSettings({ defaultPath: path });
      }
    }
  };

  return (
    <div className="w-full h-full bg-background text-foreground overflow-y-auto flex justify-center py-10 font-sans">
      <div className="w-full max-w-3xl px-8">
        
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-full">
            <MonitorSmartphone size={24} />
          </div>
          <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-semibold">Settings</h1>
        </div>
        
        {/* Appearance Section */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-foreground/90 mb-4 border-b border-border pb-2">Appearance</h2>
          
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-foreground">Bookmarks Bar</p>
                <p className="text-sm text-foreground/70 mt-1">Choose when the bookmarks bar is visible</p>
              </div>
            </div>
            
            <div className="p-2 flex flex-col space-y-1 bg-background">
              <button 
                onClick={() => setBookmarkBarVisibility('always')}
                className="w-full text-left px-4 py-3 rounded-lg flex items-center justify-between hover:bg-foreground/10 transition-colors cursor-pointer"
              >
                <span className="text-sm text-foreground/90">Always show</span>
                {bookmarkBarVisibility === 'always' && <Check size={18} className="text-blue-500" />}
              </button>
              <button 
                onClick={() => setBookmarkBarVisibility('new-tab')}
                className="w-full text-left px-4 py-3 rounded-lg flex items-center justify-between hover:bg-foreground/10 transition-colors cursor-pointer"
              >
                <span className="text-sm text-foreground/90">Only show on New Tab</span>
                {bookmarkBarVisibility === 'new-tab' && <Check size={18} className="text-blue-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* Downloads Section */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-foreground/90 mb-4 border-b border-border pb-2">Downloads</h2>
          
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Default Download Location</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={downloadSettings.defaultPath}
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground/80 focus:outline-none"
                    />
                    <button 
                      onClick={handleSelectFolder}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      Change Location
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={downloadSettings.askEveryTime}
                    onChange={(e) => updateDownloadSettings({ askEveryTime: e.target.checked })}
                    className="w-4 h-4 rounded border-border/60 bg-background text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground group-hover:text-foreground/90 transition-colors">Ask where to save each file before downloading</span>
                    <p className="text-xs text-foreground/70 mt-1">If unchecked, files will automatically save to your default location.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Site Settings Section */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-foreground/90 mb-4 border-b border-border pb-2 flex items-center gap-2">
            <ShieldAlert size={18} />
            Site Settings (Current Session)
          </h2>
          
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {Object.keys(sessionPermissions).length === 0 ? (
              <div className="px-5 py-6 text-center text-foreground/50 text-sm">
                No active site permissions for this session.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {Object.entries(sessionPermissions).map(([origin, perms]) => (
                  <div key={origin} className="p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-foreground/90">{origin}</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(perms).map(([perm, status]) => (
                        <div key={perm} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full text-xs">
                          <span className="capitalize">{perm}:</span>
                          <span className={status === 'granted' ? 'text-green-500' : 'text-red-500'}>
                            {status}
                          </span>
                          <button
                            onClick={() => revokePermission(origin, perm)}
                            className="ml-1 text-foreground/40 hover:text-red-400 transition-colors"
                            title={`Revoke ${perm}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-background border-t border-border flex justify-end">
                  <button 
                    onClick={clearSessionPermissions}
                    className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors text-sm font-medium"
                  >
                    Clear All Session Permissions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
