const { contextBridge, ipcRenderer } = require("electron");

// --- Anti-detection Spoofing ---
// Runs at document-start before any page scripts execute
try {
  if (!window.chrome) {
    window.chrome = { runtime: {}, csi: function(){}, loadTimes: function(){} };
  }
  if (navigator.plugins.length === 0) {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [{ name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' }]
    });
  }
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  
  // Forge userAgentData to perfectly match the forged Client Hints HTTP headers
  Object.defineProperty(navigator, 'userAgentData', {
    get: () => ({
      brands: [
        { brand: "Chromium", version: "122" },
        { brand: "Not(A:Brand", version: "24" },
        { brand: "Google Chrome", version: "122" }
      ],
      mobile: false,
      platform: "Windows"
    })
  });
} catch (e) {}


contextBridge.exposeInMainWorld("electron", {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  toggleFullscreen: () => ipcRenderer.send('window-toggle-fullscreen'),
  newWindow: () => ipcRenderer.send('window-new'),
  newIncognitoWindow: () => ipcRenderer.send('window-new-incognito'),
  checkGoogleLogin: (force) => ipcRenderer.invoke('check-google-login', force),
  logoutGoogle: () => ipcRenderer.invoke('logout-google'),
  detachTab: (tabData, isIncognito) => ipcRenderer.send('detach-tab', { tabData, isIncognito }),
  getWindowCount: () => ipcRenderer.invoke('get-window-count'),
  sendTabsForMerge: (tabsData) => ipcRenderer.send('send-tabs-for-merge', tabsData),
  
  // Profile Management
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  createProfile: (name, email) => ipcRenderer.invoke('create-profile', { name, email }),
  switchProfile: (id) => ipcRenderer.send('switch-profile', id),
  deleteProfile: (id) => ipcRenderer.invoke('delete-profile', id),
  updateProfileData: (id, data) => ipcRenderer.invoke('update-profile-data', { id, data }),
  
  themeAPI: {
    get: () => ipcRenderer.invoke('theme-get'),
    set: (theme) => ipcRenderer.send('theme-set', theme),
    onChange: (callback) => ipcRenderer.on('theme-updated', (_event, data) => callback(data)),
    saveImage: (fileData, ext) => ipcRenderer.invoke('theme-save-image', { fileData, ext })
  },

  safetyCheck: {
    checkVersion: () => ipcRenderer.invoke('safety-check-version'),
    checkBreaches: (email) => ipcRenderer.invoke('safety-check-breaches', email),
  },

  mcpClient: {
    listServers: () => ipcRenderer.invoke('mcp-client:listServers'),
    listTools: (server) => ipcRenderer.invoke('mcp-client:listTools', server),
    callTool: (server, tool, args) => ipcRenderer.invoke('mcp-client:callTool', { server, tool, args }),
    addServer: (name, config) => ipcRenderer.invoke('mcp-client:addServer', { name, config }),
    removeServer: (name) => ipcRenderer.invoke('mcp-client:removeServer', name),
    toggleServer: (name, enabled) => ipcRenderer.invoke('mcp-client:toggleServer', { name, enabled }),
  },
  
  // TabManager (WebContentsView/BrowserView)
  tabManager: {
    create: (data) => ipcRenderer.send('tab-create', data),
    destroy: (tabId) => ipcRenderer.send('tab-destroy', tabId),
    updateBounds: (data) => ipcRenderer.send('tab-update-bounds', data),
    navigate: (data) => ipcRenderer.send('tab-navigate', data),
    action: (data) => ipcRenderer.send('tab-action', data),
    capturePage: (tabId) => ipcRenderer.invoke('tab-capture-page', tabId),
    focusTab: (tabId) => ipcRenderer.send('tab-focus', tabId),
    fetchSource: (data) => ipcRenderer.invoke('fetch-source', data),
    openPopup: (data) => ipcRenderer.send('open-popup', data),
    closePopup: () => ipcRenderer.send('close-popup'),
    resizePopup: (data) => ipcRenderer.send('resize-popup', data),
    openNewTab: (data) => ipcRenderer.send('open-new-tab', data),
    executeJavaScript: (data) => ipcRenderer.invoke('tab-execute-js', data),
    onTabEvent: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('tab-event', handler);
      return () => ipcRenderer.removeListener('tab-event', handler);
    },
    // Verse Shield (Ad & Tracker Blocker)
    shield: {
      getStatus: (data) => ipcRenderer.invoke('shield:getStatus', data),
      setForSite: (hostname, enabled) => ipcRenderer.invoke('shield:setForSite', hostname, enabled),
      setGlobal: (enabled) => ipcRenderer.invoke('shield:setGlobal', enabled),
    },
    onAdBlockerStatUpdate: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('adblocker-stat-update', handler);
      return () => ipcRenderer.removeListener('adblocker-stat-update', handler);
    }
  },

  // Google OAuth Loopback Handlers
  linkGoogle: (id) => ipcRenderer.invoke('profiles:linkGoogle', id),
  unlinkGoogle: (id) => ipcRenderer.invoke('profiles:unlinkGoogle', id),

  // Tavily API Key Handlers
  setTavilyKey: (profileId, key) => ipcRenderer.invoke('profiles:setTavilyKey', { profileId, key }),
  removeTavilyKey: (profileId) => ipcRenderer.invoke('profiles:removeTavilyKey', profileId),
  getTavilyKey: (profileId) => ipcRenderer.invoke('profiles:getTavilyKey', profileId),

  // Session Management
  sessionManager: {
    clearBrowsingData: () => ipcRenderer.send('clear-browsing-data')
  },

  // Custom Window Dragging
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),

  // Document Export (PDF)
  exportDocument: (data) => ipcRenderer.invoke('export-document', data),

  // AI Assistant Request
  aiRequest: (payload) => ipcRenderer.invoke('ai-request', payload),

  // --- Database Methods removed for Firebase ---

  // --- Downloads Manager ---
  updateDownloadSettings: (settings) => ipcRenderer.send('update-download-settings', settings),
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
  pauseDownload: (id) => ipcRenderer.send('pause-download', id),
  resumeDownload: (id) => ipcRenderer.send('resume-download', id),
  cancelDownload: (id) => ipcRenderer.send('cancel-download', id),
  openFile: (path) => ipcRenderer.send('open-file', path),
  showInFolder: (path) => ipcRenderer.send('show-in-folder', path),

  onDownloadStarted: (callback) => {
    ipcRenderer.on('download-started', (event, item) => callback(item));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadDone: (callback) => {
    ipcRenderer.on('download-done', (event, data) => callback(data));
  },

  // --- Permissions Manager ---
  onPermissionRequest: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('permission-request', handler);
    return () => ipcRenderer.removeListener('permission-request', handler);
  },
  respondToPermission: (data) => ipcRenderer.send('permission-response', data),
  revokePermission: (data) => ipcRenderer.send('revoke-permission', data),

  // Listeners for merge events from main process
  onRequestTabsForMerge: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('request-tabs-for-merge', handler);
    return () => ipcRenderer.removeListener('request-tabs-for-merge', handler);
  },
  onReceiveMergedTabs: (callback) => {
    const handler = (_event, tabsData) => callback(tabsData);
    ipcRenderer.on('receive-merged-tabs', handler);
    return () => ipcRenderer.removeListener('receive-merged-tabs', handler);
  },
  onWebviewNewWindow: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('webview-new-window', handler);
    return () => ipcRenderer.removeListener('webview-new-window', handler);
  },
  onKeyboardShortcut: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('keyboard-shortcut', handler);
    return () => ipcRenderer.removeListener('keyboard-shortcut', handler);
  },
  
  // Context Menu Commands
  onContextMenuCommand: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('context-menu-command', handler);
    return () => ipcRenderer.removeListener('context-menu-command', handler);
  }
});
