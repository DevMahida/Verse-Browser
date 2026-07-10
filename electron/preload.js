const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkGoogleLogin: (force) => ipcRenderer.invoke('check-google-login', force),
  logoutGoogle: () => ipcRenderer.invoke('logout-google'),
  detachTab: (tabData) => ipcRenderer.send('detach-tab', tabData),
  getWindowCount: () => ipcRenderer.invoke('get-window-count'),
  sendTabsForMerge: (tabsData) => ipcRenderer.send('send-tabs-for-merge', tabsData),
  
  // Custom Window Dragging
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),

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
  }
});