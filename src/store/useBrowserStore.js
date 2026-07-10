import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';

export const formatUrl = (input) => {
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

export const useBrowserStore = create(
  persist(
    (set, get) => ({
      firebaseUid: null,
      lastHistoryDocId: null,
      history: [],
  bookmarks: [],
  bookmarkBarVisibility: 'always', // 'always' or 'new-tab'
  installedExtensions: [],
  downloads: [],
  hiddenTopSites: [],
  downloadSettings: {
    defaultPath: '',
    askEveryTime: false,
  },
  sessionPermissions: {}, // { [origin]: { [permission]: 'granted' | 'denied' } }
  activePermissionRequests: [], // { id, origin, permission }
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
      isPinned: false,
    },
  ],
  activeTabId: '1',
  
  // AI Sidebar State
  isAISidebarOpen: false,
  openRouterApiKey: '',
  setOpenRouterApiKey: (key) => set({ openRouterApiKey: key }),

  // Split View State
  splitTabId: null,
  focusedPane: 'primary',
  setSplitTabId: (id) => set({ splitTabId: id, focusedPane: 'secondary' }),
  clearSplitView: () => set({ splitTabId: null, focusedPane: 'primary' }),
  setFocusedPane: (pane) => set({ focusedPane: pane }),

  // Dragging State
  isDraggingTab: false,
  setIsDraggingTab: (isDragging) => set({ isDraggingTab: isDragging }),

  // Theme State
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  // Actions
  navigate: (id, input) => set((state) => {
    const finalUrl = formatUrl(input);
    return {
      tabs: state.tabs.map(tab => tab.id === id ? { ...tab, url: finalUrl, title: finalUrl } : tab)
    };
  }),

  addTab: (url = 'browser://newtab', title = 'New Tab', afterTabId = null) => set((state) => {
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
      isPinned: false,
    };
    
    if (afterTabId) {
      const idx = state.tabs.findIndex(t => t.id === afterTabId);
      if (idx !== -1) {
        const newTabs = [...state.tabs];
        newTabs.splice(idx + 1, 0, newTab);
        return { tabs: newTabs, activeTabId: newId };
      }
    }
    
    return {
      tabs: [...state.tabs, newTab],
      activeTabId: newId,
    };
  }),

  removeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(tab => tab.id !== id);
    if (newTabs.length === 0) {
      // If there are other windows open, close this window instead of opening a new tab
      if (window.electron?.getWindowCount) {
        window.electron.getWindowCount().then(count => {
          if (count > 1) {
            window.electron.close();
          }
        });
      }
      // Meanwhile, create a new tab as fallback (will be invisible if window closes)
      const newId = Date.now().toString();
      return {
        tabs: [{ 
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
          isPinned: false,
        }],
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
        const closedIndex = state.tabs.findIndex(tab => tab.id === id);
        const safeIndex = Math.min(closedIndex, newTabs.length - 1);
        const nextActive = newTabs[Math.max(0, safeIndex)];
        newActiveId = nextActive.id;
      }
    }
    
    return {
      tabs: newTabs,
      activeTabId: newActiveId,
      splitTabId: newSplitId,
      focusedPane: newFocusedPane,
    };
  }),

  // Merge tabs received from another window into this one
  mergeTabs: (incomingTabs) => set((state) => {
    // Give each incoming tab a new unique ID to avoid collisions
    const newTabs = incomingTabs.map(t => ({
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    }));
    return {
      tabs: [...state.tabs, ...newTabs],
      activeTabId: newTabs[newTabs.length - 1].id,
    };
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, ...updates } : tab)
  })),

  toggleMute: (id) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, isMuted: !tab.isMuted } : tab)
  })),

  removeMultipleTabs: (ids) => set((state) => {
    const idsToRemove = new Set(ids);
    let newTabs = state.tabs.filter(t => !idsToRemove.has(t.id));
    if (newTabs.length === 0) {
      if (window.electron?.getWindowCount) {
        window.electron.getWindowCount().then(count => {
          if (count > 1) {
            window.electron.close();
          }
        });
      }
      const newId = Date.now().toString();
      newTabs = [{ 
        id: newId, title: 'New Tab', url: 'browser://newtab', favicon: null,
        isLoading: false, canGoBack: false, canGoForward: false, error: null,
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false,
      }];
      return { tabs: newTabs, activeTabId: newId, splitTabId: null, focusedPane: 'primary' };
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
    return { tabs: newTabs, activeTabId: newActiveId, splitTabId: newSplitId, focusedPane: newFocusedPane };
  }),

  togglePin: (id) => set((state) => {
    let newTabs = state.tabs.map(tab => tab.id === id ? { ...tab, isPinned: !tab.isPinned } : tab);
    // Move unpinned tab to the right of all pinned tabs, or pinned tab to the right of all pinned tabs
    const targetTab = newTabs.find(t => t.id === id);
    newTabs = newTabs.filter(t => t.id !== id);
    
    if (targetTab.isPinned) {
      // Find the index of the first unpinned tab to insert before it
      let insertIdx = newTabs.findIndex(t => !t.isPinned);
      if (insertIdx === -1) insertIdx = newTabs.length;
      newTabs.splice(insertIdx, 0, targetTab);
    } else {
      // Find the index of the first unpinned tab to insert before it, but it's now unpinned so it goes after pinned tabs
      let insertIdx = newTabs.findIndex(t => !t.isPinned);
      if (insertIdx === -1) insertIdx = newTabs.length;
      newTabs.splice(insertIdx, 0, targetTab);
    }
    return { tabs: newTabs };
  }),

  reorderTabs: (oldIndex, newIndex) => set((state) => {
    const newTabs = [...state.tabs];
    const movedTab = newTabs[oldIndex];
    const targetTab = newTabs[newIndex];
    
    // Prevent dragging pinned tabs into unpinned area and vice versa
    if (movedTab.isPinned !== targetTab.isPinned) {
      return state;
    }

    newTabs.splice(oldIndex, 1);
    newTabs.splice(newIndex, 0, movedTab);
    return { tabs: newTabs };
  }),

  toggleAISidebar: () => set((state) => ({ isAISidebarOpen: !state.isAISidebarOpen })),
  setAISidebarOpen: (isOpen) => set({ isAISidebarOpen: isOpen }),

  openHistoryTab: () => set((state) => {
    const existingHistoryTab = state.tabs.find(t => t.url === 'browser://history');
    if (existingHistoryTab) {
      return { activeTabId: existingHistoryTab.id };
    }
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
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
        isPinned: false,
      }],
      activeTabId: newId,
    };
  }),

  openExtensionsTab: () => set((state) => {
    const existingTab = state.tabs.find(t => t.url === 'browser://extensions');
    if (existingTab) return { activeTabId: existingTab.id };
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
        id: newId, title: 'Extensions', url: 'browser://extensions', favicon: null,
        isLoading: false, canGoBack: false, canGoForward: false, error: null,
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false,
      }],
      activeTabId: newId,
    };
  }),

  openSettingsTab: () => set((state) => {
    const existingTab = state.tabs.find(t => t.url === 'browser://settings');
    if (existingTab) return { activeTabId: existingTab.id };
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
        id: newId, title: 'Settings', url: 'browser://settings', favicon: null,
        isLoading: false, canGoBack: false, canGoForward: false, error: null,
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false,
      }],
      activeTabId: newId,
    };
  }),

  openExtensionStoreTab: () => set((state) => {
    const existingTab = state.tabs.find(t => t.url === 'browser://store');
    if (existingTab) return { activeTabId: existingTab.id };
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
        id: newId, title: 'Extension Store', url: 'browser://store', favicon: null,
        isLoading: false, canGoBack: false, canGoForward: false, error: null,
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false,
      }],
      activeTabId: newId,
    };
  }),

  openDownloadsTab: () => set((state) => {
    const existingTab = state.tabs.find(t => t.url === 'browser://downloads');
    if (existingTab) {
      return { activeTabId: existingTab.id };
    }
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
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
        isPinned: false,
      }],
      activeTabId: newId,
    };
  }),

  // History Actions
  addToHistory: async (url) => {
    if (url.startsWith('browser://')) return;
    const uid = get().firebaseUid;
    if (uid) {
      try {
        const docRef = await addDoc(collection(db, "users", uid, "history"), {
          url: url,
          title: url,
          favicon: null,
          visit_time: Date.now()
        });
        set({ lastHistoryDocId: docRef.id });
      } catch (err) {
        console.error("Failed to save history to Firebase", err);
      }
    }
  },

  updateHistoryTitle: async (url, title) => {
    const state = get();
    if (state.firebaseUid && state.lastHistoryDocId) {
      try {
        await updateDoc(doc(db, "users", state.firebaseUid, "history", state.lastHistoryDocId), {
          title: title
        });
      } catch (err) {
        console.error("Failed to update history title in Firebase", err);
      }
    }
  },

  clearHistory: () => set((state) => state), // Handled by HistoryPage directly now
  removeFromHistory: (id) => set((state) => state), // Handled by HistoryPage directly now

  // Bookmarks Actions
  toggleBookmark: async (url, title, favicon) => {
    if (url.startsWith('browser://')) return;
    const state = get();
    const isBookmarked = state.bookmarks.some(b => b.url === url);
    const uid = state.firebaseUid;

    if (isBookmarked) {
      const bToRm = state.bookmarks.find(b => b.url === url);
      set({ bookmarks: state.bookmarks.filter(b => b.url !== url) });
      if (uid && bToRm) {
        try {
          await deleteDoc(doc(db, "users", uid, "bookmarks", bToRm.id));
        } catch (e) { console.error(e); }
      }
    } else {
      const newId = Date.now().toString();
      const safeTitle = title === undefined ? url : title;
      const safeFavicon = favicon === undefined ? null : favicon;
      const newBookmark = { id: newId, url, title: safeTitle, favicon: safeFavicon, timestamp: Date.now() };
      set({ bookmarks: [...state.bookmarks, newBookmark] });
      if (uid) {
        try {
          await setDoc(doc(db, "users", uid, "bookmarks", newId), newBookmark);
        } catch (e) { console.error(e); }
      }
    }
  },
  
  removeBookmark: async (id) => {
    set((state) => ({ bookmarks: state.bookmarks.filter(b => b.id !== id) }));
    const uid = get().firebaseUid;
    if (uid) {
      try {
        await deleteDoc(doc(db, "users", uid, "bookmarks", id));
      } catch (e) { console.error(e); }
    }
  },

  // Settings Actions
  setBookmarkBarVisibility: (visibility) => set({ bookmarkBarVisibility: visibility }),
  hideTopSite: (domain) => set((state) => ({
    hiddenTopSites: [...(state.hiddenTopSites || []), domain]
  })),

  // Auth Actions
  checkLoginState: async (force = false) => {
    try {
      if (typeof window !== 'undefined' && window.electron?.checkGoogleLogin) {
        const result = await window.electron.checkGoogleLogin(force);
        set({ 
          isLoggedIn: result.isLoggedIn, 
          userProfilePic: result.profilePic,
          currentUser: result.currentUser || null,
          accounts: result.accounts || []
        });

        // Sync scraped profile with Firestore
        const uid = get().firebaseUid;
        if (uid && result.isLoggedIn && result.currentUser) {
          try {
            await setDoc(doc(db, "users", uid), {
              name: result.currentUser.name,
              email: result.currentUser.email,
              pic: result.currentUser.pic,
              lastLogin: serverTimestamp()
            }, { merge: true });
          } catch (e) { console.error("Firestore sync error:", e); }
        }
      }
    } catch (e) {
      console.error('Failed to check login state:', e);
    }
  },

  switchAccount: (email) => set((state) => {
    if (!state.accounts) return state;
    const account = state.accounts.find(a => a.email === email);
    if (account) {
      return { currentUser: account, userProfilePic: account.pic };
    }
    return state;
  }),

  logoutGoogle: async () => {
    try {
      if (typeof window !== 'undefined' && window.electron?.logoutGoogle) {
        await window.electron.logoutGoogle();
      }
      set({ isLoggedIn: false, userProfilePic: null, currentUser: null, accounts: [] });
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  },

  // Download actions
  setDownloads: (downloads) => set({ downloads }),
  addDownload: async (download) => {
    set((state) => ({ downloads: [download, ...(state.downloads || [])] }));
  },
  updateDownload: async (id, data) => {
    set((state) => ({
      downloads: (state.downloads || []).map(d => d.id === id ? { ...d, ...data } : d),
    }));
  },
  updateDownloadSettings: (settings) => set((state) => {
    const newSettings = { ...state.downloadSettings, ...settings };
    window.electron?.updateDownloadSettings(newSettings);
    return { downloadSettings: newSettings };
  }),
  clearCompletedDownloads: () => set((state) => {
    return {
      downloads: (state.downloads || []).filter(d => d.state === 'progressing' || d.state === 'paused'),
    };
  }),

  // Extension Actions
  installExtension: (extension) => set((state) => {
    if (state.installedExtensions.some(e => e.id === extension.id)) return state;
    return { installedExtensions: [...state.installedExtensions, { ...extension, isEnabled: true }] };
  }),
  uninstallExtension: (id) => set((state) => ({
    installedExtensions: state.installedExtensions.filter(e => e.id !== id)
  })),
  toggleExtension: (id) => set((state) => ({
    installedExtensions: state.installedExtensions.map(e => 
      e.id === id ? { ...e, isEnabled: !e.isEnabled } : e
    )
  })),

  setHiddenTopSites: (sites) => set({ hiddenTopSites: sites }),

  // --- Permissions Manager ---
  addPermissionRequest: (request) => set((state) => ({
    activePermissionRequests: [...state.activePermissionRequests, request]
  })),
  resolvePermissionRequest: (id, granted) => set((state) => {
    const request = state.activePermissionRequests.find(r => r.id === id);
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
    const updatedPermissions = { ...state.sessionPermissions };
    if (!updatedPermissions[request.origin]) {
      updatedPermissions[request.origin] = {};
    }
    updatedPermissions[request.origin][request.permission] = granted ? 'granted' : 'denied';

    return {
      sessionPermissions: updatedPermissions,
      activePermissionRequests: state.activePermissionRequests.filter(r => r.id !== id)
    };
  }),
  revokePermission: (origin, permission) => set((state) => {
    if (window.electron) {
      window.electron.revokePermission({ origin, permission });
    }
    const updatedPermissions = { ...state.sessionPermissions };
    if (updatedPermissions[origin]) {
      delete updatedPermissions[origin][permission];
      if (Object.keys(updatedPermissions[origin]).length === 0) {
        delete updatedPermissions[origin];
      }
    }
    return { sessionPermissions: updatedPermissions };
  }),
  clearSessionPermissions: () => set({ sessionPermissions: {}, activePermissionRequests: [] }),

    }),
    {
      name: 'browser-storage',
      partialize: (state) => ({
        history: state.history,
        bookmarks: state.bookmarks,
        bookmarkBarVisibility: state.bookmarkBarVisibility,
        installedExtensions: state.installedExtensions,
        hiddenTopSites: state.hiddenTopSites,
        downloads: state.downloads,
        downloadSettings: state.downloadSettings,
        isLoggedIn: state.isLoggedIn,
        userProfilePic: state.userProfilePic,
        currentUser: state.currentUser,
        accounts: state.accounts,
        openRouterApiKey: state.openRouterApiKey,
        firebaseUid: state.firebaseUid,
        // Notice: sessionPermissions and activePermissionRequests are intentionally omitted here!
      }),
    }
  )
);

