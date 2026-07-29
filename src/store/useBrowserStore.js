import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';

const getProfileId = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('profileId') || 'main';
  }
  return 'main';
};
const currentProfileId = getProfileId();

const getFbProfile = (state) => {
  if (state.profileId === 'main' && state.currentUser && state.currentUser.email) {
    return state.currentUser.email;
  }
  return String(state.profileId);
};

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

const initialIsIncognito = false;

export const useBrowserStore = create(
  persist(
    (set, get) => ({
      profileId: currentProfileId,
      isIncognitoWindow: initialIsIncognito,
      firebaseUid: null,
      lastHistoryDocId: null,
      history: [],
  readingList: [],
  bookmarks: [],
  bookmarkBarVisibility: 'always', // 'always' or 'new-tab'
  showHomeButton: false, // Hidden by default like Chrome
  installedExtensions: [],
  downloads: [],
  hiddenTopSites: [],
  downloadSettings: {
    defaultPath: '',
    askEveryTime: false,
  },
  recentlyClosedTabs: [], // { url, title, favicon, closedAt }
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
      error: null,
      history: ['browser://newtab'],
      historyIndex: 0,
      isPlayingAudio: false,
      isMuted: false,
      isPinned: false,
      zoomLevel: 0,
      findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
    },
  ],
  activeTabId: '1',
  
  // AI Sidebar State
  isAISidebarOpen: false,
  openRouterApiKey: '',
  setOpenRouterApiKey: (key) => set({ openRouterApiKey: key }),
  aiQueryToExecute: null,
  setAiQueryToExecute: (query) => set({ aiQueryToExecute: query }),
  // AI Chat History
  aiChatSessions: [],
  currentAiSessionId: null,
  selectedAiModel: 'meta-llama/llama-3.1-8b-instruct',
  setSelectedAiModel: (model) => set({ selectedAiModel: model }),
  researchMode: false,
  setResearchMode: (mode) => set({ researchMode: mode }),
  saveAiSession: async (session) => {
    set((state) => {
      const exists = state.aiChatSessions.find(s => s.id === session.id);
      if (exists) {
        return { aiChatSessions: state.aiChatSessions.map(s => s.id === session.id ? session : s) };
      }
      return { aiChatSessions: [session, ...state.aiChatSessions].slice(0, 50) };
    });
    
    const state = get();
    const fbProfile = getFbProfile(state);
    
    if (state.firebaseUid && !state.isIncognitoWindow) {
      try {
        const sessionPath = doc(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", session.id);
        
        // Save session metadata (without messages)
        await setDoc(sessionPath, {
          title: session.title || "New chat",
          updatedAt: session.updatedAt || Date.now(),
          lastSynced: serverTimestamp()
        }, { merge: true });
        
        // Save each message as a sub-document in the ChatHistory sub-collection
        const messagesCol = collection(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", session.id, "ChatHistory");
        if (session.messages && session.messages.length > 0) {
          for (let i = 0; i < session.messages.length; i++) {
            const msg = session.messages[i];
            const msgId = `msg_${i}`;
            const cleanMsg = JSON.parse(JSON.stringify(msg));
            await setDoc(doc(messagesCol, msgId), {
              ...cleanMsg,
              index: i,
              timestamp: cleanMsg.timestamp || Date.now()
            });
          }
        }
      } catch (e) {
        console.error("Failed to save AI session to Firebase", e);
      }
    }
  },
  deleteAiSession: async (id) => {
    set((state) => ({
      aiChatSessions: state.aiChatSessions.filter(s => s.id !== id),
      currentAiSessionId: state.currentAiSessionId === id ? null : state.currentAiSessionId,
    }));
    
    const state = get();
    const fbProfile = getFbProfile(state);

    if (state.firebaseUid && !state.isIncognitoWindow) {
      try {
        // Delete all ChatHistory docs in the sub-collection first
        const messagesCol = collection(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", id, "ChatHistory");
        const msgSnapshot = await getDocs(messagesCol);
        for (const msgDoc of msgSnapshot.docs) {
          await deleteDoc(msgDoc.ref);
        }
        // Then delete the session document
        await deleteDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", id));
      } catch (e) {
        console.error("Failed to delete AI session from Firebase", e);
      }
    }
  },
  setCurrentAiSessionId: (id) => set({ currentAiSessionId: id }),
  clearAllAiSessions: async () => {
    const state = get();
    const sessionsToDelete = state.aiChatSessions;
    set({ aiChatSessions: [], currentAiSessionId: null });
    
    const fbProfile = getFbProfile(state);

    if (state.firebaseUid && !state.isIncognitoWindow) {
      try {
        for (const session of sessionsToDelete) {
          // Delete ChatHistory sub-collection for each session
          const messagesCol = collection(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", session.id, "ChatHistory");
          const msgSnapshot = await getDocs(messagesCol);
          for (const msgDoc of msgSnapshot.docs) {
            await deleteDoc(msgDoc.ref);
          }
          // Delete the session document
          await deleteDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", session.id));
        }
      } catch (e) {
        console.error("Failed to clear AI sessions from Firebase", e);
      }
    }
  },

  syncFirebaseData: async () => {
    const state = get();
    if (!state.firebaseUid) return;
    
    const fbProfile = getFbProfile(state);

    // Fetch bookmarks
    try {
      const querySnapshot = await getDocs(collection(db, "users", state.firebaseUid, "profiles", fbProfile, "bookmarks"));
      const firebaseBookmarks = [];
      querySnapshot.forEach((doc) => {
        firebaseBookmarks.push({ id: doc.id, ...doc.data() });
      });
      
      if (firebaseBookmarks.length > 0) {
        const currentBookmarks = get().bookmarks || [];
        const merged = [...currentBookmarks];
        let changed = false;
        
        firebaseBookmarks.forEach(fbBookmark => {
          if (!merged.find(b => b.url === fbBookmark.url)) {
            merged.push(fbBookmark);
            changed = true;
          }
        });
        
        if (changed || currentBookmarks.length === 0) {
          set({ bookmarks: merged });
        }
      }
    } catch (e) { console.error("Failed to fetch bookmarks", e); }

    // Fetch Reading List
    try {
      const querySnapshot = await getDocs(collection(db, "users", state.firebaseUid, "profiles", fbProfile, "readingList"));
      const firebaseReadingList = [];
      querySnapshot.forEach((doc) => {
        firebaseReadingList.push({ id: doc.id, ...doc.data() });
      });
      
      if (firebaseReadingList.length > 0) {
        const currentReadingList = get().readingList || [];
        const merged = [...currentReadingList];
        let changed = false;
        
        firebaseReadingList.forEach(fbItem => {
          if (!merged.find(b => b.url === fbItem.url)) {
            merged.push(fbItem);
            changed = true;
          }
        });
        
        if (changed || currentReadingList.length === 0) {
          set({ readingList: merged });
        }
      }
    } catch (e) { console.error("Failed to fetch reading list", e); }

    // Fetch AI Chat Sessions (with messages from sub-collections)
    try {
      const aiQuerySnapshot = await getDocs(collection(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions"));
      const firebaseSessions = [];
      
      for (const sessionDoc of aiQuerySnapshot.docs) {
        const data = sessionDoc.data();
        delete data.lastSynced;
        
        // Fetch ChatHistory from sub-collection
        const messagesCol = collection(db, "users", state.firebaseUid, "profiles", fbProfile, "aiChatSessions", sessionDoc.id, "ChatHistory");
        const msgSnapshot = await getDocs(messagesCol);
        const messages = msgSnapshot.docs
          .map(msgDoc => {
            const msgData = msgDoc.data();
            const sortIndex = msgData.index ?? 0;
            delete msgData.index;
            delete msgData.timestamp;
            return { ...msgData, _index: sortIndex };
          })
          .sort((a, b) => a._index - b._index)
          .map(({ _index, ...rest }) => rest);
        
        firebaseSessions.push({ ...data, id: sessionDoc.id, messages });
      }
      
      if (firebaseSessions.length > 0) {
        const currentSessions = get().aiChatSessions || [];
        const merged = [...currentSessions];
        let changed = false;
        
        firebaseSessions.forEach(fbSession => {
          const idx = merged.findIndex(s => s.id === fbSession.id);
          if (idx === -1) {
            merged.push(fbSession);
            changed = true;
          } else if ((fbSession.updatedAt || 0) > (merged[idx].updatedAt || 0)) {
            merged[idx] = fbSession;
            changed = true;
          }
        });
        
        if (changed || currentSessions.length === 0) {
          merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          set({ aiChatSessions: merged.slice(0, 50) });
        }
      }
    } catch (e) { console.error("Failed to fetch AI sessions", e); }

    // Fetch Theme Settings
    try {
      const { getDoc } = await import('firebase/firestore');
      const themeDoc = await getDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "settings", "theme"));
      if (themeDoc.exists()) {
        const data = themeDoc.data();
        const updates = {};
        if (data.theme) updates.theme = data.theme;
        if (data.customColors) updates.customColors = { ...get().customColors, ...data.customColors };
        if (data.ntpSettings) {
          // Merge but preserve local backgroundImage (which is stored in localStorage, not Firebase)
          updates.ntpSettings = { ...get().ntpSettings, backgroundBlur: data.ntpSettings.backgroundBlur, backgroundOverlay: data.ntpSettings.backgroundOverlay };
        }
        if (Object.keys(updates).length > 0) set(updates);
      }
    } catch (e) { console.error("Failed to fetch theme settings", e); }
  },

  // Split View State
  dropdownOffset: 0,
  splitTabId: null,
  focusedPane: 'primary',
  setSplitTabId: (id) => set({ splitTabId: id, focusedPane: 'secondary' }),
  clearSplitView: () => set({ splitTabId: null, focusedPane: 'primary' }),
  setFocusedPane: (pane) => set({ focusedPane: pane }),

  // Dragging State
  isDraggingTab: false,
  setIsDraggingTab: (isDragging) => set({ isDraggingTab: isDragging }),

  // Theme State
  theme: 'dark', // 'light', 'dark', 'system', 'custom'
  customColors: {
    background: '#0f1015',
    surface: '#1a1b23',
    border: '#2d3748',
    primary: '#6b46c1',
    text: '#e2e8f0',
  },
  ntpSettings: {
    backgroundImage: null,
    backgroundBlur: '0px',
    backgroundOverlay: 'rgba(0,0,0,0.4)',
  },
  setTheme: (newTheme) => {
    if (window.electron && window.electron.themeAPI && (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system')) {
      window.electron.themeAPI.set(newTheme);
    }
    set({ theme: newTheme });
    // Sync to Firebase
    const state = get();
    if (state.firebaseUid) {
      const fbProfile = getFbProfile(state);
      setDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "settings", "theme"), {
        theme: newTheme,
        customColors: state.customColors,
        ntpSettings: { ...state.ntpSettings, backgroundImage: null }, // Don't sync large image to Firestore doc
        timestamp: serverTimestamp()
      }, { merge: true }).catch(e => console.error("Failed to sync theme", e));
    }
  },
  setCustomColors: (colors) => {
    set((state) => ({ customColors: { ...state.customColors, ...colors } }));
    // Sync to Firebase
    const state = get();
    if (state.firebaseUid) {
      const fbProfile = getFbProfile(state);
      setDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "settings", "theme"), {
        customColors: state.customColors,
        timestamp: serverTimestamp()
      }, { merge: true }).catch(e => console.error("Failed to sync custom colors", e));
    }
  },
  setNtpSettings: (settings) => {
    set((state) => ({ ntpSettings: { ...state.ntpSettings, ...settings } }));
    // Sync non-image settings to Firebase (image is too large for Firestore doc)
    const state = get();
    if (state.firebaseUid) {
      const fbProfile = getFbProfile(state);
      setDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "settings", "theme"), {
        ntpSettings: {
          backgroundBlur: state.ntpSettings.backgroundBlur,
          backgroundOverlay: state.ntpSettings.backgroundOverlay,
          hasBackgroundImage: !!state.ntpSettings.backgroundImage,
        },
        timestamp: serverTimestamp()
      }, { merge: true }).catch(e => console.error("Failed to sync ntp settings", e));
    }
  },
  toggleTheme: () => {
    const currentTheme = useBrowserStore.getState().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    if (window.electron && window.electron.themeAPI) {
      window.electron.themeAPI.set(newTheme);
    }
    set({ theme: newTheme });
  },

  // Actions
  navigate: (id, input) => set((state) => {
    const finalUrl = formatUrl(input);
    return {
      tabs: state.tabs.map(tab => {
        if (tab.id === id) {
          if (tab.url === finalUrl) return { ...tab, url: finalUrl };
          const newHistory = (tab.history || []).slice(0, (tab.historyIndex || 0) + 1);
          newHistory.push(finalUrl);
          return { 
            ...tab, 
            url: finalUrl, 
            title: finalUrl,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        }
        return tab;
      })
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
      error: null,
      history: [url],
      historyIndex: 0,
      isPlayingAudio: false,
      isMuted: false,
      isPinned: false,
      zoomLevel: 0,
      findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
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
    const closedTab = state.tabs.find(tab => tab.id === id);
    const newTabs = state.tabs.filter(tab => tab.id !== id);

    // Track recently closed tabs (skip internal pages)
    let recentlyClosedTabs = state.recentlyClosedTabs;
    if (closedTab && !closedTab.url.startsWith('browser://')) {
      recentlyClosedTabs = [
        { url: closedTab.url, title: closedTab.title, favicon: closedTab.favicon, closedAt: Date.now() },
        ...state.recentlyClosedTabs,
      ].slice(0, 10);
    }
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
          error: null,
          history: ['browser://newtab'],
          historyIndex: 0,
          isPlayingAudio: false,
          isMuted: false,
          isPinned: false,
          zoomLevel: 0,
          findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
        }],
        activeTabId: newId,
        recentlyClosedTabs,
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
      recentlyClosedTabs,
    };
  }),

  reopenLastClosedTab: () => set((state) => {
    if (!state.recentlyClosedTabs || state.recentlyClosedTabs.length === 0) return state;
    const lastClosed = state.recentlyClosedTabs[0];
    const remainingTabs = state.recentlyClosedTabs.slice(1);
    
    const newId = Date.now().toString();
    const newTab = { 
      id: newId, 
      title: lastClosed.title || 'New Tab', 
      url: lastClosed.url || 'browser://newtab', 
      favicon: lastClosed.favicon || null,
      isLoading: false, 
      error: null,
      history: [lastClosed.url || 'browser://newtab'],
      historyIndex: 0,
      isPlayingAudio: false, 
      isMuted: false, 
      isPinned: false, 
      zoomLevel: 0, 
      findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
    };
    
    return {
      tabs: [...state.tabs, newTab],
      activeTabId: newId,
      recentlyClosedTabs: remainingTabs
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
    tabs: state.tabs.map(tab => {
      if (tab.id === id) {
        // If webview internally navigated (and this isn't a deliberate history back/forward step), push to our history
        if (updates.url && updates.url !== tab.url && updates.historyIndex === undefined) {
          const currentHistUrl = tab.history && tab.history[tab.historyIndex];
          if (updates.url !== currentHistUrl) {
            const newHistory = (tab.history || []).slice(0, (tab.historyIndex || 0) + 1);
            
            // Avoid duplicate pushes for redirects (if last URL in history is exactly this one)
            if (newHistory[newHistory.length - 1] !== updates.url) {
              newHistory.push(updates.url);
              return { 
                ...tab, 
                ...updates, 
                history: newHistory,
                historyIndex: newHistory.length - 1
              };
            }
          }
        }
        return { ...tab, ...updates };
      }
      return tab;
    })
  })),

  setZoomLevel: (id, level) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, zoomLevel: level } : tab)
  })),

  updateFindState: (id, updates) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, findState: { ...tab.findState, ...updates } } : tab)
  })),

  toggleMute: (id) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, isMuted: !tab.isMuted } : tab)
  })),

  setZoomLevel: (id, level) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, zoomLevel: level } : tab)
  })),

  setDropdownOffset: (offset) => set({ dropdownOffset: offset }),
  setShowHomeButton: (show) => set({ showHomeButton: show }),

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
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false, zoomLevel: 0, findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
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
        zoomLevel: 0,
        findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
      }],
      activeTabId: newId,
    };
  }),

  openBookmarksTab: () => set((state) => {
    const existingTab = state.tabs.find(t => t.url === 'browser://bookmarks');
    if (existingTab) return { activeTabId: existingTab.id };
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
        id: newId, title: 'Bookmarks', url: 'browser://bookmarks', favicon: null,
        isLoading: false, canGoBack: false, canGoForward: false, error: null,
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false, zoomLevel: 0, findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
      }],
      activeTabId: newId,
    };
  }),

  openReadingListTab: () => set((state) => {
    const existingTab = state.tabs.find(t => t.url === 'browser://readinglist');
    if (existingTab) return { activeTabId: existingTab.id };
    const newId = Date.now().toString();
    return {
      tabs: [...state.tabs, { 
        id: newId, title: 'Reading List', url: 'browser://readinglist', favicon: null,
        isLoading: false, canGoBack: false, canGoForward: false, error: null,
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false, zoomLevel: 0, findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
      }],
      activeTabId: newId,
    };
  }),

  openReaderMode: (url, html) => set((state) => {
    const readerUrl = `browser://reader?url=${encodeURIComponent(url)}`;
    return {
      tabs: state.tabs.map(tab => tab.id === state.activeTabId ? { ...tab, url: readerUrl, fallbackForwardUrl: url, readerHtml: html } : tab)
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
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false, zoomLevel: 0, findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
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
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false, zoomLevel: 0, findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
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
        fallbackForwardUrl: null, isPlayingAudio: false, isMuted: false, isPinned: false, zoomLevel: 0, findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
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
        zoomLevel: 0,
        findState: { isVisible: false, text: '', activeMatchOrdinal: 0, matches: 0 },
      }],
      activeTabId: newId,
    };
  }),

  // History Actions
  addToHistory: async (url) => {
    if (url.startsWith('browser://')) return;
    const state = get();
    if (state.isIncognitoWindow) return;
    const uid = state.firebaseUid;
    const fbProfile = getFbProfile(state);
    
    const newHistoryItem = {
      id: Date.now().toString(),
      url: url,
      title: url,
      favicon: null,
      visit_time: Date.now()
    };
    
    // Save locally
    set((state) => ({ history: [newHistoryItem, ...state.history].slice(0, 1000) }));
    set({ lastHistoryDocId: newHistoryItem.id }); // Use local ID as fallback
    
    // Save to Firebase if logged in
    if (uid) {
      try {
        const docRef = await addDoc(collection(db, "users", uid, "profiles", fbProfile, "history"), newHistoryItem);
        set({ lastHistoryDocId: docRef.id });
      } catch (err) {
        console.error("Failed to save history to Firebase", err);
      }
    }
  },

  updateHistoryMeta: async (url, updates) => {
    const state = get();
    const fbProfile = getFbProfile(state);
    
    // Update local history
    if (state.lastHistoryDocId) {
      set((state) => ({
        history: state.history.map(item => 
          item.id === state.lastHistoryDocId ? { ...item, ...updates } : item
        )
      }));
    }

    if (state.firebaseUid && state.lastHistoryDocId) {
      try {
        await setDoc(doc(db, "users", state.firebaseUid, "profiles", fbProfile, "history", state.lastHistoryDocId), updates, { merge: true });
      } catch (err) {
        console.error("Failed to update history meta in Firebase", err);
      }
    }
  },

  clearHistory: () => set({ history: [] }),
  removeFromHistory: (id) => set((state) => ({ history: state.history.filter(h => h.id !== id) })),

  // Bookmarks Actions
  toggleBookmark: async (url, title, favicon) => {
    if (url.startsWith('browser://')) return;
    const state = get();
    const isBookmarked = state.bookmarks.some(b => b.url === url);
    const uid = state.firebaseUid;
    const fbProfile = getFbProfile(state);

    if (isBookmarked) {
      const bToRm = state.bookmarks.find(b => b.url === url);
      set({ bookmarks: state.bookmarks.filter(b => b.url !== url) });
      if (uid && bToRm) {
        try {
          await deleteDoc(doc(db, "users", uid, "profiles", fbProfile, "bookmarks", bToRm.id));
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
          await setDoc(doc(db, "users", uid, "profiles", fbProfile, "bookmarks", newId), newBookmark);
        } catch (e) { console.error(e); }
      }
    }
  },
  
  removeBookmark: async (id) => {
    set((state) => ({ bookmarks: state.bookmarks.filter(b => b.id !== id) }));
    const state = get();
    const uid = state.firebaseUid;
    const fbProfile = getFbProfile(state);
    if (uid) {
      try {
        await deleteDoc(doc(db, "users", uid, "profiles", fbProfile, "bookmarks", id));
      } catch (e) { console.error(e); }
    }
  },

  // Reading List Actions
  addToReadingList: async (url, title) => {
    if (url.startsWith('browser://')) return;
    const state = get();
    const isSaved = (state.readingList || []).some(b => b.url === url);
    const uid = state.firebaseUid;
    const fbProfile = getFbProfile(state);

    if (!isSaved) {
      const newId = Date.now().toString();
      const safeTitle = title === undefined ? url : title;
      const newItem = { id: newId, url, title: safeTitle, isRead: false, timestamp: Date.now() };
      set({ readingList: [...(state.readingList || []), newItem] });
      if (uid) {
        try {
          await setDoc(doc(db, "users", uid, "profiles", fbProfile, "readingList", newId), newItem);
        } catch (e) { console.error(e); }
      }
    }
  },
  
  removeFromReadingList: async (id) => {
    set((state) => ({ readingList: (state.readingList || []).filter(b => b.id !== id) }));
    const state = get();
    const uid = state.firebaseUid;
    const fbProfile = getFbProfile(state);
    if (uid) {
      try {
        await deleteDoc(doc(db, "users", uid, "profiles", fbProfile, "readingList", id));
      } catch (e) { console.error(e); }
    }
  },
  
  toggleReadingListStatus: async (id) => {
    const state = get();
    let updatedItem = null;
    set((state) => {
      const newList = (state.readingList || []).map(item => {
        if (item.id === id) {
          updatedItem = { ...item, isRead: !item.isRead };
          return updatedItem;
        }
        return item;
      });
      return { readingList: newList };
    });
    
    if (updatedItem) {
      const uid = get().firebaseUid;
      const fbProfile = getFbProfile(get());
      if (uid) {
        try {
          await updateDoc(doc(db, "users", uid, "profiles", fbProfile, "readingList", id), { isRead: updatedItem.isRead });
        } catch (e) { console.error(e); }
      }
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
            // Sync last login to user root
            await setDoc(doc(db, "users", uid), {
              lastLogin: serverTimestamp()
            }, { merge: true });
            // Sync profile metadata to profile sub-doc
            const fbProfile = getFbProfile(get());
            await setDoc(doc(db, "users", uid, "profiles", fbProfile), {
              name: result.currentUser.name,
              email: result.currentUser.email,
              avatar: result.currentUser.pic,
              timestamp: serverTimestamp()
            }, { merge: true });
          } catch (e) { console.error("Firestore sync error:", e); }
          get().syncFirebaseData();
        }

        // Sync with local Electron ProfileManager
        if (result.isLoggedIn && result.currentUser && window.electron?.updateProfileData) {
          const profileId = new URLSearchParams(window.location.search).get('profileId') || 'main';
          window.electron.updateProfileData(profileId, {
            name: result.currentUser.name,
            email: result.currentUser.email,
            avatar: result.profilePic
          });
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
    if (extension.id === 'ext-dark-mode' && window.electron) {
      window.electron.tabManager.setForceDark(true);
    }
    if (extension.id === 'ext-ad-blocker' && window.electron?.tabManager?.shield) {
      window.electron.tabManager.shield.setGlobal(true);
    }
    return { installedExtensions: [...state.installedExtensions, { ...extension, isEnabled: true }] };
  }),
  uninstallExtension: (id) => set((state) => {
    if (id === 'ext-dark-mode' && window.electron) {
      window.electron.tabManager.setForceDark(false);
    }
    if (id === 'ext-ad-blocker' && window.electron?.tabManager?.shield) {
      window.electron.tabManager.shield.setGlobal(false);
    }
    return {
      installedExtensions: state.installedExtensions.filter(e => e.id !== id)
    };
  }),
  toggleExtension: (id) => set((state) => {
    const ext = state.installedExtensions.find(e => e.id === id);
    if (id === 'ext-dark-mode' && window.electron && ext) {
      window.electron.tabManager.setForceDark(!ext.isEnabled);
    }
    if (id === 'ext-ad-blocker' && window.electron?.tabManager?.shield && ext) {
      window.electron.tabManager.shield.setGlobal(!ext.isEnabled);
    }
    return {
      installedExtensions: state.installedExtensions.map(e => 
        e.id === id ? { ...e, isEnabled: !e.isEnabled } : e
      )
    };
  }),

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
      name: 'browser-storage-' + currentProfileId,
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
        aiChatSessions: state.aiChatSessions,
        selectedAiModel: state.selectedAiModel,
        researchMode: state.researchMode,
        theme: state.theme,
        customColors: state.customColors,
        ntpSettings: state.ntpSettings,
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
      useBrowserStore.getState().syncFirebaseData();
    }
  });
}
