(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/store/useBrowserStore.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatUrl",
    ()=>formatUrl,
    "useBrowserStore",
    ()=>useBrowserStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const formatUrl = (input)=>{
    if (!input) return 'browser://newtab';
    // Check if it's already a valid URL
    try {
        new URL(input);
        return input;
    } catch (e) {
        // If it has a dot and no spaces, assume it's a domain
        if (input.includes('.') && !input.includes(' ')) {
            return `https://${input}`;
        }
        // Otherwise, it's a search query
        return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
};
const useBrowserStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        history: [],
        bookmarks: [],
        bookmarkBarVisibility: 'always',
        installedExtensions: [],
        downloads: [],
        hiddenTopSites: [],
        downloadSettings: {
            defaultPath: '',
            askEveryTime: false
        },
        sessionPermissions: {},
        activePermissionRequests: [],
        isLoggedIn: false,
        userProfilePic: null,
        currentUser: null,
        accounts: [],
        tabs: [
            {
                id: '1',
                title: 'New Tab',
                url: 'browser://newtab',
                favicon: null,
                isLoading: false,
                canGoBack: false,
                canGoForward: false,
                error: null,
                fallbackForwardUrl: null,
                isPlayingAudio: false,
                isMuted: false,
                isPinned: false
            }
        ],
        activeTabId: '1',
        // AI Sidebar State
        isAISidebarOpen: false,
        openRouterApiKey: '',
        setOpenRouterApiKey: (key)=>set({
                openRouterApiKey: key
            }),
        // Split View State
        splitTabId: null,
        focusedPane: 'primary',
        setSplitTabId: (id)=>set({
                splitTabId: id,
                focusedPane: 'secondary'
            }),
        clearSplitView: ()=>set({
                splitTabId: null,
                focusedPane: 'primary'
            }),
        setFocusedPane: (pane)=>set({
                focusedPane: pane
            }),
        // Dragging State
        isDraggingTab: false,
        setIsDraggingTab: (isDragging)=>set({
                isDraggingTab: isDragging
            }),
        // Theme State
        theme: 'dark',
        toggleTheme: ()=>set((state)=>({
                    theme: state.theme === 'dark' ? 'light' : 'dark'
                })),
        // Actions
        navigate: (id, input)=>set((state)=>{
                const finalUrl = formatUrl(input);
                return {
                    tabs: state.tabs.map((tab)=>tab.id === id ? {
                            ...tab,
                            url: finalUrl,
                            title: finalUrl
                        } : tab)
                };
            }),
        addTab: (url = 'browser://newtab', title = 'New Tab', afterTabId = null)=>set((state)=>{
                const newId = Date.now().toString();
                const newTab = {
                    id: newId,
                    title,
                    url,
                    favicon: null,
                    isLoading: false,
                    canGoBack: false,
                    canGoForward: false,
                    error: null,
                    fallbackForwardUrl: null,
                    isPlayingAudio: false,
                    isMuted: false,
                    isPinned: false
                };
                if (afterTabId) {
                    const idx = state.tabs.findIndex((t)=>t.id === afterTabId);
                    if (idx !== -1) {
                        const newTabs = [
                            ...state.tabs
                        ];
                        newTabs.splice(idx + 1, 0, newTab);
                        return {
                            tabs: newTabs,
                            activeTabId: newId
                        };
                    }
                }
                return {
                    tabs: [
                        ...state.tabs,
                        newTab
                    ],
                    activeTabId: newId
                };
            }),
        removeTab: (id)=>set((state)=>{
                const newTabs = state.tabs.filter((tab)=>tab.id !== id);
                if (newTabs.length === 0) {
                    // If there are other windows open, close this window instead of opening a new tab
                    if (window.electron?.getWindowCount) {
                        window.electron.getWindowCount().then((count)=>{
                            if (count > 1) {
                                window.electron.close();
                            }
                        });
                    }
                    // Meanwhile, create a new tab as fallback (will be invisible if window closes)
                    const newId = Date.now().toString();
                    return {
                        tabs: [
                            {
                                id: newId,
                                title: 'New Tab',
                                url: 'browser://newtab',
                                favicon: null,
                                isLoading: false,
                                canGoBack: false,
                                canGoForward: false,
                                error: null,
                                fallbackForwardUrl: null,
                                isPlayingAudio: false,
                                isMuted: false,
                                isPinned: false
                            }
                        ],
                        activeTabId: newId
                    };
                }
                let newActiveId = state.activeTabId;
                let newSplitId = state.splitTabId;
                let newFocusedPane = state.focusedPane;
                if (state.splitTabId === id) {
                    newSplitId = null;
                    newFocusedPane = 'primary';
                }
                if (state.activeTabId === id) {
                    if (newSplitId) {
                        newActiveId = newSplitId;
                        newSplitId = null;
                        newFocusedPane = 'primary';
                    } else {
                        const closedIndex = state.tabs.findIndex((tab)=>tab.id === id);
                        const safeIndex = Math.min(closedIndex, newTabs.length - 1);
                        const nextActive = newTabs[Math.max(0, safeIndex)];
                        newActiveId = nextActive.id;
                    }
                }
                return {
                    tabs: newTabs,
                    activeTabId: newActiveId,
                    splitTabId: newSplitId,
                    focusedPane: newFocusedPane
                };
            }),
        // Merge tabs received from another window into this one
        mergeTabs: (incomingTabs)=>set((state)=>{
                // Give each incoming tab a new unique ID to avoid collisions
                const newTabs = incomingTabs.map((t)=>({
                        ...t,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
                    }));
                return {
                    tabs: [
                        ...state.tabs,
                        ...newTabs
                    ],
                    activeTabId: newTabs[newTabs.length - 1].id
                };
            }),
        setActiveTab: (id)=>set({
                activeTabId: id
            }),
        updateTab: (id, updates)=>set((state)=>({
                    tabs: state.tabs.map((tab)=>tab.id === id ? {
                            ...tab,
                            ...updates
                        } : tab)
                })),
        toggleMute: (id)=>set((state)=>({
                    tabs: state.tabs.map((tab)=>tab.id === id ? {
                            ...tab,
                            isMuted: !tab.isMuted
                        } : tab)
                })),
        removeMultipleTabs: (ids)=>set((state)=>{
                const idsToRemove = new Set(ids);
                let newTabs = state.tabs.filter((t)=>!idsToRemove.has(t.id));
                if (newTabs.length === 0) {
                    if (window.electron?.getWindowCount) {
                        window.electron.getWindowCount().then((count)=>{
                            if (count > 1) {
                                window.electron.close();
                            }
                        });
                    }
                    const newId = Date.now().toString();
                    newTabs = [
                        {
                            id: newId,
                            title: 'New Tab',
                            url: 'browser://newtab',
                            favicon: null,
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            error: null,
                            fallbackForwardUrl: null,
                            isPlayingAudio: false,
                            isMuted: false,
                            isPinned: false
                        }
                    ];
                    return {
                        tabs: newTabs,
                        activeTabId: newId,
                        splitTabId: null,
                        focusedPane: 'primary'
                    };
                }
                let newActiveId = state.activeTabId;
                let newSplitId = state.splitTabId;
                let newFocusedPane = state.focusedPane;
                if (idsToRemove.has(state.splitTabId)) {
                    newSplitId = null;
                    newFocusedPane = 'primary';
                }
                if (idsToRemove.has(state.activeTabId)) {
                    if (newSplitId) {
                        newActiveId = newSplitId;
                        newSplitId = null;
                        newFocusedPane = 'primary';
                    } else {
                        newActiveId = newTabs[Math.max(0, newTabs.length - 1)].id;
                    }
                }
                return {
                    tabs: newTabs,
                    activeTabId: newActiveId,
                    splitTabId: newSplitId,
                    focusedPane: newFocusedPane
                };
            }),
        togglePin: (id)=>set((state)=>{
                let newTabs = state.tabs.map((tab)=>tab.id === id ? {
                        ...tab,
                        isPinned: !tab.isPinned
                    } : tab);
                // Move unpinned tab to the right of all pinned tabs, or pinned tab to the right of all pinned tabs
                const targetTab = newTabs.find((t)=>t.id === id);
                newTabs = newTabs.filter((t)=>t.id !== id);
                if (targetTab.isPinned) {
                    // Find the index of the first unpinned tab to insert before it
                    let insertIdx = newTabs.findIndex((t)=>!t.isPinned);
                    if (insertIdx === -1) insertIdx = newTabs.length;
                    newTabs.splice(insertIdx, 0, targetTab);
                } else {
                    // Find the index of the first unpinned tab to insert before it, but it's now unpinned so it goes after pinned tabs
                    let insertIdx = newTabs.findIndex((t)=>!t.isPinned);
                    if (insertIdx === -1) insertIdx = newTabs.length;
                    newTabs.splice(insertIdx, 0, targetTab);
                }
                return {
                    tabs: newTabs
                };
            }),
        reorderTabs: (oldIndex, newIndex)=>set((state)=>{
                const newTabs = [
                    ...state.tabs
                ];
                const movedTab = newTabs[oldIndex];
                const targetTab = newTabs[newIndex];
                // Prevent dragging pinned tabs into unpinned area and vice versa
                if (movedTab.isPinned !== targetTab.isPinned) {
                    return state;
                }
                newTabs.splice(oldIndex, 1);
                newTabs.splice(newIndex, 0, movedTab);
                return {
                    tabs: newTabs
                };
            }),
        toggleAISidebar: ()=>set((state)=>({
                    isAISidebarOpen: !state.isAISidebarOpen
                })),
        setAISidebarOpen: (isOpen)=>set({
                isAISidebarOpen: isOpen
            }),
        openHistoryTab: ()=>set((state)=>{
                const existingHistoryTab = state.tabs.find((t)=>t.url === 'browser://history');
                if (existingHistoryTab) {
                    return {
                        activeTabId: existingHistoryTab.id
                    };
                }
                const newId = Date.now().toString();
                return {
                    tabs: [
                        ...state.tabs,
                        {
                            id: newId,
                            title: 'History',
                            url: 'browser://history',
                            favicon: null,
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            error: null,
                            fallbackForwardUrl: null,
                            isPlayingAudio: false,
                            isMuted: false,
                            isPinned: false
                        }
                    ],
                    activeTabId: newId
                };
            }),
        openExtensionsTab: ()=>set((state)=>{
                const existingTab = state.tabs.find((t)=>t.url === 'browser://extensions');
                if (existingTab) return {
                    activeTabId: existingTab.id
                };
                const newId = Date.now().toString();
                return {
                    tabs: [
                        ...state.tabs,
                        {
                            id: newId,
                            title: 'Extensions',
                            url: 'browser://extensions',
                            favicon: null,
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            error: null,
                            fallbackForwardUrl: null,
                            isPlayingAudio: false,
                            isMuted: false,
                            isPinned: false
                        }
                    ],
                    activeTabId: newId
                };
            }),
        openSettingsTab: ()=>set((state)=>{
                const existingTab = state.tabs.find((t)=>t.url === 'browser://settings');
                if (existingTab) return {
                    activeTabId: existingTab.id
                };
                const newId = Date.now().toString();
                return {
                    tabs: [
                        ...state.tabs,
                        {
                            id: newId,
                            title: 'Settings',
                            url: 'browser://settings',
                            favicon: null,
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            error: null,
                            fallbackForwardUrl: null,
                            isPlayingAudio: false,
                            isMuted: false,
                            isPinned: false
                        }
                    ],
                    activeTabId: newId
                };
            }),
        openExtensionStoreTab: ()=>set((state)=>{
                const existingTab = state.tabs.find((t)=>t.url === 'browser://store');
                if (existingTab) return {
                    activeTabId: existingTab.id
                };
                const newId = Date.now().toString();
                return {
                    tabs: [
                        ...state.tabs,
                        {
                            id: newId,
                            title: 'Extension Store',
                            url: 'browser://store',
                            favicon: null,
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            error: null,
                            fallbackForwardUrl: null,
                            isPlayingAudio: false,
                            isMuted: false,
                            isPinned: false
                        }
                    ],
                    activeTabId: newId
                };
            }),
        openDownloadsTab: ()=>set((state)=>{
                const existingTab = state.tabs.find((t)=>t.url === 'browser://downloads');
                if (existingTab) {
                    return {
                        activeTabId: existingTab.id
                    };
                }
                const newId = Date.now().toString();
                return {
                    tabs: [
                        ...state.tabs,
                        {
                            id: newId,
                            title: 'Downloads',
                            url: 'browser://downloads',
                            favicon: null,
                            isLoading: false,
                            canGoBack: false,
                            canGoForward: false,
                            error: null,
                            fallbackForwardUrl: null,
                            isPlayingAudio: false,
                            isMuted: false,
                            isPinned: false
                        }
                    ],
                    activeTabId: newId
                };
            }),
        // History Actions
        addToHistory: (url)=>set((state)=>{
                // Ignore internal browser pages
                if (url.startsWith('browser://')) return state;
                const newEntry = {
                    id: Date.now().toString(),
                    url,
                    title: url,
                    timestamp: Date.now()
                };
                // Check if the latest entry is the same URL to prevent rapid duplicates
                if (state.history.length > 0 && state.history[0].url === url) {
                    return state;
                }
                return {
                    history: [
                        newEntry,
                        ...state.history
                    ].slice(0, 500) // Keep last 500 entries
                };
            }),
        updateHistoryTitle: (url, title)=>set((state)=>{
                // Update the title of the most recent history entry for this URL
                const newHistory = [
                    ...state.history
                ];
                const index = newHistory.findIndex((entry)=>entry.url === url);
                if (index !== -1) {
                    newHistory[index] = {
                        ...newHistory[index],
                        title
                    };
                }
                return {
                    history: newHistory
                };
            }),
        clearHistory: ()=>set({
                history: []
            }),
        removeFromHistory: (id)=>set((state)=>({
                    history: state.history.filter((entry)=>entry.id !== id)
                })),
        // Bookmarks Actions
        toggleBookmark: (url, title, favicon)=>set((state)=>{
                if (url.startsWith('browser://')) return state;
                const isBookmarked = state.bookmarks.some((b)=>b.url === url);
                if (isBookmarked) {
                    return {
                        bookmarks: state.bookmarks.filter((b)=>b.url !== url)
                    };
                } else {
                    const newBookmark = {
                        id: Date.now().toString(),
                        url,
                        title,
                        favicon,
                        timestamp: Date.now()
                    };
                    return {
                        bookmarks: [
                            ...state.bookmarks,
                            newBookmark
                        ]
                    };
                }
            }),
        removeBookmark: (id)=>set((state)=>({
                    bookmarks: state.bookmarks.filter((b)=>b.id !== id)
                })),
        // Settings Actions
        setBookmarkBarVisibility: (visibility)=>set({
                bookmarkBarVisibility: visibility
            }),
        hideTopSite: (domain)=>set((state)=>({
                    hiddenTopSites: [
                        ...state.hiddenTopSites || [],
                        domain
                    ]
                })),
        // Auth Actions
        checkLoginState: async (force = false)=>{
            try {
                const result = await window.electron.checkGoogleLogin(force);
                set({
                    isLoggedIn: result.isLoggedIn,
                    userProfilePic: result.profilePic,
                    currentUser: result.currentUser || null,
                    accounts: result.accounts || []
                });
            } catch (e) {
                console.error('Failed to check login state:', e);
            }
        },
        switchAccount: (email)=>set((state)=>{
                if (!state.accounts) return state;
                const account = state.accounts.find((a)=>a.email === email);
                if (account) {
                    return {
                        currentUser: account,
                        userProfilePic: account.pic
                    };
                }
                return state;
            }),
        logoutGoogle: async ()=>{
            try {
                await window.electron.logoutGoogle();
                set({
                    isLoggedIn: false,
                    userProfilePic: null,
                    currentUser: null,
                    accounts: []
                });
            } catch (e) {
                console.error('Failed to logout:', e);
            }
        },
        // Download actions
        addDownload: (download)=>set((state)=>({
                    downloads: [
                        download,
                        ...state.downloads
                    ]
                })),
        updateDownload: (id, data)=>set((state)=>({
                    downloads: state.downloads.map((d)=>d.id === id ? {
                            ...d,
                            ...data
                        } : d)
                })),
        updateDownloadSettings: (settings)=>set((state)=>{
                const newSettings = {
                    ...state.downloadSettings,
                    ...settings
                };
                window.electron?.updateDownloadSettings(newSettings);
                return {
                    downloadSettings: newSettings
                };
            }),
        clearCompletedDownloads: ()=>set((state)=>({
                    downloads: state.downloads.filter((d)=>d.state === 'progressing' || d.state === 'paused')
                })),
        // Extension Actions
        installExtension: (extension)=>set((state)=>{
                if (state.installedExtensions.some((e)=>e.id === extension.id)) return state;
                return {
                    installedExtensions: [
                        ...state.installedExtensions,
                        {
                            ...extension,
                            isEnabled: true
                        }
                    ]
                };
            }),
        uninstallExtension: (id)=>set((state)=>({
                    installedExtensions: state.installedExtensions.filter((e)=>e.id !== id)
                })),
        toggleExtension: (id)=>set((state)=>({
                    installedExtensions: state.installedExtensions.map((e)=>e.id === id ? {
                            ...e,
                            isEnabled: !e.isEnabled
                        } : e)
                })),
        setHiddenTopSites: (sites)=>set({
                hiddenTopSites: sites
            }),
        // --- Permissions Manager ---
        addPermissionRequest: (request)=>set((state)=>({
                    activePermissionRequests: [
                        ...state.activePermissionRequests,
                        request
                    ]
                })),
        resolvePermissionRequest: (id, granted)=>set((state)=>{
                const request = state.activePermissionRequests.find((r)=>r.id === id);
                if (!request) return state;
                // Tell backend
                if (window.electron) {
                    window.electron.respondToPermission({
                        id,
                        origin: request.origin,
                        permission: request.permission,
                        granted
                    });
                }
                // Update local state
                const updatedPermissions = {
                    ...state.sessionPermissions
                };
                if (!updatedPermissions[request.origin]) {
                    updatedPermissions[request.origin] = {};
                }
                updatedPermissions[request.origin][request.permission] = granted ? 'granted' : 'denied';
                return {
                    sessionPermissions: updatedPermissions,
                    activePermissionRequests: state.activePermissionRequests.filter((r)=>r.id !== id)
                };
            }),
        revokePermission: (origin, permission)=>set((state)=>{
                if (window.electron) {
                    window.electron.revokePermission({
                        origin,
                        permission
                    });
                }
                const updatedPermissions = {
                    ...state.sessionPermissions
                };
                if (updatedPermissions[origin]) {
                    delete updatedPermissions[origin][permission];
                    if (Object.keys(updatedPermissions[origin]).length === 0) {
                        delete updatedPermissions[origin];
                    }
                }
                return {
                    sessionPermissions: updatedPermissions
                };
            }),
        clearSessionPermissions: ()=>set({
                sessionPermissions: {},
                activePermissionRequests: []
            })
    }), {
    name: 'browser-storage',
    partialize: (state)=>({
            history: state.history,
            bookmarks: state.bookmarks,
            bookmarkBarVisibility: state.bookmarkBarVisibility,
            installedExtensions: state.installedExtensions,
            downloads: state.downloads,
            hiddenTopSites: state.hiddenTopSites,
            downloadSettings: state.downloadSettings,
            isLoggedIn: state.isLoggedIn,
            userProfilePic: state.userProfilePic,
            currentUser: state.currentUser,
            accounts: state.accounts,
            openRouterApiKey: state.openRouterApiKey
        })
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/toolbar/TabContextMenu.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TabContextMenu
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.mjs [app-client] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pin.mjs [app-client] (ecmascript) <export default as Pin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-2.mjs [app-client] (ecmascript) <export default as Volume2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-x.mjs [app-client] (ecmascript) <export default as VolumeX>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$template$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutTemplate$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-template.mjs [app-client] (ecmascript) <export default as LayoutTemplate>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
function TabContextMenu({ x, y, tabId, onClose }) {
    _s();
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { tabs, addTab, removeMultipleTabs, togglePin, toggleMute, setSplitTabId, activeTabId, splitTabId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const tab = tabs.find((t)=>t.id === tabId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TabContextMenu.useEffect": ()=>{
            const handleClickOutside = {
                "TabContextMenu.useEffect.handleClickOutside": (e)=>{
                    if (menuRef.current && !menuRef.current.contains(e.target)) {
                        onClose();
                    }
                }
            }["TabContextMenu.useEffect.handleClickOutside"];
            document.addEventListener("mousedown", handleClickOutside, true);
            const handleContext = {
                "TabContextMenu.useEffect.handleContext": (e)=>{
                    e.preventDefault();
                    onClose();
                }
            }["TabContextMenu.useEffect.handleContext"];
            document.addEventListener("contextmenu", handleContext);
            return ({
                "TabContextMenu.useEffect": ()=>{
                    document.removeEventListener("mousedown", handleClickOutside, true);
                    document.removeEventListener("contextmenu", handleContext);
                }
            })["TabContextMenu.useEffect"];
        }
    }["TabContextMenu.useEffect"], [
        onClose
    ]);
    if (!tab) return null;
    const handleNewTabToRight = ()=>{
        addTab('browser://newtab', 'New Tab', tabId);
        onClose();
    };
    const handleDuplicate = ()=>{
        addTab(tab.url, tab.title, tabId);
        onClose();
    };
    const handleCloseOtherTabs = ()=>{
        const idsToClose = tabs.filter((t)=>t.id !== tabId && !t.isPinned).map((t)=>t.id);
        if (idsToClose.length > 0) removeMultipleTabs(idsToClose);
        onClose();
    };
    const handleCloseTabsToRight = ()=>{
        const idx = tabs.findIndex((t)=>t.id === tabId);
        if (idx !== -1) {
            const idsToClose = tabs.slice(idx + 1).filter((t)=>!t.isPinned).map((t)=>t.id);
            if (idsToClose.length > 0) removeMultipleTabs(idsToClose);
        }
        onClose();
    };
    const handleClose = ()=>{
        removeMultipleTabs([
            tabId
        ]);
        onClose();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: menuRef,
        className: "fixed bg-surface border border-border rounded-lg shadow-2xl z-9999 w-56 py-1 text-sm text-foreground/90 animate-in fade-in zoom-in-95 duration-100 font-sans",
        style: {
            left: Math.min(x, window.innerWidth - 224),
            top: y
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleNewTabToRight,
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    " New tab to the right"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            tab.id !== activeTabId && tab.id !== splitTabId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>{
                    setSplitTabId(tab.id);
                    onClose();
                },
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$template$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutTemplate$3e$__["LayoutTemplate"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 83,
                        columnNumber: 11
                    }, this),
                    " Split view with this tab"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 79,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-px bg-border my-1"
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleDuplicate,
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    " Duplicate"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>{
                    togglePin(tab.id);
                    onClose();
                },
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pin$3e$__["Pin"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this),
                    " ",
                    tab.isPinned ? "Unpin" : "Pin"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>{
                    toggleMute(tab.id);
                    onClose();
                },
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: [
                    tab.isMuted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__["Volume2"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 107,
                        columnNumber: 24
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__["VolumeX"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 107,
                        columnNumber: 65
                    }, this),
                    tab.isMuted ? "Unmute site" : "Mute site"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 103,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-px bg-border my-1"
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleCloseOtherTabs,
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: "Close other tabs"
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleCloseTabsToRight,
                className: "w-full text-left px-4 py-2 min-h-[44px] hover:bg-accent hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: "Close tabs to the right"
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-px bg-border my-1"
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 127,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleClose,
                className: "w-full text-left px-4 py-2 min-h-[44px] text-red-500 hover:bg-red-500 hover:text-white flex items-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                        size: 14,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    " Close"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TabContextMenu.js",
                lineNumber: 129,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/toolbar/TabContextMenu.js",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
_s(TabContextMenu, "tAeYvNPf9ZactipNqVRLN1Mc6tY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = TabContextMenu;
var _c;
__turbopack_context__.k.register(_c, "TabContextMenu");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/toolbar/TopBar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TopBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.mjs [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.mjs [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.mjs [app-client] (ecmascript) <export default as MoreVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/history.mjs [app-client] (ecmascript) <export default as History>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-2.mjs [app-client] (ecmascript) <export default as Volume2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-x.mjs [app-client] (ecmascript) <export default as VolumeX>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$TabContextMenu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/toolbar/TabContextMenu.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/core/dist/core.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/sortable/dist/sortable.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$utilities$2f$dist$2f$utilities$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/utilities/dist/utilities.esm.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
// Floating mini-window preview shown when tearing off a tab (Chrome-style)
function TearOffWindowPreview({ tab, mousePos }) {
    if (!tab || !mousePos) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed pointer-events-none z-9999",
        style: {
            left: mousePos.x - 150,
            top: mousePos.y - 10
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-75 rounded-lg overflow-hidden shadow-2xl border border-border/60/60",
            style: {
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-8 bg-background flex items-center px-3 space-x-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2.5 h-2.5 rounded-full bg-red-500/70"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 30,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2.5 h-2.5 rounded-full bg-yellow-500/70"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 31,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2.5 h-2.5 rounded-full bg-green-500/70"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 29,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/toolbar/TopBar.js",
                    lineNumber: 28,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-7 bg-surface flex items-center px-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center bg-surface rounded-t px-2 py-1 max-w-50",
                        children: [
                            tab.favicon ? // eslint-disable-next-line @next/next/no-img-element
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: tab.favicon,
                                className: "w-3 h-3 rounded-sm mr-1.5 shrink-0",
                                alt: ""
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 40,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 rounded-full bg-gray-600 mr-1.5 shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 42,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-foreground/90 truncate",
                                children: tab.title || 'New Tab'
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 44,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/toolbar/TopBar.js",
                    lineNumber: 36,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-40 bg-surface flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            tab.favicon ? // eslint-disable-next-line @next/next/no-img-element
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: tab.favicon,
                                className: "w-8 h-8 mx-auto mb-2 rounded opacity-50",
                                alt: ""
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 52,
                                columnNumber: 15
                            }, this) : // eslint-disable-next-line @next/next/no-img-element
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: "/favicon.png",
                                className: "w-8 h-8 mx-auto mb-2 opacity-40",
                                alt: ""
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 55,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] text-gray-500 max-w-50 truncate px-4",
                                children: tab.title || tab.url
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 49,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/toolbar/TopBar.js",
                    lineNumber: 48,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/toolbar/TopBar.js",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/TopBar.js",
        lineNumber: 18,
        columnNumber: 5
    }, this), document.body);
}
_c = TearOffWindowPreview;
function SortableTab({ tab, isActive, setActiveTab, removeTab, toggleMute, onContextMenu, frozenTabWidth, tabCount, isTearingOff }) {
    _s();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSortable"])({
        id: tab.id
    });
    // Always constrain to X-axis in the original DOM to prevent vertical scrollbars on the container.
    // The TearOffWindowPreview portal handles the actual vertical visual.
    const effectiveTransform = transform ? {
        ...transform,
        y: 0
    } : null;
    const style = {
        transform: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$utilities$2f$dist$2f$utilities$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CSS"].Transform.toString(effectiveTransform),
        transition: isTearingOff ? 'none' : transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? isTearingOff ? 0 : 0.8 : 1,
        width: !tab.isPinned && frozenTabWidth ? frozenTabWidth : undefined,
        maxWidth: !tab.isPinned && frozenTabWidth ? frozenTabWidth : undefined
    };
    const isOnlyTab = tabCount === 1 && !tab.isPinned;
    // Custom Window Dragging State
    const dragState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        isDragging: false,
        startX: 0,
        startY: 0
    });
    const customListeners = isOnlyTab ? {
        onPointerDown: (e)=>{
            if (e.button === 0) {
                dragState.current = {
                    isDragging: true,
                    startX: e.screenX,
                    startY: e.screenY
                };
                e.currentTarget.setPointerCapture(e.pointerId);
            }
        },
        onPointerMove: (e)=>{
            if (dragState.current.isDragging) {
                const dx = e.screenX - dragState.current.startX;
                const dy = e.screenY - dragState.current.startY;
                if (dx !== 0 || dy !== 0) {
                    window.electron?.moveWindow(dx, dy);
                    dragState.current.startX = e.screenX;
                    dragState.current.startY = e.screenY;
                }
            }
        },
        onPointerUp: (e)=>{
            if (dragState.current.isDragging) {
                dragState.current.isDragging = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        },
        onPointerCancel: (e)=>{
            if (dragState.current.isDragging) {
                dragState.current.isDragging = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        }
    } : {
        ...listeners,
        onPointerDown: (e)=>{
            // Don't let dnd-kit intercept middle (1) or right (2) clicks
            if (e.button === 1 || e.button === 2) {
                e.stopPropagation();
            } else {
                listeners?.onPointerDown?.(e);
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: setNodeRef,
        style: style,
        ...attributes,
        ...customListeners,
        onClick: ()=>setActiveTab(tab.id),
        onContextMenu: (e)=>onContextMenu(e, tab.id),
        onAuxClick: (e)=>{
            if (e.button === 1) {
                e.preventDefault();
                removeTab(tab.id);
            }
        },
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("group flex items-center h-8 rounded-t-lg cursor-pointer border-t border-x transition-colors shrink-0", "no-drag-region", isActive ? "bg-surface border-surface-hover text-foreground" : "bg-transparent border-transparent text-foreground/70 hover:bg-surface-hover/50 hover:text-foreground/90", tab.isPinned ? "px-2 w-10 justify-center flex-none" : "px-3 min-w-[48px] max-w-[240px] flex-1"),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center overflow-hidden h-full",
                children: [
                    tab.isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("w-4 h-4 shrink-0 animate-spin rounded-full border-2 border-gray-500 border-t-white", !tab.isPinned && "mr-2")
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 163,
                        columnNumber: 11
                    }, this) : tab.url.startsWith('browser://') ? // eslint-disable-next-line @next/next/no-img-element
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: "/favicon.png",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("w-4 h-4 object-contain shrink-0", !tab.isPinned && "mr-2"),
                        alt: ""
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this) : tab.favicon ? // eslint-disable-next-line @next/next/no-img-element
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: tab.favicon,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("w-4 h-4 rounded-sm shrink-0 bg-foreground/", !tab.isPinned && "mr-2"),
                        alt: ""
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 169,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("w-4 h-4 rounded-full bg-surface-hover/80 shrink-0", !tab.isPinned && "mr-2")
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 171,
                        columnNumber: 11
                    }, this),
                    !tab.isPinned && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex-1 text-xs truncate",
                        children: tab.title
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            !tab.isPinned && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center ml-1",
                    children: [
                        (tab.isPlayingAudio || tab.isMuted) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onPointerDown: (e)=>e.stopPropagation(),
                            onClick: (e)=>{
                                e.stopPropagation();
                                toggleMute(tab.id);
                            },
                            "aria-label": tab.isMuted ? "Unmute site" : "Mute site",
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("relative before:absolute before:-inset-2 before:content-[''] p-1 rounded-md hover:bg-foreground/10 transition-colors mr-1 shrink-0 no-drag-region hidden sm:flex focus-visible:ring-2 focus-visible:outline-none", isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/90"),
                            title: tab.isMuted ? "Unmute site" : "Mute site",
                            children: tab.isMuted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__["VolumeX"], {
                                size: 12
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 196,
                                columnNumber: 32
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__["Volume2"], {
                                size: 12
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 196,
                                columnNumber: 56
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 183,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onPointerDown: (e)=>e.stopPropagation(),
                            onClick: (e)=>{
                                e.stopPropagation();
                                removeTab(tab.id);
                            },
                            "aria-label": "Close tab",
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("relative before:absolute before:-inset-2 before:content-[''] p-1 rounded-md hover:bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 no-drag-region hidden sm:flex focus-visible:ring-2 focus-visible:outline-none", isActive ? "opacity-100" : ""),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 12
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 211,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 199,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/toolbar/TopBar.js",
                    lineNumber: 181,
                    columnNumber: 11
                }, this)
            }, void 0, false)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/toolbar/TopBar.js",
        lineNumber: 137,
        columnNumber: 5
    }, this);
}
_s(SortableTab, "hgy03c6tZwyq7LpFJzc7llnTkAo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSortable"]
    ];
});
_c1 = SortableTab;
function TopBar() {
    _s1();
    const { tabs, activeTabId, splitTabId, setFocusedPane, setActiveTab, removeTab, addTab, isLoggedIn, userProfilePic, currentUser, accounts, checkLoginState, logoutGoogle, switchAccount, toggleMute, openSettingsTab } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "TopBar.useBrowserStore.useShallow": (state)=>({
                tabs: state.tabs,
                activeTabId: state.activeTabId,
                splitTabId: state.splitTabId,
                setFocusedPane: state.setFocusedPane,
                setActiveTab: state.setActiveTab,
                removeTab: state.removeTab,
                addTab: state.addTab,
                isLoggedIn: state.isLoggedIn,
                userProfilePic: state.userProfilePic,
                currentUser: state.currentUser,
                accounts: state.accounts,
                checkLoginState: state.checkLoginState,
                logoutGoogle: state.logoutGoogle,
                switchAccount: state.switchAccount,
                toggleMute: state.toggleMute,
                openSettingsTab: state.openSettingsTab
            })
    }["TopBar.useBrowserStore.useShallow"]));
    const [showProfileMenu, setShowProfileMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showLogoutModal, setShowLogoutModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedLogoutAccount, setSelectedLogoutAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [showBrowserMenu, setShowBrowserMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [contextMenu, setContextMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [frozenTabWidth, setFrozenTabWidth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const browserMenuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tabsContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const handleRemoveTab = (id)=>{
        if (tabsContainerRef.current) {
            const tabNodes = tabsContainerRef.current.querySelectorAll('.group');
            for (const node of tabNodes){
                if (node.offsetWidth > 45) {
                    setFrozenTabWidth(node.offsetWidth);
                    break;
                }
            }
        }
        removeTab(id);
    };
    const [tearingOffTabId, setTearingOffTabId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [mousePos, setMousePos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeDragId, setActiveDragId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const sensors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensors"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensor"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointerSensor"], {
        activationConstraint: {
            distance: 5
        }
    }), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensor"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KeyboardSensor"], {
        coordinateGetter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sortableKeyboardCoordinates"]
    }));
    // Track mouse position globally during drag for the floating preview
    const mouseMoveHandler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TopBar.useCallback[mouseMoveHandler]": (e)=>{
            setMousePos({
                x: e.clientX,
                y: e.clientY
            });
        }
    }["TopBar.useCallback[mouseMoveHandler]"], []);
    const handleDragStart = (event)=>{
        setActiveDragId(event.active.id);
        window.addEventListener('mousemove', mouseMoveHandler);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().setIsDraggingTab(true);
    };
    const handleDragMove = (event)=>{
        const { active, delta } = event;
        // Mark as tearing off when dragged vertically beyond threshold
        if (Math.abs(delta.y) > 50) {
            setTearingOffTabId(active.id);
        } else {
            setTearingOffTabId(null);
        }
    };
    const handleDragEnd = (event)=>{
        const { active, over, delta } = event;
        setTearingOffTabId(null);
        setActiveDragId(null);
        setMousePos(null);
        window.removeEventListener('mousemove', mouseMoveHandler);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().setIsDraggingTab(false);
        // If dragged vertically by more than 50 pixels, consider it a tear-off
        if (Math.abs(delta.y) > 50) {
            const draggedTab = tabs.find((t)=>t.id === active.id);
            // Don't tear off the last tab or a pinned tab
            if (draggedTab && !draggedTab.isPinned && tabs.length > 1 && window.electron?.detachTab) {
                window.electron.detachTab(draggedTab);
                removeTab(draggedTab.id);
            }
            return;
        }
        if (over && active.id !== over.id) {
            const oldIndex = tabs.findIndex((t)=>t.id === active.id);
            const newIndex = tabs.findIndex((t)=>t.id === over.id);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().reorderTabs(oldIndex, newIndex);
        }
    };
    const handleDragCancel = ()=>{
        setTearingOffTabId(null);
        setActiveDragId(null);
        setMousePos(null);
        window.removeEventListener('mousemove', mouseMoveHandler);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().setIsDraggingTab(false);
    };
    const tearingOffTab = tearingOffTabId ? tabs.find((t)=>t.id === tearingOffTabId) : null;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TopBar.useEffect": ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().checkLoginState();
        }
    }["TopBar.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TopBar.useEffect": ()=>{
            const handleClickOutside = {
                "TopBar.useEffect.handleClickOutside": (event)=>{
                    if (menuRef.current && !menuRef.current.contains(event.target)) {
                        setShowProfileMenu(false);
                    }
                    if (browserMenuRef.current && !browserMenuRef.current.contains(event.target)) {
                        setShowBrowserMenu(false);
                    }
                }
            }["TopBar.useEffect.handleClickOutside"];
            document.addEventListener("mousedown", handleClickOutside);
            return ({
                "TopBar.useEffect": ()=>document.removeEventListener("mousedown", handleClickOutside)
            })["TopBar.useEffect"];
        }
    }["TopBar.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-11 bg-background flex items-end px-2 space-x-1 select-none drag-region",
        onDoubleClick: (e)=>{
            if (!e.target.closest('.no-drag-region')) {
                window.electron?.maximize?.();
            }
        },
        children: [
            (showProfileMenu || showBrowserMenu) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-40 no-drag-region",
                onClick: ()=>{
                    setShowProfileMenu(false);
                    setShowBrowserMenu(false);
                }
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 365,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center px-3 h-8 mb-1 space-x-2 text-foreground no-drag-region",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: "/favicon.png",
                        alt: "Logo",
                        className: "w-5 h-5 object-contain"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 376,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-semibold tracking-wide",
                        children: "Verse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 377,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 374,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-end space-x-1 overflow-x-auto no-scrollbar",
                ref: tabsContainerRef,
                onMouseLeave: ()=>setFrozenTabWidth(null),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DndContext"], {
                        id: "browser-tabs-dnd",
                        sensors: sensors,
                        collisionDetection: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["closestCenter"],
                        onDragStart: handleDragStart,
                        onDragMove: handleDragMove,
                        onDragEnd: handleDragEnd,
                        onDragCancel: handleDragCancel,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SortableContext"], {
                            items: tabs.map((t)=>t.id),
                            strategy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["horizontalListSortingStrategy"],
                            children: tabs.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortableTab, {
                                    tab: tab,
                                    isActive: tab.id === activeTabId || tab.id === splitTabId,
                                    setActiveTab: (id)=>{
                                        if (id === splitTabId) setFocusedPane('secondary');
                                        else if (id === activeTabId) setFocusedPane('primary');
                                        else setActiveTab(id);
                                    },
                                    removeTab: handleRemoveTab,
                                    toggleMute: toggleMute,
                                    frozenTabWidth: frozenTabWidth,
                                    tabCount: tabs.length,
                                    isTearingOff: tearingOffTabId === tab.id,
                                    onContextMenu: (e, id)=>{
                                        e.preventDefault();
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            tabId: id
                                        });
                                    }
                                }, tab.id, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 400,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 395,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 386,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            setFrozenTabWidth(null);
                            addTab();
                        },
                        "aria-label": "New Tab",
                        className: "relative before:absolute before:-inset-2 before:content-[''] h-8 w-8 flex items-center justify-center rounded-t-lg hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors mb-px no-drag-region focus-visible:ring-2 focus-visible:outline-none",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 432,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 424,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 381,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center h-full text-foreground/70 space-x-2 relative no-drag-region",
                ref: menuRef,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            if (!showProfileMenu) checkLoginState(true);
                            setShowProfileMenu(!showProfileMenu);
                        },
                        "aria-label": "Profile Menu",
                        className: "relative before:absolute before:-inset-2 before:content-[''] h-7 w-7 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors border border-transparent hover:border-border overflow-hidden focus-visible:ring-2 focus-visible:outline-none",
                        title: "Profile",
                        children: isLoggedIn ? userProfilePic ? // eslint-disable-next-line @next/next/no-img-element
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: userProfilePic,
                            alt: "Profile",
                            className: "w-full h-full object-cover"
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 451,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full h-full bg-green-500/20 text-green-500 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                size: 14,
                                className: "fill-current"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 454,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 453,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 458,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 439,
                        columnNumber: 9
                    }, this),
                    showProfileMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute right-2 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-100 flex flex-col font-sans",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-6 text-center border-b border-border bg-surface",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mx-auto w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-3 overflow-hidden",
                                        children: currentUser?.pic ? // eslint-disable-next-line @next/next/no-img-element
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: currentUser.pic,
                                            alt: "Profile",
                                            className: "w-full h-full object-cover"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/toolbar/TopBar.js",
                                            lineNumber: 468,
                                            columnNumber: 20
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                            size: 32,
                                            className: "fill-current"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/toolbar/TopBar.js",
                                            lineNumber: 470,
                                            columnNumber: 20
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 465,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-base font-medium text-foreground truncate px-2",
                                        children: isLoggedIn ? currentUser?.name || "Current Account" : "Not signed in"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 473,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-foreground/70 mt-1 truncate px-2",
                                        children: isLoggedIn ? currentUser?.email || "Synced with browser" : "Sign in to sync your tabs"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 476,
                                        columnNumber: 15
                                    }, this),
                                    !isLoggedIn && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            addTab('https://accounts.google.com/ServiceLogin', 'Sign In');
                                            setShowProfileMenu(false);
                                        },
                                        className: "mt-4 bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-full font-medium transition-colors text-sm",
                                        children: "Sign in"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 480,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 464,
                                columnNumber: 13
                            }, this),
                            isLoggedIn && accounts && accounts.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-b border-border bg-surface",
                                children: accounts.filter((a)=>a.email !== currentUser?.email).map((acc, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            switchAccount(acc.email);
                                            setShowProfileMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2.5 hover:bg-foreground/10 flex items-center transition-colors cursor-pointer border-none",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 bg-foreground/ flex items-center justify-center",
                                                children: acc.pic ? // eslint-disable-next-line @next/next/no-img-element
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: acc.pic,
                                                    alt: "",
                                                    className: "w-full h-full object-cover"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                                    lineNumber: 506,
                                                    columnNumber: 25
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                    size: 16,
                                                    className: "text-foreground/70"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                                    lineNumber: 508,
                                                    columnNumber: 25
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 503,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-foreground truncate",
                                                        children: acc.name || 'Account'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                                        lineNumber: 512,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-foreground/70 truncate",
                                                        children: acc.email
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                                        lineNumber: 513,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 511,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, idx, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 495,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 493,
                                columnNumber: 15
                            }, this),
                            isLoggedIn && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 space-y-1 bg-surface",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            addTab('https://accounts.google.com/AddSession', 'Add Account');
                                            setShowProfileMenu(false);
                                        },
                                        className: "w-full text-left px-3 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 rounded-lg flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 529,
                                                columnNumber: 19
                                            }, this),
                                            "Add account"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 522,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setShowProfileMenu(false);
                                            setShowLogoutModal(true);
                                        },
                                        className: "w-full text-left px-3 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 rounded-lg flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 540,
                                                columnNumber: 19
                                            }, this),
                                            "Sign out"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 533,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 521,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 463,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        ref: browserMenuRef,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowBrowserMenu(!showBrowserMenu),
                                "aria-label": "Browser Menu",
                                className: "relative before:absolute before:-inset-2 before:content-[''] h-8 w-8 ml-1 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors border border-transparent hover:border-border text-foreground/80 focus-visible:ring-2 focus-visible:outline-none",
                                title: "Menu",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__["MoreVertical"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 556,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 550,
                                columnNumber: 11
                            }, this),
                            showBrowserMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-100 flex flex-col font-sans py-2 animate-in fade-in zoom-in-95 duration-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            addTab();
                                            setShowBrowserMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2.5 text-sm text-foreground/90 hover:bg-accent hover:text-white flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                size: 16,
                                                className: "mr-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 568,
                                                columnNumber: 17
                                            }, this),
                                            "New Tab"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 561,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-px bg-border my-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 572,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "w-full text-left px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 575,
                                                columnNumber: 17
                                            }, this),
                                            "History"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 574,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "w-full text-left px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 579,
                                                columnNumber: 17
                                            }, this),
                                            "Downloads"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 578,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-px bg-border my-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 583,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            openSettingsTab();
                                            setShowBrowserMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 592,
                                                columnNumber: 17
                                            }, this),
                                            "Settings"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 585,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-px bg-border my-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 596,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>window.electron?.close?.(),
                                        className: "w-full text-left px-4 py-2.5 text-sm text-foreground/90 hover:bg-red-500/10 hover:text-red-400 flex items-center transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                size: 16,
                                                className: "mr-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 602,
                                                columnNumber: 17
                                            }, this),
                                            "Exit Verse"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/TopBar.js",
                                        lineNumber: 598,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 560,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 549,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center h-full space-x-0 ml-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>window.electron?.minimize?.(),
                                className: "h-8 w-10 flex items-center justify-center hover:bg-foreground/10 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-2.5 h-px bg-current"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 614,
                                    columnNumber: 11
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 610,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>window.electron?.maximize?.(),
                                className: "h-8 w-10 flex items-center justify-center hover:bg-foreground/10 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-2.5 h-2.5 border border-current"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 620,
                                    columnNumber: 11
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 616,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>window.electron?.close?.(),
                                className: "h-8 w-10 flex items-center justify-center hover:bg-red-500 hover:text-foreground transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 626,
                                    columnNumber: 11
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 622,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/TopBar.js",
                        lineNumber: 609,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 437,
                columnNumber: 7
            }, this),
            showLogoutModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/60 z-200 flex items-center justify-center font-sans no-drag-region",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-surface border border-border w-96 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setShowLogoutModal(false),
                            className: "absolute top-4 right-4 text-foreground/70 hover:text-foreground transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                lineNumber: 636,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 635,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-semibold text-foreground mb-2",
                            children: "Sign out"
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 639,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-foreground/70 mb-6",
                            children: "Signing out will remove all Google accounts from this browser. You will need to sign in again to access synced data."
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 640,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2 mb-6 max-h-75 overflow-y-auto custom-scrollbar",
                            children: accounts?.map((acc, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center p-3 rounded-xl bg-foreground/ border border-border",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 bg-foreground/ flex items-center justify-center",
                                            children: acc.pic ? // eslint-disable-next-line @next/next/no-img-element
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: acc.pic,
                                                alt: "",
                                                className: "w-full h-full object-cover"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 648,
                                                columnNumber: 23
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                size: 16,
                                                className: "text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/TopBar.js",
                                                lineNumber: 650,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/toolbar/TopBar.js",
                                            lineNumber: 645,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-foreground truncate",
                                                    children: acc.name || 'Account'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                                    lineNumber: 654,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-foreground/70 truncate",
                                                    children: acc.email
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                                    lineNumber: 655,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/toolbar/TopBar.js",
                                            lineNumber: 653,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, idx, true, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 644,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 642,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-end space-x-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setShowLogoutModal(false),
                                    className: "px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 662,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        logoutGoogle();
                                        setShowLogoutModal(false);
                                    },
                                    className: "px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors",
                                    children: "Sign out of all accounts"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/TopBar.js",
                                    lineNumber: 668,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/toolbar/TopBar.js",
                            lineNumber: 661,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/toolbar/TopBar.js",
                    lineNumber: 634,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 633,
                columnNumber: 9
            }, this),
            contextMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$TabContextMenu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                x: contextMenu.x,
                y: contextMenu.y,
                tabId: contextMenu.tabId,
                onClose: ()=>setContextMenu(null)
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 683,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TearOffWindowPreview, {
                tab: tearingOffTab,
                mousePos: mousePos
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/TopBar.js",
                lineNumber: 692,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/toolbar/TopBar.js",
        lineNumber: 355,
        columnNumber: 5
    }, this);
}
_s1(TopBar, "Y5/F8lv1pL1HUirSgwjo/Fbiqg8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensors"]
    ];
});
_c2 = TopBar;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "TearOffWindowPreview");
__turbopack_context__.k.register(_c1, "SortableTab");
__turbopack_context__.k.register(_c2, "TopBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useSearchSuggestions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSearchSuggestions",
    ()=>useSearchSuggestions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useSearchSuggestions(query, delay = 300) {
    _s();
    const [suggestions, setSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSearchSuggestions.useEffect": ()=>{
            if (!query || query.trim().length === 0) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSuggestions([]);
                return;
            }
            // Don't search if it looks like a URL (very basic check)
            if (query.includes('.') && !query.includes(' ')) {
                setSuggestions([]);
                return;
            }
            const fetchSuggestions = {
                "useSearchSuggestions.useEffect.fetchSuggestions": async ()=>{
                    setIsLoading(true);
                    try {
                        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
                        if (res.ok) {
                            const data = await res.json();
                            setSuggestions(data.suggestions || []);
                        } else {
                            setSuggestions([]);
                        }
                    } catch (err) {
                        console.error('Failed to fetch suggestions', err);
                        setSuggestions([]);
                    } finally{
                        setIsLoading(false);
                    }
                }
            }["useSearchSuggestions.useEffect.fetchSuggestions"];
            const timerId = setTimeout(fetchSuggestions, delay);
            return ({
                "useSearchSuggestions.useEffect": ()=>{
                    clearTimeout(timerId);
                }
            })["useSearchSuggestions.useEffect"];
        }
    }["useSearchSuggestions.useEffect"], [
        query,
        delay
    ]);
    return {
        suggestions,
        isLoading
    };
}
_s(useSearchSuggestions, "szcfZ64NEXVOfRJDMcbnRHM5imE=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/common/SuggestionsDropdown.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SuggestionsDropdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
;
;
;
function SuggestionsDropdown({ suggestions, onSelect, className }) {
    if (!suggestions || suggestions.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("absolute w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50", className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
            className: "py-2",
            children: suggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>onSelect(suggestion),
                        className: "w-full text-left px-4 py-2.5 hover:bg-foreground/10 flex items-center gap-3 transition-colors text-foreground/90 hover:text-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "w-4 h-4 text-gray-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/common/SuggestionsDropdown.js",
                                lineNumber: 16,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "truncate",
                                children: suggestion
                            }, void 0, false, {
                                fileName: "[project]/src/components/common/SuggestionsDropdown.js",
                                lineNumber: 17,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/common/SuggestionsDropdown.js",
                        lineNumber: 12,
                        columnNumber: 13
                    }, this)
                }, index, false, {
                    fileName: "[project]/src/components/common/SuggestionsDropdown.js",
                    lineNumber: 11,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/components/common/SuggestionsDropdown.js",
            lineNumber: 9,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/common/SuggestionsDropdown.js",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
_c = SuggestionsDropdown;
var _c;
__turbopack_context__.k.register(_c, "SuggestionsDropdown");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/toolbar/PermissionPrompt.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PermissionPrompt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/camera.mjs [app-client] (ecmascript) <export default as Camera>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.mjs [app-client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.mjs [app-client] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const permissionIcons = {
    media: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
        size: 18,
        className: "text-blue-400"
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
        lineNumber: 6,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0)),
    geolocation: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
        size: 18,
        className: "text-green-400"
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
        lineNumber: 7,
        columnNumber: 16
    }, ("TURBOPACK compile-time value", void 0)),
    notifications: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
        size: 18,
        className: "text-yellow-400"
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
        lineNumber: 8,
        columnNumber: 18
    }, ("TURBOPACK compile-time value", void 0)),
    default: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
        size: 18,
        className: "text-red-400"
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
        lineNumber: 9,
        columnNumber: 12
    }, ("TURBOPACK compile-time value", void 0))
};
const permissionLabels = {
    media: "use your camera and microphone",
    geolocation: "know your location",
    notifications: "show notifications",
    default: "access a restricted feature"
};
function PermissionPrompt() {
    _s();
    const { activePermissionRequests, resolvePermissionRequest } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentRequest, setCurrentRequest] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const promptRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PermissionPrompt.useEffect": ()=>{
            if (activePermissionRequests.length > 0) {
                setCurrentRequest(activePermissionRequests[0]);
                setIsVisible(true);
            } else {
                setIsVisible(false);
                const timer = setTimeout({
                    "PermissionPrompt.useEffect.timer": ()=>setCurrentRequest(null)
                }["PermissionPrompt.useEffect.timer"], 300); // fade out duration
                return ({
                    "PermissionPrompt.useEffect": ()=>clearTimeout(timer)
                })["PermissionPrompt.useEffect"];
            }
        }
    }["PermissionPrompt.useEffect"], [
        activePermissionRequests
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PermissionPrompt.useEffect": ()=>{
            if (window.electron) {
                const cleanup = window.electron.onPermissionRequest({
                    "PermissionPrompt.useEffect.cleanup": (request)=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().addPermissionRequest(request);
                    }
                }["PermissionPrompt.useEffect.cleanup"]);
                return cleanup;
            }
        }
    }["PermissionPrompt.useEffect"], []);
    // Dismiss (block) when clicking outside the prompt or into the webview
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PermissionPrompt.useEffect": ()=>{
            if (!isVisible || !currentRequest) return;
            let dismissed = false;
            const dismiss = {
                "PermissionPrompt.useEffect.dismiss": ()=>{
                    if (dismissed) return;
                    dismissed = true;
                    setIsVisible(false);
                    setTimeout({
                        "PermissionPrompt.useEffect.dismiss": ()=>resolvePermissionRequest(currentRequest.id, false)
                    }["PermissionPrompt.useEffect.dismiss"], 300);
                }
            }["PermissionPrompt.useEffect.dismiss"];
            const handleClickOutside = {
                "PermissionPrompt.useEffect.handleClickOutside": (e)=>{
                    if (promptRef.current && !promptRef.current.contains(e.target)) {
                        dismiss();
                    }
                }
            }["PermissionPrompt.useEffect.handleClickOutside"];
            // Clicking inside a webview doesn't fire mousedown on the parent document,
            // but it does cause the parent window to lose focus.
            const handleWindowBlur = {
                "PermissionPrompt.useEffect.handleWindowBlur": ()=>{
                    dismiss();
                }
            }["PermissionPrompt.useEffect.handleWindowBlur"];
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('blur', handleWindowBlur);
            return ({
                "PermissionPrompt.useEffect": ()=>{
                    document.removeEventListener('mousedown', handleClickOutside);
                    window.removeEventListener('blur', handleWindowBlur);
                }
            })["PermissionPrompt.useEffect"];
        }
    }["PermissionPrompt.useEffect"], [
        isVisible,
        currentRequest,
        resolvePermissionRequest
    ]);
    if (!currentRequest && !isVisible) return null;
    const { id, origin, permission } = currentRequest || {};
    const icon = permissionIcons[permission] || permissionIcons.default;
    const label = permissionLabels[permission] || permissionLabels.default;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: promptRef,
        className: `absolute top-full left-4 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 flex items-start space-x-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 bg-background p-2 rounded-lg border border-border",
                    children: icon
                }, void 0, false, {
                    fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                    lineNumber: 86,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-semibold text-foreground mb-1 leading-snug",
                            children: [
                                origin,
                                " wants to"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                            lineNumber: 90,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-foreground/70 leading-snug mb-4",
                            children: label
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                            lineNumber: 93,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex space-x-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setIsVisible(false);
                                        setTimeout(()=>resolvePermissionRequest(id, false), 300);
                                    },
                                    className: "flex-1 px-3 py-1.5 bg-surface-hover hover:bg-border text-foreground rounded-md text-sm font-medium transition-colors cursor-pointer",
                                    children: "Block"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setIsVisible(false);
                                        setTimeout(()=>resolvePermissionRequest(id, true), 300);
                                    },
                                    className: "flex-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors shadow-md cursor-pointer",
                                    children: "Allow"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                                    lineNumber: 106,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                            lineNumber: 96,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                    lineNumber: 89,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>{
                        setIsVisible(false);
                        setTimeout(()=>resolvePermissionRequest(id, false), 300);
                    },
                    className: "text-foreground/50 hover:text-foreground cursor-pointer",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                        size: 16
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
                    lineNumber: 117,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
            lineNumber: 85,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/PermissionPrompt.js",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
_s(PermissionPrompt, "0r/Ux1enamL9mUMP1l2yX8AyD0Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = PermissionPrompt;
var _c;
__turbopack_context__.k.register(_c, "PermissionPrompt");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/toolbar/SiteSettingsPopup.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SiteSettingsPopup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/camera.mjs [app-client] (ecmascript) <export default as Camera>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.mjs [app-client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.mjs [app-client] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const permissionIcons = {
    media: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
        lineNumber: 6,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0)),
    geolocation: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
        lineNumber: 7,
        columnNumber: 16
    }, ("TURBOPACK compile-time value", void 0)),
    notifications: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
        lineNumber: 8,
        columnNumber: 18
    }, ("TURBOPACK compile-time value", void 0)),
    default: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
        lineNumber: 9,
        columnNumber: 12
    }, ("TURBOPACK compile-time value", void 0))
};
function SiteSettingsPopup({ url, onClose }) {
    _s();
    const { sessionPermissions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const popupRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [showReloadHint, setShowReloadHint] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SiteSettingsPopup.useEffect": ()=>{
            const handleClickOutside = {
                "SiteSettingsPopup.useEffect.handleClickOutside": (e)=>{
                    if (popupRef.current && !popupRef.current.contains(e.target)) {
                        onClose();
                    }
                }
            }["SiteSettingsPopup.useEffect.handleClickOutside"];
            document.addEventListener("mousedown", handleClickOutside);
            return ({
                "SiteSettingsPopup.useEffect": ()=>document.removeEventListener("mousedown", handleClickOutside)
            })["SiteSettingsPopup.useEffect"];
        }
    }["SiteSettingsPopup.useEffect"], [
        onClose
    ]);
    const togglePermission = (origin, perm, currentStatus)=>{
        const newGranted = currentStatus !== 'granted';
        // Revoke first, then set the new state
        if (window.electron) {
            window.electron.respondToPermission({
                id: `toggle-${Date.now()}`,
                origin,
                permission: perm,
                granted: newGranted
            });
        }
        // Update local store
        const updatedPermissions = {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().sessionPermissions
        };
        if (!updatedPermissions[origin]) {
            updatedPermissions[origin] = {};
        }
        updatedPermissions[origin][perm] = newGranted ? 'granted' : 'denied';
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].setState({
            sessionPermissions: updatedPermissions
        });
        setShowReloadHint(true);
    };
    if (!url || url.startsWith('browser://') || url.startsWith('verse://')) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: popupRef,
            className: "absolute top-10 left-0 w-72 bg-surface border border-border rounded-xl shadow-2xl z-50 p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-foreground/70",
                children: "Settings are not available for internal pages."
            }, void 0, false, {
                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                lineNumber: 51,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
            lineNumber: 50,
            columnNumber: 7
        }, this);
    }
    let origin;
    try {
        origin = new URL(url).origin;
    } catch  {
        origin = url;
    }
    const sitePerms = sessionPermissions[origin] || {};
    const hasPerms = Object.keys(sitePerms).length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: popupRef,
        className: "absolute top-10 left-0 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-3 border-b border-border bg-background/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-semibold text-foreground truncate",
                        children: origin
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-foreground/50",
                        children: "Connection is secure"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: "text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3",
                        children: "Permissions"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    !hasPerms ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-foreground/50",
                        children: "No special permissions requested."
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                        lineNumber: 77,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: Object.entries(sitePerms).map(([perm, status])=>{
                            const isGranted = status === 'granted';
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-2 text-foreground/90",
                                        children: [
                                            permissionIcons[perm] || permissionIcons.default,
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm capitalize",
                                                children: perm
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                                lineNumber: 86,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                        lineNumber: 84,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `text-xs font-medium transition-colors ${isGranted ? 'text-green-500' : 'text-red-400'}`,
                                                children: isGranted ? 'Granted' : 'Denied'
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                                lineNumber: 89,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>togglePermission(origin, perm, status),
                                                className: `relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${isGranted ? 'bg-green-500' : 'bg-red-500/60'}`,
                                                title: isGranted ? 'Deny permission' : 'Grant permission',
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${isGranted ? 'translate-x-4' : 'translate-x-0'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                                    lineNumber: 97,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                                lineNumber: 92,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                        lineNumber: 88,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, perm, true, {
                                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                lineNumber: 83,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this),
                    showReloadHint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex items-center justify-between gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 animate-[fadeIn_0.2s_ease-out]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-accent",
                                children: "Reload page to apply changes"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    const { activeTabId, splitTabId, focusedPane } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState();
                                    const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
                                    const webview = document.getElementById(`webview-${tabId}`);
                                    if (webview && webview.reload) {
                                        webview.reload();
                                    }
                                    onClose();
                                },
                                className: "flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover bg-accent/15 hover:bg-accent/25 px-2 py-1 rounded-md transition-colors cursor-pointer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                        size: 12
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                        lineNumber: 123,
                                        columnNumber: 15
                                    }, this),
                                    "Reload"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                        lineNumber: 109,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
                lineNumber: 73,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/toolbar/SiteSettingsPopup.js",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_s(SiteSettingsPopup, "pIbILbPPtSMvy+/t0gc7wTLfXps=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = SiteSettingsPopup;
var _c;
__turbopack_context__.k.register(_c, "SiteSettingsPopup");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/toolbar/NavigationBar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NavigationBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$cw$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-cw.mjs [app-client] (ecmascript) <export default as RotateCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.mjs [app-client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.mjs [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.mjs [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$languages$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Languages$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/languages.mjs [app-client] (ecmascript) <export default as Languages>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.mjs [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.mjs [app-client] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/puzzle.mjs [app-client] (ecmascript) <export default as Puzzle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.mjs [app-client] (ecmascript) <export default as MoreVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSearchSuggestions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useSearchSuggestions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$SuggestionsDropdown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/SuggestionsDropdown.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$PermissionPrompt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/toolbar/PermissionPrompt.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$SiteSettingsPopup$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/toolbar/SiteSettingsPopup.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
function NavigationBar() {
    _s();
    const { toggleAISidebar, isAISidebarOpen, tabs, activeTabId, splitTabId, focusedPane, clearSplitView, navigate, openHistoryTab, bookmarks, toggleBookmark, openDownloadsTab, openExtensionsTab, theme, toggleTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "NavigationBar.useBrowserStore.useShallow": (state)=>({
                toggleAISidebar: state.toggleAISidebar,
                isAISidebarOpen: state.isAISidebarOpen,
                tabs: state.tabs,
                activeTabId: state.activeTabId,
                splitTabId: state.splitTabId,
                focusedPane: state.focusedPane,
                clearSplitView: state.clearSplitView,
                navigate: state.navigate,
                openHistoryTab: state.openHistoryTab,
                bookmarks: state.bookmarks,
                toggleBookmark: state.toggleBookmark,
                openDownloadsTab: state.openDownloadsTab,
                openExtensionsTab: state.openExtensionsTab,
                theme: state.theme,
                toggleTheme: state.toggleTheme
            })
    }["NavigationBar.useBrowserStore.useShallow"]));
    const activePaneTabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
    const activeTab = tabs.find((t)=>t.id === activePaneTabId);
    const [inputValue, setInputValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isFocused, setIsFocused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showOverflowMenu, setShowOverflowMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showSiteSettings, setShowSiteSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { suggestions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSearchSuggestions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchSuggestions"])(inputValue);
    const overflowMenuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NavigationBar.useEffect": ()=>{
            const handleClickOutside = {
                "NavigationBar.useEffect.handleClickOutside": (e)=>{
                    if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target)) {
                        setShowOverflowMenu(false);
                    }
                }
            }["NavigationBar.useEffect.handleClickOutside"];
            document.addEventListener("mousedown", handleClickOutside);
            return ({
                "NavigationBar.useEffect": ()=>document.removeEventListener("mousedown", handleClickOutside)
            })["NavigationBar.useEffect"];
        }
    }["NavigationBar.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NavigationBar.useEffect": ()=>{
            if (activeTab) {
                const isNewTab = activeTab.url === 'browser://newtab';
                // Visually display verse:// instead of browser://
                const displayUrl = activeTab.url.replace('browser://', 'verse://');
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setInputValue(isNewTab ? '' : displayUrl);
                if (isNewTab && inputRef.current) {
                    // Use a small timeout to ensure the tab switch and render are complete
                    setTimeout({
                        "NavigationBar.useEffect": ()=>{
                            inputRef.current?.focus();
                            inputRef.current?.select();
                        }
                    }["NavigationBar.useEffect"], 10);
                }
            }
        }
    }["NavigationBar.useEffect"], [
        activeTab
    ]);
    const isBookmarked = activeTab && bookmarks.some((b)=>b.url === activeTab.url);
    const handleKeyDown = (e)=>{
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            let targetUrl = inputValue.trim();
            // Convert verse:// back to browser:// for internal routing
            if (targetUrl.startsWith('verse://')) {
                targetUrl = targetUrl.replace('verse://', 'browser://');
            }
            navigate(activePaneTabId, targetUrl);
            setIsFocused(false);
        }
    };
    const handleBack = ()=>{
        const webview = document.getElementById(`webview-${activePaneTabId}`);
        if (webview && webview.canGoBack && webview.canGoBack()) {
            webview.goBack();
        } else if (activeTab?.url !== 'browser://newtab') {
            // Save current URL so we can go "forward" back to it later
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().updateTab(activePaneTabId, {
                fallbackForwardUrl: activeTab?.url
            });
            navigate(activePaneTabId, 'browser://newtab');
        }
    };
    const handleForward = ()=>{
        // If we are on the new tab page and have a fallback forward URL, restore it!
        if (activeTab?.url === 'browser://newtab' && activeTab?.fallbackForwardUrl) {
            navigate(activePaneTabId, activeTab.fallbackForwardUrl);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().updateTab(activePaneTabId, {
                fallbackForwardUrl: null
            });
            return;
        }
        const webview = document.getElementById(`webview-${activePaneTabId}`);
        if (webview && webview.canGoForward && webview.canGoForward()) {
            webview.goForward();
        }
    };
    const handleReloadOrStop = ()=>{
        const webview = document.getElementById(`webview-${activePaneTabId}`);
        if (!webview) return;
        if (activeTab?.isLoading && webview.stop) {
            webview.stop();
        } else if (webview.reload) {
            webview.reload();
        }
    };
    const handleHome = ()=>{
        navigate(activePaneTabId, 'browser://newtab');
    };
    const canGoBack = activeTab?.canGoBack || activeTab?.url !== 'browser://newtab';
    const canGoForward = activeTab?.canGoForward || activeTab?.url === 'browser://newtab' && !!activeTab?.fallbackForwardUrl;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-12 bg-surface border-b border-border flex items-center px-4 space-x-4 select-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center space-x-1 text-foreground/70 relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$PermissionPrompt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleBack,
                        "aria-label": "Go back",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none", canGoBack ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 142,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleForward,
                        "aria-label": "Go forward",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none", canGoForward ? "hover:bg-foreground/10 hover:text-foreground" : "opacity-50 cursor-not-allowed"),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 152,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleReloadOrStop,
                        "aria-label": activeTab?.isLoading ? "Stop loading" : "Reload page",
                        className: "p-2 rounded-lg transition-colors hover:bg-foreground/10 hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        children: activeTab?.isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 159,
                            columnNumber: 35
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$cw$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCw$3e$__["RotateCw"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 159,
                            columnNumber: 53
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleHome,
                        "aria-label": "Go home",
                        className: "p-2 rounded-lg transition-colors hover:bg-foreground/10 hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 166,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                lineNumber: 132,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center h-8 bg-background rounded-full px-3 border border-border focus-within:border-accent transition-colors",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowSiteSettings(!showSiteSettings),
                                        className: "mr-2 text-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-foreground/10",
                                        title: "Site settings",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                            lineNumber: 179,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this),
                                    showSiteSettings && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$SiteSettingsPopup$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        url: activeTab?.url,
                                        onClose: ()=>setShowSiteSettings(false)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 182,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                lineNumber: 173,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ref: inputRef,
                                type: "text",
                                value: inputValue,
                                onChange: (e)=>setInputValue(e.target.value),
                                onKeyDown: handleKeyDown,
                                onFocus: ()=>setIsFocused(true),
                                onBlur: ()=>setTimeout(()=>setIsFocused(false), 200),
                                className: "flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder-gray-500 h-full",
                                placeholder: "Search Google or type a URL"
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>toggleBookmark(activeTab?.url, activeTab?.title, activeTab?.favicon),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("p-1 rounded-md transition-colors ml-1", isBookmarked ? "text-yellow-400 fill-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20" : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"),
                                title: isBookmarked ? "Remove bookmark" : "Bookmark this tab",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                    size: 16,
                                    className: isBookmarked ? "fill-current" : ""
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                    lineNumber: 209,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                lineNumber: 199,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 172,
                        columnNumber: 9
                    }, this),
                    isFocused && suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$SuggestionsDropdown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        suggestions: suggestions,
                        onSelect: (suggestion)=>{
                            setInputValue(suggestion);
                            navigate(activeTabId, suggestion);
                            setIsFocused(false);
                        },
                        className: "top-full mt-2 left-0 w-full"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 213,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                lineNumber: 171,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center space-x-1 text-foreground/70",
                ref: overflowMenuRef,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        "aria-label": "Shield Security",
                        className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 228,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openDownloadsTab,
                        "aria-label": "Downloads",
                        className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        title: "Downloads",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 236,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openHistoryTab,
                        "aria-label": "History",
                        className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        title: "History",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 244,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openExtensionsTab,
                        "aria-label": "Extensions",
                        className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        title: "Extensions",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__["Puzzle"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 252,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 246,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-px h-4 bg-border mx-1"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this),
                    splitTabId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: clearSplitView,
                        "aria-label": "Close Split View",
                        className: "p-2 rounded-lg transition-colors flex items-center justify-center bg-accent text-white hover:bg-accent-hover px-3 text-sm font-medium mr-2 min-h-[44px] focus-visible:ring-2 focus-visible:outline-none",
                        children: "Close Split"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 260,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: toggleAISidebar,
                        "aria-label": "Toggle AI Sidebar",
                        className: `p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] focus-visible:ring-2 focus-visible:outline-none ${isAISidebarOpen ? 'bg-accent/20 text-accent hover:bg-accent/30' : 'hover:bg-foreground/10 hover:text-foreground'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 274,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 269,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        "aria-label": "Languages",
                        className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$languages$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Languages$3e$__["Languages"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 278,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 277,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: toggleTheme,
                        "aria-label": `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
                        className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                        title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
                        children: theme === 'dark' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 286,
                            columnNumber: 31
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/toolbar/NavigationBar.js",
                            lineNumber: 286,
                            columnNumber: 51
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex lg:hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowOverflowMenu(!showOverflowMenu),
                                "aria-label": "More tools",
                                className: "p-2 rounded-lg hover:bg-foreground/10 hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__["MoreVertical"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                    lineNumber: 296,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                lineNumber: 291,
                                columnNumber: 11
                            }, this),
                            showOverflowMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            openDownloadsTab();
                                            setShowOverflowMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                                lineNumber: 302,
                                                columnNumber: 17
                                            }, this),
                                            " Downloads"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 301,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            openHistoryTab();
                                            setShowOverflowMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                                lineNumber: 305,
                                                columnNumber: 17
                                            }, this),
                                            " History"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            openExtensionsTab();
                                            setShowOverflowMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__["Puzzle"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                                lineNumber: 308,
                                                columnNumber: 17
                                            }, this),
                                            " Extensions"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 307,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-px bg-border my-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 310,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            toggleTheme();
                                            setShowOverflowMenu(false);
                                        },
                                        className: "w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/10 flex items-center",
                                        children: [
                                            theme === 'dark' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                                lineNumber: 312,
                                                columnNumber: 37
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                                                size: 16,
                                                className: "mr-3 text-foreground/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                                lineNumber: 312,
                                                columnNumber: 93
                                            }, this),
                                            theme === 'dark' ? 'Light Mode' : 'Dark Mode'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                        lineNumber: 311,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                                lineNumber: 300,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/toolbar/NavigationBar.js",
                        lineNumber: 290,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/toolbar/NavigationBar.js",
                lineNumber: 226,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/toolbar/NavigationBar.js",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
_s(NavigationBar, "mVZC1/UrUbxq1ln3kHhhjW7fZNA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSearchSuggestions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchSuggestions"]
    ];
});
_c = NavigationBar;
var _c;
__turbopack_context__.k.register(_c, "NavigationBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/toolbar/BookmarkBar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BookmarkBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function BookmarkBar() {
    _s();
    const { bookmarks, navigate, activeTabId, addTab } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "BookmarkBar.useBrowserStore.useShallow": (state)=>({
                bookmarks: state.bookmarks,
                navigate: state.navigate,
                activeTabId: state.activeTabId,
                addTab: state.addTab
            })
    }["BookmarkBar.useBrowserStore.useShallow"]));
    if (!bookmarks || bookmarks.length === 0) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-8 bg-surface border-b border-border flex items-center px-2 space-x-1 overflow-x-auto no-scrollbar",
        children: bookmarks.map((bookmark)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>navigate(activeTabId, bookmark.url),
                onAuxClick: (e)=>{
                    if (e.button === 1) {
                        e.preventDefault();
                        addTab(bookmark.url);
                    }
                },
                className: "flex items-center max-w-37.5 px-2 py-1 rounded hover:bg-foreground/10 transition-colors text-xs text-foreground/80 hover:text-foreground",
                title: bookmark.title || bookmark.url,
                children: [
                    bookmark.favicon ? // eslint-disable-next-line @next/next/no-img-element
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: bookmark.favicon,
                        className: "w-3.5 h-3.5 mr-1.5 shrink-0 bg-foreground/ rounded-sm",
                        alt: ""
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/BookmarkBar.js",
                        lineNumber: 37,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-3.5 h-3.5 rounded-sm bg-gray-600 shrink-0 mr-1.5"
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/BookmarkBar.js",
                        lineNumber: 39,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "truncate",
                        children: bookmark.title || bookmark.url
                    }, void 0, false, {
                        fileName: "[project]/src/components/toolbar/BookmarkBar.js",
                        lineNumber: 41,
                        columnNumber: 11
                    }, this)
                ]
            }, bookmark.id, true, {
                fileName: "[project]/src/components/toolbar/BookmarkBar.js",
                lineNumber: 23,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/toolbar/BookmarkBar.js",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_s(BookmarkBar, "SaE+pqP4Toi/ocAh7EKi4GmtCNM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = BookmarkBar;
var _c;
__turbopack_context__.k.register(_c, "BookmarkBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ai/AISidebar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AISidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.mjs [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$languages$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Languages$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/languages.mjs [app-client] (ecmascript) <export default as Languages>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$question$2d$mark$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-question-mark.mjs [app-client] (ecmascript) <export default as HelpCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/list.mjs [app-client] (ecmascript) <export default as List>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$pen$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileEdit$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-pen.mjs [app-client] (ecmascript) <export default as FileEdit>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function AISidebar() {
    _s();
    const { setAISidebarOpen, activeTabId, splitTabId, focusedPane, tabs, openRouterApiKey, setOpenRouterApiKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showSettings, setShowSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const scrollToBottom = ()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AISidebar.useEffect": ()=>{
            scrollToBottom();
        }
    }["AISidebar.useEffect"], [
        messages
    ]);
    const getPageContent = async (type = 'text')=>{
        const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
        const webview = document.getElementById(`webview-${tabId}`);
        if (!webview) return "";
        try {
            if (type === 'html') {
                return await webview.executeJavaScript('document.documentElement.outerHTML');
            } else {
                return await webview.executeJavaScript('document.body.innerText');
            }
        } catch (e) {
            console.error("Failed to extract page content", e);
            return "";
        }
    };
    const handleAction = async (endpoint, actionLabel, extraParams = {})=>{
        if (isLoading) return;
        setIsLoading(true);
        setMessages((prev)=>[
                ...prev,
                {
                    role: 'user',
                    content: `Please ${actionLabel.toLowerCase()}`
                }
            ]);
        try {
            const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
            const currentTab = tabs?.find((t)=>t.id === tabId) || {};
            const content = await getPageContent('text');
            if (!content) {
                setMessages((prev)=>[
                        ...prev,
                        {
                            role: 'assistant',
                            content: "I couldn't read the content of this page."
                        }
                    ]);
                setIsLoading(false);
                return;
            }
            const res = await fetch(`/api/ai`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    endpoint,
                    payload: {
                        text: content.substring(0, 15000),
                        title: currentTab.title || '',
                        url: currentTab.url || '',
                        api_key: openRouterApiKey || null,
                        ...extraParams
                    }
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || `Server error: ${res.status}`);
            }
            // Handle the various response formats
            let responseText = "No response received.";
            if (data.answer) responseText = data.answer;
            else if (data.result) responseText = data.result;
            else if (data.faqs) {
                responseText = Array.isArray(data.faqs) ? data.faqs.join('\n\n') : data.faqs;
            }
            setMessages((prev)=>[
                    ...prev,
                    {
                        role: 'assistant',
                        content: responseText
                    }
                ]);
        } catch (err) {
            setMessages((prev)=>[
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Error: ${err.message}`
                    }
                ]);
        } finally{
            setIsLoading(false);
        }
    };
    const handleChat = async ()=>{
        if (!input.trim() || isLoading) return;
        const query = input.trim();
        setInput("");
        setIsLoading(true);
        setMessages((prev)=>[
                ...prev,
                {
                    role: 'user',
                    content: query
                }
            ]);
        try {
            const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
            const currentTab = tabs?.find((t)=>t.id === tabId) || {};
            const html = await getPageContent('html');
            const res = await fetch(`/api/ai`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    endpoint: '/rag',
                    payload: {
                        html: html || "<html><body>No content</body></html>",
                        query: query,
                        chunk_size: 50,
                        overlap: 10,
                        top_k: 3,
                        title: currentTab.title || '',
                        url: currentTab.url || '',
                        selected_text: '',
                        api_key: openRouterApiKey || null
                    }
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || `Server error: ${res.status}`);
            }
            setMessages((prev)=>[
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.answer || data.result || "No response received."
                    }
                ]);
        } catch (err) {
            setMessages((prev)=>[
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Error: ${err.message}`
                    }
                ]);
        } finally{
            setIsLoading(false);
        }
    };
    const actions = [
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 140,
                columnNumber: 13
            }, this),
            label: "Summarize this page",
            endpoint: "/summarize"
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$languages$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Languages$3e$__["Languages"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 141,
                columnNumber: 13
            }, this),
            label: "Translate to English",
            endpoint: "/translate",
            params: {
                target_language: "English"
            }
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$question$2d$mark$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__["HelpCircle"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 142,
                columnNumber: 13
            }, this),
            label: "Explain this article",
            endpoint: "/explain"
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 143,
                columnNumber: 13
            }, this),
            label: "Generate FAQs",
            endpoint: "/faqs"
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 144,
                columnNumber: 13
            }, this),
            label: "List key points",
            endpoint: "/key-points"
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$pen$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileEdit$3e$__["FileEdit"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 145,
                columnNumber: 13
            }, this),
            label: "Create study notes",
            endpoint: "/study-notes"
        }
    ];
    const suggestedQuestions = [
        "What are the pricing plans?",
        "Where is the refund policy?",
        "Who is the founder?"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-5 py-4 border-b border-border",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center font-medium text-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                className: "w-5 h-5 text-accent mr-2"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 159,
                                columnNumber: 11
                            }, this),
                            "AI Assistant"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ai/AISidebar.js",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setAISidebarOpen(false),
                        className: "text-foreground/70 hover:text-foreground p-1 rounded-md transition-colors cursor-pointer",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 166,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ai/AISidebar.js",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto p-5 no-scrollbar flex flex-col space-y-6 relative",
                children: showSettings ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col h-full items-center justify-center text-center space-y-4 animate-[fadeIn_0.2s_ease-out]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                size: 24
                            }, void 0, false, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 176,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 175,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-lg font-bold text-foreground",
                            children: "API Configuration"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 178,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-foreground/70 mb-4 px-4",
                            children: "Enter your OpenRouter API key to power the AI assistant. This key is stored locally on your device."
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 179,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "password",
                            placeholder: "sk-or-v1-...",
                            value: openRouterApiKey,
                            onChange: (e)=>setOpenRouterApiKey(e.target.value),
                            className: "w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 182,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setShowSettings(false),
                            disabled: !openRouterApiKey,
                            className: "w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                            children: "Save & Continue"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 189,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setShowSettings(false),
                            className: "text-xs text-foreground/50 hover:text-foreground/80 cursor-pointer transition-colors",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 196,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ai/AISidebar.js",
                    lineNumber: 174,
                    columnNumber: 11
                }, this) : messages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-bold text-foreground mb-2",
                                    children: "Hello! I'm your AI assistant."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 207,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-foreground/70 leading-relaxed",
                                    children: "I can help you understand, summarize, and work with the content of any web page."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 208,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 206,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-sm font-medium text-foreground/80 mb-3",
                                    children: "Try these actions"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 215,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-2",
                                    children: actions.map((action, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handleAction(action.endpoint, action.label, action.params || {}),
                                            disabled: isLoading,
                                            className: "flex items-center p-2.5 rounded-lg bg-surface border border-border hover:border-border/60 hover:bg-surface-hover transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-accent mr-2.5 group-hover:text-accent-hover transition-colors",
                                                    children: action.icon
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                                    lineNumber: 224,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-foreground/80 font-medium truncate",
                                                    children: action.label
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                                    lineNumber: 227,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, idx, true, {
                                            fileName: "[project]/src/components/ai/AISidebar.js",
                                            lineNumber: 218,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 216,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 214,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-sm font-medium text-foreground/80 mb-3",
                                    children: "Chat with any website"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 235,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col space-y-2",
                                    children: suggestedQuestions.map((q, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setInput(q);
                                            },
                                            className: "text-left text-sm text-foreground/70 bg-surface hover:bg-surface-hover border border-border px-4 py-2.5 rounded-xl transition-colors w-fit cursor-pointer",
                                            children: q
                                        }, idx, false, {
                                            fileName: "[project]/src/components/ai/AISidebar.js",
                                            lineNumber: 238,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 236,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 234,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col space-y-4",
                    children: [
                        messages.map((msg, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `px-4 py-2.5 rounded-2xl max-w-[90%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-accent text-white rounded-br-sm' : 'bg-surface border border-border text-foreground rounded-bl-sm'}`,
                                    children: msg.content
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 253,
                                    columnNumber: 17
                                }, this)
                            }, idx, false, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 252,
                                columnNumber: 15
                            }, this)),
                        isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-start",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-3 rounded-2xl bg-surface border border-border rounded-bl-sm flex items-center space-x-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        size: 14,
                                        className: "text-accent animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ai/AISidebar.js",
                                        lineNumber: 261,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-foreground/70",
                                        children: "AI is thinking..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ai/AISidebar.js",
                                        lineNumber: 262,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 260,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 259,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: messagesEndRef
                        }, void 0, false, {
                            fileName: "[project]/src/components/ai/AISidebar.js",
                            lineNumber: 266,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ai/AISidebar.js",
                    lineNumber: 250,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 171,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 border-t border-border mt-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex items-center bg-surface border border-border rounded-xl focus-within:border-accent/50 p-2 transition-colors",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: input,
                                onChange: (e)=>setInput(e.target.value),
                                onKeyDown: (e)=>e.key === 'Enter' && handleChat(),
                                disabled: isLoading,
                                className: "flex-1 bg-transparent border-none outline-none text-sm text-foreground px-2 disabled:opacity-50",
                                placeholder: "Ask anything about this page..."
                            }, void 0, false, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 275,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleChat,
                                disabled: isLoading || !input.trim(),
                                className: "w-8 h-8 rounded-lg flex items-center justify-center text-accent hover:bg-accent/10 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 289,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 284,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ai/AISidebar.js",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mt-4 px-2 text-xs text-gray-500",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `w-1.5 h-1.5 rounded-full mr-2 ${openRouterApiKey ? 'bg-emerald-500' : 'bg-yellow-500'}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ai/AISidebar.js",
                                        lineNumber: 296,
                                        columnNumber: 13
                                    }, this),
                                    openRouterApiKey ? 'Backend connected' : 'API Key required'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 295,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowSettings(!showSettings),
                                className: "hover:text-foreground transition-colors cursor-pointer",
                                title: "Settings",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ai/AISidebar.js",
                                    lineNumber: 304,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ai/AISidebar.js",
                                lineNumber: 299,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ai/AISidebar.js",
                        lineNumber: 294,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ai/AISidebar.js",
                lineNumber: 273,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ai/AISidebar.js",
        lineNumber: 155,
        columnNumber: 5
    }, this);
}
_s(AISidebar, "bj0Mqz75Ys3k1zVLPcLHnLhiVPI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = AISidebar;
var _c;
__turbopack_context__.k.register(_c, "AISidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/homepage/TopSites.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TopSites
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.mjs [app-client] (ecmascript) <export default as MoreVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const generateColor = (str)=>{
    let hash = 0;
    for(let i = 0; i < str.length; i++){
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `bg-[hsl(${hue},20%,20%)] text-[hsl(${hue},70%,60%)]`;
};
function TopSites() {
    _s();
    const { navigate, activeTabId, history, hiddenTopSites = [], hideTopSite } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const [currentSlide, setCurrentSlide] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isEditing, setIsEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dynamicTopSites = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TopSites.useMemo[dynamicTopSites]": ()=>{
            if (!history || history.length === 0) return [];
            const visits = {};
            history.forEach({
                "TopSites.useMemo[dynamicTopSites]": (entry)=>{
                    // Ignore internal browser pages
                    if (entry.url.startsWith('browser://')) return;
                    const parsedUrl = new URL(entry.url);
                    // Ignore search engine result pages
                    const isSearchPage = parsedUrl.hostname.includes('google.com') && parsedUrl.pathname.startsWith('/search') || parsedUrl.hostname.includes('bing.com') && parsedUrl.pathname.startsWith('/search') || parsedUrl.hostname.includes('duckduckgo.com') && parsedUrl.searchParams.has('q');
                    if (isSearchPage) return;
                    const domain = parsedUrl.hostname.replace('www.', '') || entry.url;
                    const fullHostname = parsedUrl.hostname;
                    // Filter out explicitly hidden sites
                    if (hiddenTopSites.includes(fullHostname)) return;
                    if (!visits[domain]) {
                        visits[domain] = {
                            count: 0,
                            url: entry.url,
                            title: entry.title || domain,
                            favicon: entry.favicon,
                            domain,
                            fullHostname
                        };
                    }
                    visits[domain].count += 1;
                    // Keep the most recent title/favicon
                    if (entry.title) visits[domain].title = entry.title;
                    if (entry.favicon) visits[domain].favicon = entry.favicon;
                }
            }["TopSites.useMemo[dynamicTopSites]"]);
            // Sort by most visited and filter by minimum visits
            const sortedVisits = Object.values(visits).filter({
                "TopSites.useMemo[dynamicTopSites].sortedVisits": (site)=>site.count >= 4
            }["TopSites.useMemo[dynamicTopSites].sortedVisits"]).sort({
                "TopSites.useMemo[dynamicTopSites].sortedVisits": (a, b)=>b.count - a.count
            }["TopSites.useMemo[dynamicTopSites].sortedVisits"]);
            // Map to the required format
            return sortedVisits.slice(0, 18).map({
                "TopSites.useMemo[dynamicTopSites]": (site, index)=>({
                        id: `hist-${index}`,
                        name: site.title,
                        icon: site.domain.charAt(0).toUpperCase(),
                        color: generateColor(site.domain),
                        url: site.url,
                        favicon: site.favicon,
                        fullHostname: site.fullHostname
                    })
            }["TopSites.useMemo[dynamicTopSites]"]);
        }
    }["TopSites.useMemo[dynamicTopSites]"], [
        history,
        hiddenTopSites
    ]);
    if (dynamicTopSites.length === 0) {
        return null;
    }
    const itemsPerSlide = 6;
    const totalPages = Math.ceil(dynamicTopSites.length / itemsPerSlide);
    const visibleSites = dynamicTopSites.slice(currentSlide * itemsPerSlide, (currentSlide + 1) * itemsPerSlide);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-4xl mt-12 flex flex-col items-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center gap-6",
                children: [
                    visibleSites.map((site)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative group",
                            children: [
                                isEditing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>hideTopSite(site.fullHostname),
                                    "aria-label": `Remove ${site.name} from Top Sites`,
                                    className: "absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white z-20 shadow-lg hover:scale-110 transition-transform relative before:absolute before:-inset-2 before:content-[''] focus-visible:ring-2 focus-visible:outline-none",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/homepage/TopSites.js",
                                        lineNumber: 95,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/homepage/TopSites.js",
                                    lineNumber: 90,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        if (!isEditing) navigate(activeTabId, site.url);
                                    },
                                    className: `flex flex-col items-center gap-2 cursor-pointer ${isEditing ? 'animate-wiggle' : ''}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-14 h-14 rounded-2xl bg-surface border border-border group-hover:bg-foreground/10 transition-colors flex items-center justify-center shadow-sm overflow-hidden relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=128`,
                                                    alt: site.name,
                                                    className: "w-8 h-8 rounded-md z-10",
                                                    onError: (e)=>{
                                                        e.currentTarget.style.opacity = 0; // Hide broken image
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/homepage/TopSites.js",
                                                    lineNumber: 106,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `absolute inset-0 flex items-center justify-center font-bold text-xl ${site.color} z-0`,
                                                    children: site.icon
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/homepage/TopSites.js",
                                                    lineNumber: 114,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/homepage/TopSites.js",
                                            lineNumber: 104,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-foreground/80 group-hover:text-foreground truncate max-w-16",
                                            children: site.name
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/homepage/TopSites.js",
                                            lineNumber: 118,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/homepage/TopSites.js",
                                    lineNumber: 98,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, site.id, true, {
                            fileName: "[project]/src/components/homepage/TopSites.js",
                            lineNumber: 88,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsEditing(!isEditing),
                        "aria-label": isEditing ? "Done editing" : "Edit shortcuts",
                        className: `w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors mb-6 focus-visible:ring-2 focus-visible:outline-none ${isEditing ? 'bg-foreground/ text-foreground' : 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'}`,
                        title: isEditing ? "Done editing" : "Edit shortcuts",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__["MoreVertical"], {
                            size: 18
                        }, void 0, false, {
                            fileName: "[project]/src/components/homepage/TopSites.js",
                            lineNumber: 132,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/TopSites.js",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/homepage/TopSites.js",
                lineNumber: 86,
                columnNumber: 7
            }, this),
            totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mt-6",
                children: Array.from({
                    length: totalPages
                }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentSlide(index),
                        "aria-label": `Go to page ${index + 1}`,
                        className: `h-2 rounded-full transition-all cursor-pointer relative before:absolute before:-inset-3 before:content-[''] focus-visible:ring-2 focus-visible:outline-none ${currentSlide === index ? "w-6 bg-white" : "w-2 bg-gray-600 hover:bg-gray-400"}`
                    }, index, false, {
                        fileName: "[project]/src/components/homepage/TopSites.js",
                        lineNumber: 140,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/homepage/TopSites.js",
                lineNumber: 138,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/homepage/TopSites.js",
        lineNumber: 85,
        columnNumber: 5
    }, this);
}
_s(TopSites, "AEL4xTF29nG22kC3O0JAbu7n73Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = TopSites;
var _c;
__turbopack_context__.k.register(_c, "TopSites");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/homepage/HeroSection.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HeroSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSearchSuggestions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useSearchSuggestions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$SuggestionsDropdown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/SuggestionsDropdown.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$TopSites$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/homepage/TopSites.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function HeroSection() {
    _s();
    const { activeTabId, navigate, currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const [inputValue, setInputValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isFocused, setIsFocused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { suggestions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSearchSuggestions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchSuggestions"])(inputValue);
    const handleSearch = (queryOrEvent)=>{
        const q = typeof queryOrEvent === 'string' ? queryOrEvent : inputValue;
        if (q.trim() !== '') {
            navigate(activeTabId, q.trim());
            setIsFocused(false);
        }
    };
    const handleKeyDown = (e)=>{
        if (e.key === 'Enter') {
            handleSearch(inputValue);
        }
    };
    const getGreeting = ()=>{
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };
    const greetingText = ()=>{
        const timeGreeting = getGreeting();
        if (currentUser?.name) {
            return `${timeGreeting}, ${currentUser.name.split(' ')[0]}!`;
        }
        return `${timeGreeting}!`;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full flex flex-col items-center mt-[10vh] mb-[5vh] px-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(107,70,193,0.3)]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: "/favicon.png",
                            alt: "Verse Logo",
                            className: "w-12 h-12 object-contain"
                        }, void 0, false, {
                            fileName: "[project]/src/components/homepage/HeroSection.js",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 border border-accent/40 rounded-full scale-[1.5] rotate-12"
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 border border-blue-500/30 rounded-full scale-[1.3] -rotate-12"
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/homepage/HeroSection.js",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-foreground mb-3 tracking-tight",
                children: [
                    greetingText(),
                    " ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-block animate-wave"
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 59,
                        columnNumber: 26
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/homepage/HeroSection.js",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-foreground/70 mb-8 text-[clamp(1rem,2vw,1.125rem)]",
                children: "What would you like to explore or ask today?"
            }, void 0, false, {
                fileName: "[project]/src/components/homepage/HeroSection.js",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-200 relative flex items-center group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-linear-to-r from-accent/20 to-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex items-center w-full bg-surface border border-border rounded-full p-2 pl-4 focus-within:border-accent/50 focus-within:bg-surface-hover transition-all",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "text-foreground/70 mr-3 w-5 h-5"
                            }, void 0, false, {
                                fileName: "[project]/src/components/homepage/HeroSection.js",
                                lineNumber: 69,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: inputValue,
                                onChange: (e)=>setInputValue(e.target.value),
                                onKeyDown: handleKeyDown,
                                onFocus: ()=>setIsFocused(true),
                                onBlur: ()=>setTimeout(()=>setIsFocused(false), 200),
                                className: "flex-1 bg-transparent border-none outline-none text-foreground placeholder-gray-500 text-base",
                                placeholder: "Search the web or ask AI anything..."
                            }, void 0, false, {
                                fileName: "[project]/src/components/homepage/HeroSection.js",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSearch,
                                className: "bg-accent text-white hover:bg-accent-hover px-5 py-2.5 rounded-full font-medium flex items-center shadow-[0_0_15px_rgba(107,70,193,0.4)] transition-all ml-2 text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                        className: "w-4 h-4 mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/homepage/HeroSection.js",
                                        lineNumber: 84,
                                        columnNumber: 13
                                    }, this),
                                    "AI Search"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/homepage/HeroSection.js",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    isFocused && suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$SuggestionsDropdown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        suggestions: suggestions,
                        onSelect: (suggestion)=>{
                            setInputValue(suggestion);
                            handleSearch(suggestion);
                        },
                        className: "top-full mt-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/homepage/HeroSection.js",
                        lineNumber: 89,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/homepage/HeroSection.js",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$TopSites$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/components/homepage/HeroSection.js",
                lineNumber: 100,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/homepage/HeroSection.js",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
_s(HeroSection, "WFkOtZDhdN5gMyoq5gnAX/FnaeQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSearchSuggestions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchSuggestions"]
    ];
});
_c = HeroSection;
var _c;
__turbopack_context__.k.register(_c, "HeroSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/homepage/RecentTabs.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RecentTabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.mjs [app-client] (ecmascript) <export default as MoreVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)"); // We'll use a placeholder div since we don't have images
;
;
;
const recentItems = [
    {
        id: 1,
        domain: "medium.com",
        title: "The Future of AI in Everyday Life",
        time: "5 min ago",
        color: "bg-blue-900/40",
        icon: "M",
        brandColor: "bg-black"
    },
    {
        id: 2,
        domain: "notion.so",
        title: "AI Browser – Product Roadmap",
        time: "1 hour ago",
        color: "bg-zinc-800",
        icon: "N",
        brandColor: "bg-white text-black"
    },
    {
        id: 3,
        domain: "docs.google.com",
        title: "Project Plan – AI Browser",
        time: "3 hours ago",
        color: "bg-blue-100",
        icon: "☰",
        brandColor: "bg-blue-600 text-white"
    },
    {
        id: 4,
        domain: "youtube.com",
        title: "Building an AI Browser (Full Tutorial)",
        time: "Yesterday",
        color: "bg-red-900/20",
        icon: "▶",
        brandColor: "bg-red-600 text-white"
    }
];
function RecentTabs() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-5xl mx-auto px-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-foreground font-medium mb-4 text-lg tracking-wide",
                children: "Continue where you left off"
            }, void 0, false, {
                fileName: "[project]/src/components/homepage/RecentTabs.js",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                children: recentItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-border/60 transition-all cursor-pointer hover:shadow-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `h-32 w-full ${item.color} relative overflow-hidden flex items-center justify-center border-b border-border`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-16 h-16 bg-foreground/ rounded-lg flex items-center justify-center backdrop-blur-sm shadow-xl",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${item.brandColor}`,
                                            children: item.icon
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/homepage/RecentTabs.js",
                                            lineNumber: 58,
                                            columnNumber: 18
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                                        lineNumber: 57,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-50"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                                        lineNumber: 62,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/homepage/RecentTabs.js",
                                lineNumber: 55,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between items-center mb-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center text-xs text-foreground/70",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `w-4 h-4 rounded-sm mr-2 flex items-center justify-center text-[8px] font-bold ${item.brandColor}`,
                                                        children: item.icon
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                                                        lineNumber: 69,
                                                        columnNumber: 19
                                                    }, this),
                                                    item.domain
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/homepage/RecentTabs.js",
                                                lineNumber: 68,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                "aria-label": "More options",
                                                className: "text-gray-500 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 focus-visible:ring-2 focus-visible:outline-none focus-visible:opacity-100",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__["MoreVertical"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/homepage/RecentTabs.js",
                                                    lineNumber: 75,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/homepage/RecentTabs.js",
                                                lineNumber: 74,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                                        lineNumber: 67,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm text-foreground/90 font-medium line-clamp-2 leading-snug mb-2",
                                        children: item.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                                        lineNumber: 78,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: item.time
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                                        lineNumber: 81,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/homepage/RecentTabs.js",
                                lineNumber: 66,
                                columnNumber: 13
                            }, this)
                        ]
                    }, item.id, true, {
                        fileName: "[project]/src/components/homepage/RecentTabs.js",
                        lineNumber: 50,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/homepage/RecentTabs.js",
                lineNumber: 48,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/homepage/RecentTabs.js",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
_c = RecentTabs;
var _c;
__turbopack_context__.k.register(_c, "RecentTabs");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/homepage/Homepage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Homepage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$HeroSection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/homepage/HeroSection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$RecentTabs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/homepage/RecentTabs.js [app-client] (ecmascript)");
;
;
;
function Homepage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full flex flex-col items-center overflow-y-auto bg-gradient-to-b from-background to-surface",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$HeroSection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/components/homepage/Homepage.js",
                lineNumber: 7,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$RecentTabs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/components/homepage/Homepage.js",
                lineNumber: 8,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/homepage/Homepage.js",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = Homepage;
var _c;
__turbopack_context__.k.register(_c, "Homepage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/browser/HistoryPage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HistoryPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/external-link.mjs [app-client] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
function HistoryPage() {
    _s();
    const { history, clearHistory, removeFromHistory, navigate, activeTabId, addTab } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const filteredHistory = history.filter((item)=>item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.url.toLowerCase().includes(searchQuery.toLowerCase()));
    const formatDate = (timestamp)=>{
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(new Date(timestamp));
    };
    const handleOpenInNewTab = (e, url)=>{
        e.stopPropagation();
        addTab(url);
    };
    const handleRemoveItem = (e, id)=>{
        e.stopPropagation();
        removeFromHistory(id);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full bg-background overflow-y-auto custom-scrollbar flex justify-center p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl w-full flex flex-col h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-8 shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center space-x-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-3 rounded-full bg-accent/20 text-accent",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browser/HistoryPage.js",
                                        lineNumber: 37,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/HistoryPage.js",
                                    lineNumber: 36,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-foreground tracking-tight",
                                    children: "History"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/HistoryPage.js",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/HistoryPage.js",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: clearHistory,
                            "aria-label": "Clear all history",
                            className: "flex items-center px-4 py-2 min-h-[44px] text-sm text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors font-medium focus-visible:ring-2 focus-visible:outline-none",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                    className: "w-4 h-4 mr-2"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/HistoryPage.js",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, this),
                                "Clear History"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/HistoryPage.js",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/HistoryPage.js",
                    lineNumber: 34,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative mb-6 shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                            className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/HistoryPage.js",
                            lineNumber: 52,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Search your history...",
                            value: searchQuery,
                            onChange: (e)=>setSearchQuery(e.target.value),
                            className: "w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 transition-colors placeholder:text-gray-500"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/HistoryPage.js",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/HistoryPage.js",
                    lineNumber: 51,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-12",
                    children: filteredHistory.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center h-48 text-gray-500 space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                className: "w-12 h-12 opacity-20"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/HistoryPage.js",
                                lineNumber: 65,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: searchQuery ? "No matching history found." : "Your history is empty."
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/HistoryPage.js",
                                lineNumber: 66,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browser/HistoryPage.js",
                        lineNumber: 64,
                        columnNumber: 13
                    }, this) : filteredHistory.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onClick: ()=>navigate(activeTabId, item.url),
                            className: "group flex items-center p-4 bg-surface/50 hover:bg-surface border border-transparent hover:border-border rounded-xl cursor-pointer transition-all",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col flex-1 min-w-0 mr-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-foreground/90 font-medium truncate mb-1",
                                            children: item.title
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/HistoryPage.js",
                                            lineNumber: 76,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-500 text-sm truncate",
                                            children: item.url
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/HistoryPage.js",
                                            lineNumber: 77,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/HistoryPage.js",
                                    lineNumber: 75,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-500 text-xs whitespace-nowrap",
                                            children: formatDate(item.timestamp)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/HistoryPage.js",
                                            lineNumber: 80,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>handleOpenInNewTab(e, item.url),
                                            "aria-label": "Open in new tab",
                                            className: "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-accent bg-background rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                            title: "Open in new tab",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browser/HistoryPage.js",
                                                lineNumber: 87,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/HistoryPage.js",
                                            lineNumber: 81,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>handleRemoveItem(e, item.id),
                                            "aria-label": "Remove from history",
                                            className: "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-red-400 bg-background rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                            title: "Remove from history",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browser/HistoryPage.js",
                                                lineNumber: 95,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/HistoryPage.js",
                                            lineNumber: 89,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/HistoryPage.js",
                                    lineNumber: 79,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, item.id, true, {
                            fileName: "[project]/src/components/browser/HistoryPage.js",
                            lineNumber: 70,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/browser/HistoryPage.js",
                    lineNumber: 62,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/browser/HistoryPage.js",
            lineNumber: 33,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browser/HistoryPage.js",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_s(HistoryPage, "zOympJoO3xWpWWSQXUrYYkLBUhs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = HistoryPage;
var _c;
__turbopack_context__.k.register(_c, "HistoryPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/browser/DownloadsPage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DownloadsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.mjs [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Folder$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/folder.mjs [app-client] (ecmascript) <export default as Folder>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file.mjs [app-client] (ecmascript) <export default as FileIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pause.mjs [app-client] (ecmascript) <export default as Pause>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
function DownloadsPage() {
    _s();
    const { downloads, downloadSettings, updateDownloadSettings, clearCompletedDownloads } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DownloadsPage.useEffect": ()=>{
            // Fetch default path if not set
            if (!downloadSettings.defaultPath && window.electron) {
                window.electron.getDefaultDownloadPath().then({
                    "DownloadsPage.useEffect": (path)=>{
                        updateDownloadSettings({
                            defaultPath: path
                        });
                    }
                }["DownloadsPage.useEffect"]);
            }
        }
    }["DownloadsPage.useEffect"], [
        downloadSettings.defaultPath,
        updateDownloadSettings
    ]);
    const formatBytes = (bytes)=>{
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = [
            'B',
            'KB',
            'MB',
            'GB',
            'TB'
        ];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const getProgress = (received, total)=>{
        if (!total) return 0;
        return Math.min(100, Math.round(received / total * 100));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full bg-background text-foreground overflow-hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 overflow-y-auto p-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-4xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-[clamp(1.5rem,4vw,1.875rem)] font-semibold flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                        size: 28,
                                        className: "text-blue-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                        lineNumber: 47,
                                        columnNumber: 15
                                    }, this),
                                    "Downloads"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: clearCompletedDownloads,
                                    "aria-label": "Clear completed downloads",
                                    className: "flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-surface hover:bg-surface-hover transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:outline-none",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/DownloadsPage.js",
                                            lineNumber: 56,
                                            columnNumber: 17
                                        }, this),
                                        "Clear Completed"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                    lineNumber: 51,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                lineNumber: 50,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                        lineNumber: 45,
                        columnNumber: 11
                    }, this),
                    downloads.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center py-20 text-gray-500",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                size: 48,
                                className: "mb-4 opacity-50"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                lineNumber: 65,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-lg",
                                children: "No downloads yet"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                lineNumber: 66,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                        lineNumber: 64,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-4",
                        children: downloads.map((item)=>{
                            const progress = getProgress(item.receivedBytes, item.totalBytes);
                            const isDone = item.state === 'completed';
                            const isCancelled = item.state === 'cancelled';
                            const isPaused = item.state === 'paused';
                            const isInterrupted = item.state === 'interrupted';
                            const isProgressing = item.state === 'progressing';
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-border/60",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-4 overflow-hidden",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", isDone ? "bg-green-500/10 text-green-400" : isCancelled || isInterrupted ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"),
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileIcon$3e$__["FileIcon"], {
                                                            size: 24
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                            lineNumber: 88,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                        lineNumber: 82,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "min-w-0 flex-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "font-medium text-foreground/90 truncate",
                                                                children: item.fileName
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                lineNumber: 91,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-foreground/70 truncate mt-1",
                                                                children: item.url
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                lineNumber: 92,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2 mt-1 text-xs font-medium",
                                                                children: isDone ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-green-400",
                                                                    children: [
                                                                        "Completed • ",
                                                                        formatBytes(item.totalBytes)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                    lineNumber: 95,
                                                                    columnNumber: 31
                                                                }, this) : isCancelled ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-red-400",
                                                                    children: "Cancelled"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                    lineNumber: 97,
                                                                    columnNumber: 31
                                                                }, this) : isInterrupted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-red-400",
                                                                    children: "Interrupted"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                    lineNumber: 99,
                                                                    columnNumber: 31
                                                                }, this) : isPaused ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-400",
                                                                    children: [
                                                                        "Paused • ",
                                                                        formatBytes(item.receivedBytes),
                                                                        " / ",
                                                                        formatBytes(item.totalBytes)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                    lineNumber: 101,
                                                                    columnNumber: 31
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-blue-400",
                                                                    children: [
                                                                        "Downloading • ",
                                                                        formatBytes(item.receivedBytes),
                                                                        " / ",
                                                                        formatBytes(item.totalBytes)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                    lineNumber: 103,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                lineNumber: 93,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                        lineNumber: 90,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                lineNumber: 81,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 ml-4 shrink-0",
                                                children: [
                                                    isProgressing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        "aria-label": "Pause download",
                                                        onClick: ()=>window.electron?.pauseDownload(item.id),
                                                        className: "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-foreground/10 rounded-lg text-foreground/70 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                                        title: "Pause",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__["Pause"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                            lineNumber: 112,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                        lineNumber: 111,
                                                        columnNumber: 27
                                                    }, this),
                                                    isPaused && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        "aria-label": "Resume download",
                                                        onClick: ()=>window.electron?.resumeDownload(item.id),
                                                        className: "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-foreground/10 rounded-lg text-foreground/70 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                                        title: "Resume",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                            lineNumber: 117,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                        lineNumber: 116,
                                                        columnNumber: 27
                                                    }, this),
                                                    (isProgressing || isPaused) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        "aria-label": "Cancel download",
                                                        onClick: ()=>window.electron?.cancelDownload(item.id),
                                                        className: "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-500/20 rounded-lg text-foreground/70 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                                        title: "Cancel",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                            lineNumber: 122,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                        lineNumber: 121,
                                                        columnNumber: 27
                                                    }, this),
                                                    isDone && item.path && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                "aria-label": "Open file",
                                                                onClick: ()=>window.electron?.openFile(item.path),
                                                                className: "px-3 py-1.5 min-h-[44px] text-sm font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                                                children: "Open File"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                lineNumber: 127,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                "aria-label": "Show in folder",
                                                                onClick: ()=>window.electron?.showInFolder(item.path),
                                                                className: "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-foreground/10 rounded-lg text-foreground/70 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:outline-none",
                                                                title: "Show in folder",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Folder$3e$__["Folder"], {
                                                                    size: 18
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                    lineNumber: 131,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                                lineNumber: 130,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, void 0, true)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                                lineNumber: 109,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                        lineNumber: 80,
                                        columnNumber: 21
                                    }, this),
                                    !isDone && !isCancelled && !isInterrupted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("h-full transition-all duration-300 rounded-full", isPaused ? "bg-yellow-500" : "bg-blue-500"),
                                            style: {
                                                width: `${progress}%`
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/DownloadsPage.js",
                                            lineNumber: 140,
                                            columnNumber: 25
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                                        lineNumber: 139,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, item.id, true, {
                                fileName: "[project]/src/components/browser/DownloadsPage.js",
                                lineNumber: 79,
                                columnNumber: 19
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/browser/DownloadsPage.js",
                        lineNumber: 69,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browser/DownloadsPage.js",
                lineNumber: 44,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/browser/DownloadsPage.js",
            lineNumber: 43,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browser/DownloadsPage.js",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_s(DownloadsPage, "wa2AfBSkmjhls6REkxD9dRdLHn8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = DownloadsPage;
var _c;
__turbopack_context__.k.register(_c, "DownloadsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/browser/ExtensionsPage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExtensionsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function ExtensionsPage() {
    _s();
    const { installedExtensions, toggleExtension, uninstallExtension, openExtensionStoreTab } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "ExtensionsPage.useBrowserStore.useShallow": (state)=>({
                installedExtensions: state.installedExtensions,
                toggleExtension: state.toggleExtension,
                uninstallExtension: state.uninstallExtension,
                openExtensionStoreTab: state.openExtensionStoreTab
            })
    }["ExtensionsPage.useBrowserStore.useShallow"]));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full bg-background text-foreground overflow-y-auto p-8 flex flex-col items-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl w-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-8 pb-4 border-b border-border",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-bold flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "28",
                                    height: "28",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M19.07 4.93a10 10 0 0 0-14.14 0l1.42 1.41a8 8 0 1 1 11.3 11.31l1.42 1.42a10 10 0 0 0 0-14.14z"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 22,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "m8 16 1.41-1.41"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 23,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "m14 10 1.41-1.41"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 24,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "m16 8 1.41-1.41"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 25,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "m10 14 1.41-1.41"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 26,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 21,
                                    columnNumber: 13
                                }, this),
                                "Extensions"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 20,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: openExtensionStoreTab,
                            className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "16",
                                    height: "16",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M5 12h14"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 35,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M12 5v14"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 36,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 34,
                                    columnNumber: 13
                                }, this),
                                "Explore More Extensions"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                    lineNumber: 19,
                    columnNumber: 9
                }, this),
                installedExtensions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center justify-center py-20 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "text-gray-500 mb-4",
                            width: "64",
                            height: "64",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                    x: "3",
                                    y: "3",
                                    width: "18",
                                    height: "18",
                                    rx: "2",
                                    ry: "2"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 45,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "9",
                                    y1: "3",
                                    x2: "9",
                                    y2: "21"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 46,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 44,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-medium text-foreground/80 mb-2",
                            children: "No extensions installed"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 48,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-500 mb-6",
                            children: "Enhance your browser with powerful native features."
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 49,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: openExtensionStoreTab,
                            className: "px-6 py-2.5 bg-surface hover:bg-surface-hover text-foreground border border-border rounded-md transition-colors",
                            children: "Open Extension Store"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 50,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                    lineNumber: 43,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                    children: installedExtensions.map((ext)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `bg-surface border ${ext.isEnabled ? 'border-border' : 'border-border opacity-60'} rounded-lg p-5 flex flex-col transition-all`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start justify-between mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-3xl",
                                            children: ext.icon || "🧩"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 62,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "relative inline-flex items-center cursor-pointer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    className: "sr-only peer",
                                                    checked: ext.isEnabled,
                                                    onChange: ()=>toggleExtension(ext.id)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                                    lineNumber: 64,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                                    lineNumber: 70,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 63,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 61,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-semibold mb-1 truncate",
                                    children: ext.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 73,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-foreground/70 mb-4 grow text-sm leading-relaxed",
                                    children: ext.description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 74,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mt-auto pt-4 border-t border-border",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-xs font-medium px-2 py-1 rounded-full ${ext.isEnabled ? 'bg-blue-900/30 text-blue-400' : 'bg-surface-hover text-foreground/70'}`,
                                            children: ext.isEnabled ? 'Enabled' : 'Disabled'
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 76,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>uninstallExtension(ext.id),
                                            className: "text-xs text-red-400 hover:text-red-300 hover:underline px-2 py-1",
                                            children: "Remove"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                            lineNumber: 79,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                                    lineNumber: 75,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, ext.id, true, {
                            fileName: "[project]/src/components/browser/ExtensionsPage.js",
                            lineNumber: 60,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/browser/ExtensionsPage.js",
                    lineNumber: 58,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/browser/ExtensionsPage.js",
            lineNumber: 18,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browser/ExtensionsPage.js",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(ExtensionsPage, "pVVioYjKb+MSvG60VNNLdiXMOpg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = ExtensionsPage;
var _c;
__turbopack_context__.k.register(_c, "ExtensionsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/browser/ExtensionStorePage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExtensionStorePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const AVAILABLE_EXTENSIONS = [
    {
        id: "ext-color-picker",
        name: "Color Auto-Picker",
        description: "Click any pixel on the screen to instantly copy its exact HEX color code to your clipboard.",
        icon: "🎨",
        category: "Design"
    },
    {
        id: "ext-dark-mode",
        name: "Universal Dark Mode",
        description: "Force a dark theme on every website you visit by intelligently inverting colors on bright pages.",
        icon: "🌙",
        category: "Design"
    },
    {
        id: "ext-ad-blocker",
        name: "Verse Shield (Ad Blocker)",
        description: "Built-in network interceptor that blocks ads and trackers instantly before they even load.",
        icon: "🛡️",
        category: "Privacy"
    },
    {
        id: "ext-web-clipper",
        name: "Sidebar Notes",
        description: "Highlight text on a webpage, right-click, and save it to a permanent notebook in your sidebar.",
        icon: "📝",
        category: "Productivity"
    },
    {
        id: "ext-pip",
        name: "Picture-in-Picture",
        description: "Pop out a video from a tab into a floating, resizable window that stays on top of your screen.",
        icon: "🖼️",
        category: "Media"
    },
    {
        id: "ext-password-manager",
        name: "Vault (Password Manager)",
        description: "A secure, encrypted page to manage logins and auto-fill your usernames and passwords.",
        icon: "🔑",
        category: "Privacy"
    }
];
function ExtensionStorePage() {
    _s();
    const { installedExtensions, installExtension, openExtensionsTab } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "ExtensionStorePage.useBrowserStore.useShallow": (state)=>({
                installedExtensions: state.installedExtensions,
                installExtension: state.installExtension,
                openExtensionsTab: state.openExtensionsTab
            })
    }["ExtensionStorePage.useBrowserStore.useShallow"]));
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const filteredExtensions = AVAILABLE_EXTENSIONS.filter((ext)=>ext.name.toLowerCase().includes(searchQuery.toLowerCase()) || ext.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const isInstalled = (id)=>installedExtensions.some((e)=>e.id === id);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full bg-background text-foreground overflow-y-auto p-8 flex flex-col items-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-5xl w-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-bold flex items-center gap-3 mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "28",
                                            height: "28",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            className: "text-blue-500",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 78,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "14 2 14 8 20 8"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 79,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M2 15h10"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 80,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "m9 18 3-3-3-3"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 81,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                            lineNumber: 77,
                                            columnNumber: 15
                                        }, this),
                                        "Extension Store"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-foreground/70",
                                    children: "Discover and install native features to enhance your browsing experience."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 85,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                            lineNumber: 75,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: openExtensionsTab,
                            className: "px-4 py-2 bg-surface hover:bg-surface-hover text-foreground border border-border rounded-md transition-colors text-sm font-medium whitespace-nowrap",
                            children: "Manage My Extensions"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                            lineNumber: 88,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                    lineNumber: 74,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-8 relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",
                            width: "18",
                            height: "18",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "11",
                                    cy: "11",
                                    r: "8"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 99,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "21",
                                    y1: "21",
                                    x2: "16.65",
                                    y2: "16.65"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 100,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Search for extensions...",
                            value: searchQuery,
                            onChange: (e)=>setSearchQuery(e.target.value),
                            className: "w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                            lineNumber: 102,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                    lineNumber: 97,
                    columnNumber: 9
                }, this),
                filteredExtensions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center py-12",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 text-lg",
                        children: [
                            'No extensions found matching "',
                            searchQuery,
                            '".'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                        lineNumber: 114,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                    lineNumber: 113,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6",
                    children: filteredExtensions.map((ext)=>{
                        const installed = isInstalled(ext.id);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-surface border border-border rounded-xl p-6 flex flex-col hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-4 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-14 h-14 bg-surface-hover/50 rounded-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform",
                                            children: ext.icon
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                            lineNumber: 124,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-lg font-bold text-foreground truncate",
                                                    children: ext.name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 128,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-block px-2 py-0.5 mt-1 bg-surface-hover text-foreground/70 text-xs rounded-full font-medium",
                                                    children: ext.category
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 129,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                            lineNumber: 127,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 123,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-foreground/70 mb-6 grow leading-relaxed",
                                    children: ext.description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 135,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>!installed && installExtension(ext),
                                    disabled: installed,
                                    className: `w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${installed ? 'bg-surface-hover text-foreground/70 cursor-not-allowed border border-border/80' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`,
                                    children: installed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "16",
                                                height: "16",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "20 6 9 17 4 12"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                    lineNumber: 151,
                                                    columnNumber: 27
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                                lineNumber: 150,
                                                columnNumber: 25
                                            }, this),
                                            "Installed"
                                        ]
                                    }, void 0, true) : 'Install Feature'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                                    lineNumber: 139,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, ext.id, true, {
                            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                            lineNumber: 122,
                            columnNumber: 17
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/src/components/browser/ExtensionStorePage.js",
                    lineNumber: 117,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/browser/ExtensionStorePage.js",
            lineNumber: 72,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browser/ExtensionStorePage.js",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_s(ExtensionStorePage, "7c1GGHI5C+WvDhO1KNm7v4qg78Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = ExtensionStorePage;
var _c;
__turbopack_context__.k.register(_c, "ExtensionStorePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/browser/SettingsPage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SettingsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2d$smartphone$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MonitorSmartphone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/monitor-smartphone.mjs [app-client] (ecmascript) <export default as MonitorSmartphone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.mjs [app-client] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function SettingsPage() {
    _s();
    const { bookmarkBarVisibility, setBookmarkBarVisibility, downloadSettings, updateDownloadSettings, sessionPermissions, revokePermission, clearSessionPermissions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "SettingsPage.useBrowserStore.useShallow": (state)=>({
                bookmarkBarVisibility: state.bookmarkBarVisibility,
                setBookmarkBarVisibility: state.setBookmarkBarVisibility,
                downloadSettings: state.downloadSettings,
                updateDownloadSettings: state.updateDownloadSettings,
                sessionPermissions: state.sessionPermissions,
                revokePermission: state.revokePermission,
                clearSessionPermissions: state.clearSessionPermissions
            })
    }["SettingsPage.useBrowserStore.useShallow"]));
    const handleSelectFolder = async ()=>{
        if (window.electron) {
            const path = await window.electron.selectDownloadFolder();
            if (path) {
                updateDownloadSettings({
                    defaultPath: path
                });
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full bg-background text-foreground overflow-y-auto flex justify-center py-10 font-sans",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full max-w-3xl px-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-10 flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-10 h-10 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2d$smartphone$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MonitorSmartphone$3e$__["MonitorSmartphone"], {
                                size: 24
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/SettingsPage.js",
                                lineNumber: 44,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-[clamp(1.5rem,4vw,1.875rem)] font-semibold",
                            children: "Settings"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/SettingsPage.js",
                    lineNumber: 42,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-medium text-foreground/90 mb-4 border-b border-border pb-2",
                            children: "Appearance"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-surface rounded-xl border border-border overflow-hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-5 py-4 border-b border-border flex items-center justify-between",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-base font-medium text-foreground",
                                                children: "Bookmarks Bar"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browser/SettingsPage.js",
                                                lineNumber: 56,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-foreground/70 mt-1",
                                                children: "Choose when the bookmarks bar is visible"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browser/SettingsPage.js",
                                                lineNumber: 57,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browser/SettingsPage.js",
                                        lineNumber: 55,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                    lineNumber: 54,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-2 flex flex-col space-y-1 bg-background",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setBookmarkBarVisibility('always'),
                                            className: "w-full text-left px-4 py-3 rounded-lg flex items-center justify-between hover:bg-foreground/10 transition-colors cursor-pointer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-foreground/90",
                                                    children: "Always show"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 66,
                                                    columnNumber: 17
                                                }, this),
                                                bookmarkBarVisibility === 'always' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                    size: 18,
                                                    className: "text-blue-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 67,
                                                    columnNumber: 56
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                            lineNumber: 62,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setBookmarkBarVisibility('new-tab'),
                                            className: "w-full text-left px-4 py-3 rounded-lg flex items-center justify-between hover:bg-foreground/10 transition-colors cursor-pointer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-foreground/90",
                                                    children: "Only show on New Tab"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 73,
                                                    columnNumber: 17
                                                }, this),
                                                bookmarkBarVisibility === 'new-tab' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                    size: 18,
                                                    className: "text-blue-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 74,
                                                    columnNumber: 57
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                            lineNumber: 69,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                    lineNumber: 61,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/SettingsPage.js",
                    lineNumber: 50,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-medium text-foreground/90 mb-4 border-b border-border pb-2",
                            children: "Downloads"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-surface rounded-xl border border-border overflow-hidden",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-5 py-4 border-b border-border",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-foreground mb-2",
                                                    children: "Default Download Location"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 88,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            readOnly: true,
                                                            value: downloadSettings.defaultPath,
                                                            className: "flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground/80 focus:outline-none"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                                            lineNumber: 90,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: handleSelectFolder,
                                                            className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap",
                                                            children: "Change Location"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                                            lineNumber: 96,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 89,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                            lineNumber: 87,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "flex items-center gap-3 cursor-pointer group",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: downloadSettings.askEveryTime,
                                                    onChange: (e)=>updateDownloadSettings({
                                                            askEveryTime: e.target.checked
                                                        }),
                                                    className: "w-4 h-4 rounded border-border/60 bg-background text-blue-500 focus:ring-blue-500 cursor-pointer"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 106,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium text-foreground group-hover:text-foreground/90 transition-colors",
                                                            children: "Ask where to save each file before downloading"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                                            lineNumber: 113,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-foreground/70 mt-1",
                                                            children: "If unchecked, files will automatically save to your default location."
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                                            lineNumber: 114,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 112,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                            lineNumber: 105,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                    lineNumber: 86,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/SettingsPage.js",
                                lineNumber: 85,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 84,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/SettingsPage.js",
                    lineNumber: 81,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-medium text-foreground/90 mb-4 border-b border-border pb-2 flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this),
                                "Site Settings (Current Session)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 124,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-surface rounded-xl border border-border overflow-hidden",
                            children: Object.keys(sessionPermissions).length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-5 py-6 text-center text-foreground/50 text-sm",
                                children: "No active site permissions for this session."
                            }, void 0, false, {
                                fileName: "[project]/src/components/browser/SettingsPage.js",
                                lineNumber: 131,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "divide-y divide-border",
                                children: [
                                    Object.entries(sessionPermissions).map(([origin, perms])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "p-4 flex flex-col gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-foreground/90",
                                                    children: origin
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 138,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-wrap gap-2",
                                                    children: Object.entries(perms).map(([perm, status])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full text-xs",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "capitalize",
                                                                    children: [
                                                                        perm,
                                                                        ":"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                                    lineNumber: 142,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: status === 'granted' ? 'text-green-500' : 'text-red-500',
                                                                    children: status
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                                    lineNumber: 143,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>revokePermission(origin, perm),
                                                                    className: "ml-1 text-foreground/40 hover:text-red-400 transition-colors",
                                                                    title: `Revoke ${perm}`,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                                        size: 12
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/browser/SettingsPage.js",
                                                                        lineNumber: 151,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                                    lineNumber: 146,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, perm, true, {
                                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                                            lineNumber: 141,
                                                            columnNumber: 25
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/browser/SettingsPage.js",
                                                    lineNumber: 139,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, origin, true, {
                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                            lineNumber: 137,
                                            columnNumber: 19
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "p-4 bg-background border-t border-border flex justify-end",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: clearSessionPermissions,
                                            className: "px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors text-sm font-medium",
                                            children: "Clear All Session Permissions"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browser/SettingsPage.js",
                                            lineNumber: 160,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browser/SettingsPage.js",
                                        lineNumber: 159,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browser/SettingsPage.js",
                                lineNumber: 135,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/browser/SettingsPage.js",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browser/SettingsPage.js",
                    lineNumber: 123,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/browser/SettingsPage.js",
            lineNumber: 39,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browser/SettingsPage.js",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(SettingsPage, "lG3wd8k2kGKg2Hr3rQnirKYfTK0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = SettingsPage;
var _c;
__turbopack_context__.k.register(_c, "SettingsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/browser/WebviewContainer.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WebviewContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react/shallow.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$Homepage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/homepage/Homepage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$HistoryPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browser/HistoryPage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$DownloadsPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browser/DownloadsPage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$ExtensionsPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browser/ExtensionsPage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$ExtensionStorePage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browser/ExtensionStorePage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$SettingsPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browser/SettingsPage.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
function TabWebview({ tab, isActive, onFocus, styleClass }) {
    _s();
    const webviewRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { updateTab, addToHistory, updateHistoryTitle, checkLoginState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "TabWebview.useBrowserStore.useShallow": (state)=>({
                updateTab: state.updateTab,
                addToHistory: state.addToHistory,
                updateHistoryTitle: state.updateHistoryTitle,
                checkLoginState: state.checkLoginState
            })
    }["TabWebview.useBrowserStore.useShallow"]));
    // Track the internal URL to avoid reacting to our own navigation events
    const internalUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(tab.url);
    // Only set the HTML src attribute once on mount
    const [initialUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(tab.url);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TabWebview.useEffect": ()=>{
            const webview = webviewRef.current;
            if (!webview) return;
            const handleNavigate = {
                "TabWebview.useEffect.handleNavigate": (e)=>{
                    internalUrl.current = e.url;
                    addToHistory(e.url);
                    updateTab(tab.id, {
                        url: e.url,
                        canGoBack: webview.canGoBack(),
                        canGoForward: webview.canGoForward(),
                        error: null // clear error on navigation
                    });
                }
            }["TabWebview.useEffect.handleNavigate"];
            const handleTitleUpdate = {
                "TabWebview.useEffect.handleTitleUpdate": (e)=>{
                    updateTab(tab.id, {
                        title: e.title
                    });
                    updateHistoryTitle(internalUrl.current, e.title);
                }
            }["TabWebview.useEffect.handleTitleUpdate"];
            const handleFaviconUpdate = {
                "TabWebview.useEffect.handleFaviconUpdate": (e)=>{
                    if (e.favicons && e.favicons.length > 0) {
                        updateTab(tab.id, {
                            favicon: e.favicons[0]
                        });
                    }
                }
            }["TabWebview.useEffect.handleFaviconUpdate"];
            const handleStartLoading = {
                "TabWebview.useEffect.handleStartLoading": ()=>updateTab(tab.id, {
                        isLoading: true,
                        error: null
                    })
            }["TabWebview.useEffect.handleStartLoading"];
            const handleStopLoading = {
                "TabWebview.useEffect.handleStopLoading": ()=>{
                    updateTab(tab.id, {
                        isLoading: false,
                        canGoBack: webview.canGoBack(),
                        canGoForward: webview.canGoForward()
                    });
                    if (internalUrl.current && internalUrl.current.includes('google.com')) {
                        checkLoginState();
                    }
                }
            }["TabWebview.useEffect.handleStopLoading"];
            const handleFailLoad = {
                "TabWebview.useEffect.handleFailLoad": (e)=>{
                    // Ignore abort errors (-3) as they are typically caused by navigating away
                    // before the page finishes loading
                    if (e.errorCode !== -3) {
                        updateTab(tab.id, {
                            isLoading: false,
                            error: e.errorDescription
                        });
                    }
                }
            }["TabWebview.useEffect.handleFailLoad"];
            const handleMediaStarted = {
                "TabWebview.useEffect.handleMediaStarted": ()=>updateTab(tab.id, {
                        isPlayingAudio: true
                    })
            }["TabWebview.useEffect.handleMediaStarted"];
            const handleMediaPaused = {
                "TabWebview.useEffect.handleMediaPaused": ()=>updateTab(tab.id, {
                        isPlayingAudio: false
                    })
            }["TabWebview.useEffect.handleMediaPaused"];
            webview.addEventListener('did-navigate', handleNavigate);
            webview.addEventListener('did-navigate-in-page', handleNavigate);
            webview.addEventListener('page-title-updated', handleTitleUpdate);
            webview.addEventListener('page-favicon-updated', handleFaviconUpdate);
            webview.addEventListener('did-start-loading', handleStartLoading);
            webview.addEventListener('did-stop-loading', handleStopLoading);
            webview.addEventListener('did-fail-load', handleFailLoad);
            webview.addEventListener('media-started-playing', handleMediaStarted);
            webview.addEventListener('media-paused', handleMediaPaused);
            // Apply mute state as soon as the webview is ready
            const handleDomReady = {
                "TabWebview.useEffect.handleDomReady": ()=>{
                    try {
                        if (webviewRef.current) {
                            webviewRef.current.setAudioMuted(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().tabs.find({
                                "TabWebview.useEffect.handleDomReady": (t)=>t.id === tab.id
                            }["TabWebview.useEffect.handleDomReady"])?.isMuted || false);
                        }
                    } catch (e) {
                        console.error("Failed to set audio muted on dom-ready", e);
                    }
                }
            }["TabWebview.useEffect.handleDomReady"];
            webview.addEventListener('dom-ready', handleDomReady);
            // Prevent new windows from middle-clicking links, open as new tabs instead
            const handleNewWindow = {
                "TabWebview.useEffect.handleNewWindow": (e)=>{
                    if (e.preventDefault) e.preventDefault();
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().addTab(e.url, 'New Tab', tab.id);
                }
            }["TabWebview.useEffect.handleNewWindow"];
            webview.addEventListener('new-window', handleNewWindow);
            return ({
                "TabWebview.useEffect": ()=>{
                    webview.removeEventListener('did-navigate', handleNavigate);
                    webview.removeEventListener('did-navigate-in-page', handleNavigate);
                    webview.removeEventListener('page-title-updated', handleTitleUpdate);
                    webview.removeEventListener('page-favicon-updated', handleFaviconUpdate);
                    webview.removeEventListener('did-start-loading', handleStartLoading);
                    webview.removeEventListener('did-stop-loading', handleStopLoading);
                    webview.removeEventListener('did-fail-load', handleFailLoad);
                    webview.removeEventListener('media-started-playing', handleMediaStarted);
                    webview.removeEventListener('media-paused', handleMediaPaused);
                    webview.removeEventListener('dom-ready', handleDomReady);
                    webview.removeEventListener('new-window', handleNewWindow);
                    if (onFocus) webview.removeEventListener('focus', onFocus);
                }
            })["TabWebview.useEffect"];
        }
    }["TabWebview.useEffect"], [
        tab.id,
        updateTab,
        addToHistory,
        updateHistoryTitle,
        checkLoginState,
        onFocus
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TabWebview.useEffect": ()=>{
            const webview = webviewRef.current;
            if (webview && onFocus) {
                webview.addEventListener('focus', onFocus);
            }
            return ({
                "TabWebview.useEffect": ()=>{
                    if (webview && onFocus) webview.removeEventListener('focus', onFocus);
                }
            })["TabWebview.useEffect"];
        }
    }["TabWebview.useEffect"], [
        onFocus
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TabWebview.useEffect": ()=>{
            if (webviewRef.current) {
                try {
                    webviewRef.current.setAudioMuted(tab.isMuted);
                } catch (e) {
                // Ignored: webview might not be dom-ready yet, it will be handled by the dom-ready listener
                }
            }
        }
    }["TabWebview.useEffect"], [
        tab.isMuted
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TabWebview.useEffect": ()=>{
            // If the URL was changed from the outside (e.g. address bar)
            if (tab.url !== internalUrl.current) {
                internalUrl.current = tab.url;
                const webview = webviewRef.current;
                if (webview) {
                    try {
                        if (typeof webview.loadURL === 'function') {
                            webview.loadURL(tab.url);
                        } else {
                            webview.src = tab.url;
                        }
                    } catch (e) {
                        // Fallback if loadURL fails (e.g. before dom-ready)
                        webview.src = tab.url;
                    }
                }
            }
        }
    }["TabWebview.useEffect"], [
        tab.url
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TabWebview.useEffect": ()=>{
            if (!isActive || !window.electron?.onKeyboardShortcut) return;
            const cleanup = window.electron.onKeyboardShortcut({
                "TabWebview.useEffect.cleanup": (action)=>{
                    const webview = webviewRef.current;
                    if (!webview) return;
                    try {
                        if (action === 'reload') {
                            webview.reload();
                        } else if (action === 'hard-reload') {
                            webview.reloadIgnoringCache();
                        }
                    } catch (e) {
                        console.error('Failed to reload webview:', e);
                    }
                }
            }["TabWebview.useEffect.cleanup"]);
            return cleanup;
        }
    }["TabWebview.useEffect"], [
        isActive
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `absolute ${styleClass ? styleClass : 'inset-0 w-full h-full'} ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
        children: [
            tab.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-background text-foreground",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-red-500 mb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "64",
                            height: "64",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "12",
                                    cy: "12",
                                    r: "10"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/WebviewContainer.js",
                                    lineNumber: 188,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "12",
                                    y1: "8",
                                    x2: "12",
                                    y2: "12"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/WebviewContainer.js",
                                    lineNumber: 189,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "12",
                                    y1: "16",
                                    x2: "12.01",
                                    y2: "16"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browser/WebviewContainer.js",
                                    lineNumber: 190,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 187,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 186,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-semibold mb-2",
                        children: "This site can't be reached"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 193,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-foreground/70 mb-6",
                        children: tab.url
                    }, void 0, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-surface p-4 rounded-lg border border-border",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-foreground/80 font-mono",
                            children: [
                                "ERR: ",
                                tab.error
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 196,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 195,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browser/WebviewContainer.js",
                lineNumber: 185,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("webview", {
                ref: webviewRef,
                id: `webview-${tab.id}`,
                src: initialUrl,
                className: `w-full h-full border-none outline-none bg-white ${tab.error ? 'opacity-0' : 'opacity-100'}`,
                allowpopups: "true"
            }, void 0, false, {
                fileName: "[project]/src/components/browser/WebviewContainer.js",
                lineNumber: 200,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/browser/WebviewContainer.js",
        lineNumber: 183,
        columnNumber: 5
    }, this);
}
_s(TabWebview, "KPxllNHiGrA89yxR9EBj904+vJA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = TabWebview;
function WebviewContainer() {
    _s1();
    const { tabs, activeTabId, splitTabId, focusedPane, setFocusedPane, isDraggingTab } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShallow"])({
        "WebviewContainer.useBrowserStore.useShallow": (state)=>({
                tabs: state.tabs,
                activeTabId: state.activeTabId,
                splitTabId: state.splitTabId,
                focusedPane: state.focusedPane,
                setFocusedPane: state.setFocusedPane,
                isDraggingTab: state.isDraggingTab
            })
    }["WebviewContainer.useBrowserStore.useShallow"]));
    const [isStacked, setIsStacked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebviewContainer.useEffect": ()=>{
            const handleResize = {
                "WebviewContainer.useEffect.handleResize": ()=>setIsStacked(window.innerWidth < 768)
            }["WebviewContainer.useEffect.handleResize"];
            handleResize(); // Initial check
            window.addEventListener('resize', handleResize);
            return ({
                "WebviewContainer.useEffect": ()=>window.removeEventListener('resize', handleResize)
            })["WebviewContainer.useEffect"];
        }
    }["WebviewContainer.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full relative flex",
        children: [
            tabs.map((tab)=>{
                const isPrimary = tab.id === activeTabId;
                const isSecondary = tab.id === splitTabId;
                const isActive = isPrimary || isSecondary;
                let styleClass = 'inset-0 w-full h-full';
                if (splitTabId) {
                    if (isStacked) {
                        if (isPrimary) {
                            styleClass = `top-0 w-full h-1/2 border-b border-border ${focusedPane === 'primary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
                        } else if (isSecondary) {
                            styleClass = `bottom-0 w-full h-1/2 ${focusedPane === 'secondary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
                        }
                    } else {
                        if (isPrimary) {
                            styleClass = `left-0 w-1/2 h-full border-r border-border ${focusedPane === 'primary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
                        } else if (isSecondary) {
                            styleClass = `right-0 w-1/2 h-full ${focusedPane === 'secondary' ? 'ring-2 ring-inset ring-accent z-20' : ''}`;
                        }
                    }
                }
                const handleClick = ()=>{
                    if (isPrimary) setFocusedPane('primary');
                    if (isSecondary) setFocusedPane('secondary');
                };
                const isNewTab = tab.url === 'browser://newtab';
                const isHistory = tab.url === 'browser://history';
                if (isNewTab) {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleClick,
                        className: `absolute ${styleClass} ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$homepage$2f$Homepage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 271,
                            columnNumber: 15
                        }, this)
                    }, tab.id, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 266,
                        columnNumber: 13
                    }, this);
                }
                if (isHistory) {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleClick,
                        className: `absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$HistoryPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 283,
                            columnNumber: 15
                        }, this)
                    }, tab.id, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 278,
                        columnNumber: 13
                    }, this);
                }
                if (tab.url === 'browser://downloads') {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleClick,
                        className: `absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$DownloadsPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 295,
                            columnNumber: 15
                        }, this)
                    }, tab.id, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 290,
                        columnNumber: 13
                    }, this);
                }
                if (tab.url === 'browser://extensions') {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleClick,
                        className: `absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$ExtensionsPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 307,
                            columnNumber: 15
                        }, this)
                    }, tab.id, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 302,
                        columnNumber: 13
                    }, this);
                }
                if (tab.url === 'browser://extensions/store') {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleClick,
                        className: `absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$ExtensionStorePage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 319,
                            columnNumber: 15
                        }, this)
                    }, tab.id, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 314,
                        columnNumber: 13
                    }, this);
                }
                if (tab.url === 'browser://settings') {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleClick,
                        className: `absolute ${styleClass} bg-background ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$SettingsPage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/browser/WebviewContainer.js",
                            lineNumber: 331,
                            columnNumber: 15
                        }, this)
                    }, tab.id, false, {
                        fileName: "[project]/src/components/browser/WebviewContainer.js",
                        lineNumber: 326,
                        columnNumber: 13
                    }, this);
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabWebview, {
                    tab: tab,
                    isActive: isActive,
                    styleClass: styleClass,
                    onFocus: handleClick
                }, tab.id, false, {
                    fileName: "[project]/src/components/browser/WebviewContainer.js",
                    lineNumber: 336,
                    columnNumber: 16
                }, this);
            }),
            isDraggingTab && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-50 w-full h-full cursor-grabbing"
            }, void 0, false, {
                fileName: "[project]/src/components/browser/WebviewContainer.js",
                lineNumber: 341,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/browser/WebviewContainer.js",
        lineNumber: 233,
        columnNumber: 5
    }, this);
}
_s1(WebviewContainer, "xOndOmGI/sFv9OzXmgCQS+Zrzns=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c1 = WebviewContainer;
var _c, _c1;
__turbopack_context__.k.register(_c, "TabWebview");
__turbopack_context__.k.register(_c1, "WebviewContainer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/layout/BrowserLayout.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BrowserLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useBrowserStore.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$TopBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/toolbar/TopBar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$NavigationBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/toolbar/NavigationBar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$BookmarkBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/toolbar/BookmarkBar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ai$2f$AISidebar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ai/AISidebar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$WebviewContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browser/WebviewContainer.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function BrowserLayout() {
    _s();
    const { isAISidebarOpen, openHistoryTab, openBookmarksTab, toggleBookmark, tabs, activeTabId, setActiveTab, addTab, removeTab, updateTab, mergeTabs, bookmarkBarVisibility, setBookmarkBarVisibility, downloadSettings, updateDownloadSettings, openDownloadsTab, openExtensionsTab, theme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowserLayout.useEffect": ()=>{
            if (theme === 'light') {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
        }
    }["BrowserLayout.useEffect"], [
        theme
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowserLayout.useEffect": ()=>{
            // Fetch default path if not set
            if (!downloadSettings?.defaultPath && window.electron) {
                window.electron.getDefaultDownloadPath().then({
                    "BrowserLayout.useEffect": (path)=>{
                        updateDownloadSettings({
                            defaultPath: path
                        });
                    }
                }["BrowserLayout.useEffect"]);
            }
        }
    }["BrowserLayout.useEffect"], [
        downloadSettings?.defaultPath,
        updateDownloadSettings
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowserLayout.useEffect": ()=>{
            const searchParams = new URLSearchParams(window.location.search);
            const initialTabParam = searchParams.get('initialTab');
            if (initialTabParam) {
                try {
                    const initialTab = JSON.parse(initialTabParam);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].setState({
                        tabs: [
                            initialTab
                        ],
                        activeTabId: initialTab.id
                    });
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (e) {
                    console.error("Failed to parse initialTab", e);
                }
            }
        }
    }["BrowserLayout.useEffect"], [
        updateTab
    ]);
    // Listen for cross-window tab merge events and new window events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowserLayout.useEffect": ()=>{
            if (!window.electron) return;
            // Main process asks us to send our tabs for merging into another window
            const cleanupRequest = window.electron.onRequestTabsForMerge?.({
                "BrowserLayout.useEffect": ()=>{
                    const currentTabs = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().tabs;
                    window.electron.sendTabsForMerge(currentTabs);
                }
            }["BrowserLayout.useEffect"]);
            // Main process sends us tabs from another window to absorb
            const cleanupReceive = window.electron.onReceiveMergedTabs?.({
                "BrowserLayout.useEffect": (incomingTabs)=>{
                    mergeTabs(incomingTabs);
                }
            }["BrowserLayout.useEffect"]);
            // Main process tells us a webview tried to open a new window
            const cleanupNewWindow = window.electron.onWebviewNewWindow?.({
                "BrowserLayout.useEffect": (data)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().addTab(data.url, 'New Tab');
                }
            }["BrowserLayout.useEffect"]);
            return ({
                "BrowserLayout.useEffect": ()=>{
                    cleanupRequest?.();
                    cleanupReceive?.();
                    cleanupNewWindow?.();
                }
            })["BrowserLayout.useEffect"];
        }
    }["BrowserLayout.useEffect"], [
        mergeTabs
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowserLayout.useEffect": ()=>{
            const handleKeyDown = {
                "BrowserLayout.useEffect.handleKeyDown": (e)=>{
                    // Must have Ctrl or Cmd key
                    if (!e.ctrlKey && !e.metaKey) return;
                    const key = e.key.toLowerCase();
                    if (key === 'h') {
                        e.preventDefault();
                        openHistoryTab();
                        return;
                    }
                    if (key === 'j') {
                        e.preventDefault();
                        openDownloadsTab();
                        return;
                    }
                    if (key === 'e' && e.shiftKey) {
                        e.preventDefault();
                        openExtensionsTab();
                        return;
                    }
                    if (key === 'b' && e.shiftKey) {
                        e.preventDefault();
                        setBookmarkBarVisibility(bookmarkBarVisibility === 'always' ? 'new-tab' : 'always');
                        return;
                    }
                    if (key === 'r') {
                        e.preventDefault();
                        const webview = document.getElementById(`webview-${activeTabId}`);
                        if (webview && webview.reload) {
                            webview.reload();
                        }
                        return;
                    }
                    if (key === 'd') {
                        e.preventDefault();
                        const activeTab = tabs.find({
                            "BrowserLayout.useEffect.handleKeyDown.activeTab": (t)=>t.id === activeTabId
                        }["BrowserLayout.useEffect.handleKeyDown.activeTab"]);
                        if (activeTab && activeTab.url) {
                            toggleBookmark(activeTab.url, activeTab.title, activeTab.favicon);
                        }
                        return;
                    }
                    if (key === 'o' && e.shiftKey) {
                        e.preventDefault();
                        openBookmarksTab();
                        return;
                    }
                    if (key === 't') {
                        e.preventDefault();
                        addTab();
                        return;
                    }
                    if (key === 'w') {
                        e.preventDefault();
                        removeTab(activeTabId);
                        return;
                    }
                    // Ctrl + 1-8
                    if (key >= '1' && key <= '8') {
                        e.preventDefault();
                        const index = parseInt(key) - 1;
                        if (index < tabs.length) {
                            setActiveTab(tabs[index].id);
                        }
                        return;
                    }
                    // Ctrl + 9 (Last tab)
                    if (key === '9') {
                        e.preventDefault();
                        if (tabs.length > 0) {
                            setActiveTab(tabs[tabs.length - 1].id);
                        }
                        return;
                    }
                    // Ctrl + Tab and Ctrl + Shift + Tab
                    if (key === 'tab') {
                        e.preventDefault();
                        const currentIndex = tabs.findIndex({
                            "BrowserLayout.useEffect.handleKeyDown.currentIndex": (t)=>t.id === activeTabId
                        }["BrowserLayout.useEffect.handleKeyDown.currentIndex"]);
                        if (currentIndex === -1) return;
                        let nextIndex;
                        if (e.shiftKey) {
                            // Previous tab
                            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        } else {
                            // Next tab
                            nextIndex = (currentIndex + 1) % tabs.length;
                        }
                        setActiveTab(tabs[nextIndex].id);
                        return;
                    }
                }
            }["BrowserLayout.useEffect.handleKeyDown"];
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "BrowserLayout.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["BrowserLayout.useEffect"];
        }
    }["BrowserLayout.useEffect"], [
        openHistoryTab,
        openBookmarksTab,
        openDownloadsTab,
        openExtensionsTab,
        toggleBookmark,
        tabs,
        activeTabId,
        setActiveTab,
        addTab,
        removeTab,
        bookmarkBarVisibility,
        setBookmarkBarVisibility
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowserLayout.useEffect": ()=>{
            if (!window.electron) return;
            window.electron.onDownloadStarted({
                "BrowserLayout.useEffect": (item)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().addDownload(item);
                }
            }["BrowserLayout.useEffect"]);
            window.electron.onDownloadProgress({
                "BrowserLayout.useEffect": (data)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().updateDownload(data.id, data);
                }
            }["BrowserLayout.useEffect"]);
            window.electron.onDownloadDone({
                "BrowserLayout.useEffect": (data)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"].getState().updateDownload(data.id, data);
                }
            }["BrowserLayout.useEffect"]);
        }
    }["BrowserLayout.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-screen w-screen bg-background overflow-hidden font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col w-full z-50 relative shadow-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$TopBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/components/layout/BrowserLayout.js",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$NavigationBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/components/layout/BrowserLayout.js",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this),
                    (bookmarkBarVisibility === 'always' || bookmarkBarVisibility === 'new-tab' && tabs.find((t)=>t.id === activeTabId)?.url === 'browser://newtab') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$toolbar$2f$BookmarkBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/components/layout/BrowserLayout.js",
                        lineNumber: 241,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/BrowserLayout.js",
                lineNumber: 237,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 overflow-hidden relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 bg-surface relative overflow-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browser$2f$WebviewContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/layout/BrowserLayout.js",
                            lineNumber: 249,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/layout/BrowserLayout.js",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    isAISidebarOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-87.5 border-l border-border bg-background shrink-0 shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.5)] z-20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ai$2f$AISidebar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/src/components/layout/BrowserLayout.js",
                            lineNumber: 255,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/layout/BrowserLayout.js",
                        lineNumber: 254,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/BrowserLayout.js",
                lineNumber: 246,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/layout/BrowserLayout.js",
        lineNumber: 235,
        columnNumber: 5
    }, this);
}
_s(BrowserLayout, "u96yBQKATOfh1mvbRdFoHhC8iGU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useBrowserStore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowserStore"]
    ];
});
_c = BrowserLayout;
var _c;
__turbopack_context__.k.register(_c, "BrowserLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1vw06k6._.js.map