// Initialize Firebase Auth listener immediately when the store is loaded in the browser
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    let uid = null;
    if (!user) {
      try {
        const userCred = await signInAnonymously(auth);
        uid = userCred.user.uid;
      } catch (e) {
        console.error("Firebase Anonymous Auth failed", e);
      }
    } else {
      uid = user.uid;
    }
    
    if (uid) {
      useBrowserStore.setState({ firebaseUid: uid });
      // Fetch bookmarks from Firebase and merge/overwrite
      try {
        const querySnapshot = await getDocs(collection(db, "users", uid, "bookmarks"));
        const firebaseBookmarks = [];
        querySnapshot.forEach((doc) => {
          firebaseBookmarks.push({ id: doc.id, ...doc.data() });
        });
        
        if (firebaseBookmarks.length > 0) {
          const currentBookmarks = useBrowserStore.getState().bookmarks || [];
          const merged = [...currentBookmarks];
          let changed = false;
          
          firebaseBookmarks.forEach(fbBookmark => {
            if (!merged.find(b => b.url === fbBookmark.url)) {
              merged.push(fbBookmark);
              changed = true;
            }
          });
          
          if (changed || currentBookmarks.length === 0) {
            useBrowserStore.setState({ bookmarks: merged });
          }
        }
      } catch (e) {
        console.error("Failed to fetch bookmarks from Firebase", e);
      }
    }
  });
}
