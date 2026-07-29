"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";

const AVAILABLE_EXTENSIONS = [
  {
    id: "ext-color-picker",
    name: "Color Auto-Picker",
    description: "Click any pixel on the screen to instantly copy its exact HEX color code to your clipboard.",
    icon: "🎨",
    category: "Design",
  },
  {
    id: "ext-dark-mode",
    name: "Universal Dark Mode",
    description: "Force a dark theme on every website you visit by intelligently inverting colors on bright pages.",
    icon: "🌙",
    category: "Design",
  },
  {
    id: "ext-ad-blocker",
    name: "Verse Shield (Ad Blocker)",
    description: "Built-in network interceptor that blocks ads and trackers instantly before they even load.",
    icon: "🛡️",
    category: "Privacy",
  },
  {
    id: "ext-web-clipper",
    name: "Sidebar Notes",
    description: "Highlight text on a webpage, right-click, and save it to a permanent notebook in your sidebar.",
    icon: "📝",
    category: "Productivity",
  },
  {
    id: "ext-pip",
    name: "Picture-in-Picture",
    description: "Pop out a video from a tab into a floating, resizable window that stays on top of your screen.",
    icon: "🖼️",
    category: "Media",
  },
  {
    id: "ext-password-manager",
    name: "Vault (Password Manager)",
    description: "A secure, encrypted page to manage logins and auto-fill your usernames and passwords.",
    icon: "🔑",
    category: "Privacy",
  }
];

export default function ExtensionStorePage() {
  const { installedExtensions, installExtension, openExtensionsTab } = useBrowserStore(
    useShallow((state) => ({
      installedExtensions: state.installedExtensions,
      installExtension: state.installExtension,
      openExtensionsTab: state.openExtensionsTab,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredExtensions = AVAILABLE_EXTENSIONS.filter(ext => 
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isInstalled = (id) => installedExtensions.some(e => e.id === id);

  return (
    <div className="w-full h-full bg-background text-foreground overflow-y-auto p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M2 15h10"></path>
                <path d="m9 18 3-3-3-3"></path>
              </svg>
              Extension Store
            </h1>
            <p className="text-foreground/70">Discover and install native features to enhance your browsing experience.</p>
          </div>
          
          <button 
            onClick={openExtensionsTab}
            className="px-4 py-2 bg-surface hover:bg-surface-hover text-foreground border border-border rounded-md transition-colors text-sm font-medium whitespace-nowrap"
          >
            Manage My Extensions
          </button>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search for extensions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
          />
        </div>

        {/* Grid */}
        {filteredExtensions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No extensions found matching &quot;{searchQuery}&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExtensions.map(ext => {
              const installed = isInstalled(ext.id);
              
              return (
                <div key={ext.id} className="bg-surface border border-border rounded-xl p-6 flex flex-col hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-surface-hover/50 rounded-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {ext.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate">{ext.name}</h3>
                      <span className="inline-block px-2 py-0.5 mt-1 bg-surface-hover text-foreground/70 text-xs rounded-full font-medium">
                        {ext.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground/70 mb-6 grow leading-relaxed">
                    {ext.description}
                  </p>
                  
                  <button 
                    onClick={() => !installed && installExtension(ext)}
                    disabled={installed}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      installed 
                        ? 'bg-surface-hover text-foreground/70 cursor-not-allowed border border-border/80' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    }`}
                  >
                    {installed ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Installed
                      </>
                    ) : 'Install Feature'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
