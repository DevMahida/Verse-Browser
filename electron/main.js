const { app, BrowserWindow, ipcMain, session, Menu, screen } = require("electron");
const path = require("path");
const { initTabManager } = require('./tabManager');

const isDev = !app.isPackaged;

if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

let mainWindow = null;
const allWindows = new Set();
let downloadSettings = {
  defaultPath: app.getPath('downloads'),
  askEveryTime: false
};
const activeDownloads = new Map();

function createWindow(initialTab = null, x = undefined, y = undefined, isIncognito = false) {
  const options = {
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '../public/favicon.png'),

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      partition: 'persist:main'
    },
  };
  
  if (x !== undefined) options.x = x;
  if (y !== undefined) options.y = y;

  const win = new BrowserWindow(options);
  win._isIncognito = isIncognito;
  allWindows.add(win);

  let url = "http://localhost:3000";
  const searchParams = new URLSearchParams();
  if (initialTab) {
    searchParams.append('initialTab', JSON.stringify(initialTab));
  }
  if (isIncognito) {
    searchParams.append('incognito', 'true');
  }
  const qs = searchParams.toString();
  if (qs) url += `?${qs}`;
  win.loadURL(url);

  win.on('closed', () => {
    allWindows.delete(win);
    if (mainWindow === win) mainWindow = null;
  });

  // --- Tab Merge via Window Proximity ---
  // When a window stops moving near another window's tab bar, merge its tabs into the target.
  let moveTimer = null;
  win.on('move', () => {
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (allWindows.size < 2 || win.isDestroyed()) return;

      const [wx, wy] = win.getPosition();
      const [ww] = win.getSize();
      const centerX = wx + ww / 2;

      for (const other of allWindows) {
        if (other === win || other.isDestroyed()) continue;
        if (other._isIncognito !== win._isIncognito) continue;
        const [ox, oy] = other.getPosition();
        const [ow] = other.getSize();

        // Check if this window's top-center is inside the other window's tab bar region
        const inX = centerX >= ox && centerX <= ox + ow;
        const inY = wy >= oy - 40 && wy <= oy + 60;

        if (inX && inY) {
          // Ask the source renderer for its tab data
          if (!win.isDestroyed()) {
            win.webContents.send('request-tabs-for-merge');
          }
          return;
        }
      }
    }, 400); // 400ms debounce — fires after the user stops dragging
  });
  
  if (!mainWindow) mainWindow = win;
}

