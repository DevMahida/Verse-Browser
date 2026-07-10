"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from "zustand/react/shallow";

export default function ExtensionsPage() {
  const { installedExtensions, toggleExtension, uninstallExtension, openExtensionStoreTab } = useBrowserStore(
    useShallow((state) => ({
      installedExtensions: state.installedExtensions,
      toggleExtension: state.toggleExtension,
      uninstallExtension: state.uninstallExtension,
      openExtensionStoreTab: state.openExtensionStoreTab,
    }))
  );

  return (
    <div className="w-full h-full bg-background text-foreground overflow-y-auto p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.07 4.93a10 10 0 0 0-14.14 0l1.42 1.41a8 8 0 1 1 11.3 11.31l1.42 1.42a10 10 0 0 0 0-14.14z"></path>
              <path d="m8 16 1.41-1.41"></path>
              <path d="m14 10 1.41-1.41"></path>
              <path d="m16 8 1.41-1.41"></path>
              <path d="m10 14 1.41-1.41"></path>
            </svg>
            Extensions
          </h1>
          <button 
            onClick={openExtensionStoreTab}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Explore More Extensions
          </button>
        </div>

        {installedExtensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="text-gray-500 mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <h2 className="text-xl font-medium text-foreground/80 mb-2">No extensions installed</h2>
            <p className="text-gray-500 mb-6">Enhance your browser with powerful native features.</p>
            <button 
              onClick={openExtensionStoreTab}
              className="px-6 py-2.5 bg-surface hover:bg-surface-hover text-foreground border border-border rounded-md transition-colors"
            >
              Open Extension Store
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedExtensions.map(ext => (
              <div key={ext.id} className={`bg-surface border ${ext.isEnabled ? 'border-border' : 'border-border opacity-60'} rounded-lg p-5 flex flex-col transition-all`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{ext.icon || "🧩"}</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={ext.isEnabled} 
                      onChange={() => toggleExtension(ext.id)} 
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <h3 className="text-lg font-semibold mb-1 truncate">{ext.name}</h3>
                <p className="text-foreground/70 mb-4 grow text-sm leading-relaxed">{ext.description}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${ext.isEnabled ? 'bg-blue-900/30 text-blue-400' : 'bg-surface-hover text-foreground/70'}`}>
                    {ext.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button 
                    onClick={() => uninstallExtension(ext.id)}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