app.whenReady().then(async () => {
  initTabManager();

  // Setup an invisible application menu to handle global shortcuts reliably
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow?.webContents.send('keyboard-shortcut', 'new-tab')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('keyboard-shortcut', 'close-tab')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('keyboard-shortcut', 'find')
        },
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
               mainWindow.webContents.send('keyboard-shortcut', 'toggle-devtools');
             }
          }
        },
        {
          label: 'Toggle Developer Tools Alt',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
               mainWindow.webContents.send('keyboard-shortcut', 'toggle-devtools');
             }
          }
        },
        {
          label: 'Inspect UI',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
               mainWindow.webContents.toggleDevTools();
             }
          }
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
               mainWindow.webContents.send('keyboard-shortcut', 'reload');
             }
          }
        },
        {
          label: 'Hard Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
               mainWindow.webContents.send('keyboard-shortcut', 'hard-reload');
             }
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  
  const setupContextMenu = require('./contextMenu');
  
  // Intercept new windows created by webviews (e.g. target="_blank" or middle-click)
  app.on('web-contents-created', (event, contents) => {
    setupContextMenu(contents);
    
    // We only prevent native window spawning for WebContentsView if needed, 
    // but WebContentsView handles its own window open in tabManager.js.
  });

  createWindow();

  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.minimize();
  });
  
  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });
  
  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.on('window-toggle-fullscreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setFullScreen(!win.isFullScreen());
    }
  });

  ipcMain.on('window-new', () => {
    createWindow();
  });

  ipcMain.on('window-new-incognito', () => {
    createWindow(null, undefined, undefined, true);
  });

  ipcMain.on('move-window', (event, { dx, dy }) => {
    const numDx = Number(dx);
    const numDy = Number(dy);
    if (isNaN(numDx) || isNaN(numDy)) return;
    
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const pos = win.getPosition();
      const newX = parseInt(Math.round(pos[0] + numDx), 10);
      const newY = parseInt(Math.round(pos[1] + numDy), 10);
      if (!isNaN(newX) && !isNaN(newY)) {
        win.setPosition(newX, newY);
      }
    }
  });

  ipcMain.on('detach-tab', (event, { tabData, isIncognito }) => {
    const cursorPoint = screen.getCursorScreenPoint();
    const startX = parseInt(Math.round(cursorPoint.x - 100), 10);
    const startY = parseInt(Math.round(cursorPoint.y - 20), 10);
    createWindow(tabData, startX, startY, isIncognito);
  });

  // Merge handler: receives tabs from source window, sends to target window, closes source
  ipcMain.on('send-tabs-for-merge', (event, tabsData) => {
    const sourceWin = BrowserWindow.fromWebContents(event.sender);
    if (!sourceWin || sourceWin.isDestroyed()) return;

    const [wx, wy] = sourceWin.getPosition();
    const [ww] = sourceWin.getSize();
    const centerX = wx + ww / 2;

    for (const other of allWindows) {
      if (other === sourceWin || other.isDestroyed()) continue;
      if (other._isIncognito !== sourceWin._isIncognito) continue;
      const [ox, oy] = other.getPosition();
      const [ow] = other.getSize();

      const inX = centerX >= ox && centerX <= ox + ow;
      const inY = wy >= oy - 40 && wy <= oy + 60;

      if (inX && inY) {
        other.webContents.send('receive-merged-tabs', tabsData);
        sourceWin.close();
        return;
      }
    }
  });

  // Return the number of open app windows
  ipcMain.handle('get-window-count', () => {
    return allWindows.size;
  });

  let cachedGoogleAccounts = null;
  let lastSid = null;
  let loginCheckPromise = null;

  ipcMain.handle('check-google-login', async (event, force = false) => {
    try {
      const sess = session.fromPartition('persist:main');
      const cookies = await sess.cookies.get({ domain: '.google.com' });
      const sidCookie = cookies.find(c => c.name === 'SID' || c.name === '__Secure-1PSID' || c.name === '__Secure-3PSID');
      
      if (!sidCookie) {
        cachedGoogleAccounts = null;
        lastSid = null;
        return { isLoggedIn: false, profilePic: null, currentUser: null, accounts: [] };
      }

      if (!force && cachedGoogleAccounts && lastSid === sidCookie.value) {
        return cachedGoogleAccounts;
      }

      if (loginCheckPromise && !force) {
        return loginCheckPromise;
      }

      loginCheckPromise = new Promise((resolve) => {
        let isResolved = false;
        let hasProcessedLoad = false;

        const offscreen = new BrowserWindow({
          show: false,
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            partition: 'persist:main'
          }
        });

        const cleanup = (result) => {
          if (isResolved) return;
          isResolved = true;
          if (result.isLoggedIn && result.accounts && result.accounts.length > 0) {
            cachedGoogleAccounts = result;
            lastSid = sidCookie.value;
          }
          try {
            if (!offscreen.isDestroyed()) offscreen.destroy();
          } catch (e) { /* ignore */ }
          resolve(result);
        };

        offscreen.loadURL('https://myaccount.google.com/');

        offscreen.webContents.on('did-finish-load', async () => {
          if (hasProcessedLoad || isResolved || offscreen.isDestroyed()) return;
          hasProcessedLoad = true;

          try {
            const html = await offscreen.webContents.executeJavaScript('document.documentElement.innerHTML');
            
            // Look for email in the page source
            const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const email = emailMatch ? emailMatch[0] : "Google User";
            
            // Look for profile picture
            const picRegex = /https:\/\/lh3\.googleusercontent\.com\/a[\/-][a-zA-Z0-9_/\-+=~.?&]+(?:\\u003d[a-zA-Z0-9\-_]+)?/;
            const picMatch = html.match(picRegex);
            let pic = picMatch ? picMatch[0].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&') : null;
            
            // Look for name (usually before the email in account switcher or aria-labels)
            let name = email.split('@')[0];
            const nameMatch = html.match(/Google Account:\s*([^(\n]+?)\s*\(/);
            if (nameMatch && nameMatch[1]) {
              name = nameMatch[1].trim();
            }

            let accounts = [{
              email: email,
              name: name,
              pic: pic
            }];

            cleanup({ isLoggedIn: true, profilePic: pic, currentUser: accounts[0], accounts });
          } catch (e) {
            console.error("Failed to parse myaccount body:", e);
            cleanup({ 
              isLoggedIn: true, 
              profilePic: null, 
              currentUser: { email: "Google User", name: "Current Account", pic: null }, 
              accounts: [{ email: "Google User", name: "Current Account", pic: null }] 
            });
          }
        });


        setTimeout(() => {
          if (!isResolved) {
            cleanup({ isLoggedIn: true, profilePic: null, currentUser: { email: "Google User", name: "Current Account", pic: null }, accounts: [{ email: "Google User", name: "Current Account", pic: null }] });
          }
        }, 15000);
      }).finally(() => {
        loginCheckPromise = null;
      });
      return loginCheckPromise;
    } catch (e) {
      console.error("Error checking google login:", e);
      return { isLoggedIn: false, profilePic: null, currentUser: null, accounts: [] };
    }
  });

  ipcMain.handle('logout-google', async () => {
    try {
      const cookies = await session.defaultSession.cookies.get({ domain: '.google.com' });
      for (const cookie of cookies) {
        let url = 'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain.replace(/^\./, '') + cookie.path;
        await session.defaultSession.cookies.remove(url, cookie.name);
      }
      cachedGoogleAccounts = null;
      lastSid = null;
      return true;
    } catch (e) {
      console.error("Failed to clear cookies:", e);
      return false;
    }
  });

  // --- Downloads Manager ---
  ipcMain.on('update-download-settings', (event, settings) => {
    downloadSettings = { ...downloadSettings, ...settings };
  });

  ipcMain.handle('select-download-folder', async (event) => {
    const { dialog } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-default-download-path', () => app.getPath('downloads'));

  ipcMain.on('pause-download', (event, id) => {
    if (activeDownloads.has(id)) activeDownloads.get(id).pause();
  });

  ipcMain.on('resume-download', (event, id) => {
    if (activeDownloads.has(id)) activeDownloads.get(id).resume();
  });

  ipcMain.on('cancel-download', (event, id) => {
    if (activeDownloads.has(id)) activeDownloads.get(id).cancel();
  });

  ipcMain.on('open-file', (event, filePath) => {
    const { shell } = require('electron');
    shell.openPath(filePath);
  });

  ipcMain.on('show-in-folder', (event, filePath) => {
    const { shell } = require('electron');
    shell.showItemInFolder(filePath);
  });

  const sess = session.fromPartition('persist:main');
  sess.on('will-download', (event, item, webContents) => {
    const downloadId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const fileName = item.getFilename();
    const totalBytes = item.getTotalBytes();
    
    if (!downloadSettings.askEveryTime) {
      const savePath = path.join(downloadSettings.defaultPath, fileName);
      item.setSavePath(savePath);
    }

    activeDownloads.set(downloadId, item);

    const hostWebContents = webContents.hostWebContents || webContents;

    hostWebContents.send('download-started', {
      id: downloadId,
      fileName,
      totalBytes,
      url: item.getURL(),
      state: 'progressing',
      receivedBytes: 0,
      startTime: Date.now()
    });

    item.on('updated', (event, state) => {
      let currentState = state;
      if (state === 'interrupted') {
        hostWebContents.send('download-progress', { id: downloadId, state: 'interrupted' });
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          currentState = 'paused';
          hostWebContents.send('download-progress', { id: downloadId, state: 'paused' });
        } else {
          hostWebContents.send('download-progress', {
            id: downloadId,
            state: 'progressing',
            receivedBytes: item.getReceivedBytes()
          });
        }
      }
    });

    item.once('done', (event, state) => {
      activeDownloads.delete(downloadId);
      hostWebContents.send('download-done', { id: downloadId, state, path: item.getSavePath() });
    });
  });

  // --- Permissions Manager ---
  const sessionPermissions = new Map(); // key: `${origin}-${permission}`, value: 'granted' or 'denied'
  const pendingPermissionCallbacks = new Map(); // key: reqId, value: callback
  const sessPerms = session.fromPartition('persist:main');

  sessPerms.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details.requestingUrl || webContents.getURL();
    if (!requestingUrl || requestingUrl.startsWith('browser://') || requestingUrl.startsWith('http://localhost')) {
      // Auto-allow internal/localhost
      return callback(true);
    }

    let origin;
    try {
      origin = new URL(requestingUrl).origin;
    } catch (e) {
      return callback(false); // deny if invalid URL
    }

    const permKey = `${origin}-${permission}`;
    
    if (sessionPermissions.has(permKey)) {
      return callback(sessionPermissions.get(permKey) === 'granted');
    }
    
    const reqId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    pendingPermissionCallbacks.set(reqId, callback);

    // If it's a webview, the host window is mainWindow. If it's the main window itself, use it.
    let targetWebContents = webContents.hostWebContents || webContents;
    if (mainWindow && !mainWindow.isDestroyed()) {
        targetWebContents = mainWindow.webContents;
    }

    targetWebContents.send('permission-request', {
      id: reqId,
      permission,
      origin,
    });
  });

  ipcMain.on('permission-response', (event, { id, origin, permission, granted }) => {
    if (pendingPermissionCallbacks.has(id)) {
      const callback = pendingPermissionCallbacks.get(id);
      callback(granted);
      pendingPermissionCallbacks.delete(id);
      
      const permKey = `${origin}-${permission}`;
      sessionPermissions.set(permKey, granted ? 'granted' : 'denied');
    }
  });

  ipcMain.on('revoke-permission', (event, { origin, permission }) => {
    const permKey = `${origin}-${permission}`;
    sessionPermissions.delete(permKey);
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});