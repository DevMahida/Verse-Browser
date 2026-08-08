process.noDeprecation = true;
const { app, BrowserWindow, ipcMain, session, Menu, screen, net, nativeTheme, protocol } = require("electron");

protocol.registerSchemesAsPrivileged([
  { scheme: 'theme', privileges: { bypassCSP: true, supportFetchAPI: true, secure: true, standard: true } }
]);
const path = require("path");

// Load .env.local so Electron main process can read GOOGLE_CLIENT_ID, etc.
const envPath = app.isPackaged 
  ? path.join(process.resourcesPath, '.env.local')
  : path.join(__dirname, '..', '.env.local');
require('dotenv').config({ path: envPath });
const { initTabManager } = require('./tabManager');
const profileManager = require('./profileManager');
const { loadWindowState, trackWindowState } = require('./windowBounds');
const { enableShieldsOnSession, attachNavigationShields, registerShieldHandlers } = require('./verseShield');
// const { authenticateWithGoogle } = require('./google-oauth'); // Disabled per user request

const isDev = !app.isPackaged;

if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

// Chromium feature flags — must be a single comma-separated call (multiple calls overwrite).
// - WebAuthentication: Electron's WebAuthn is incomplete; disabling it prevents the broken
//   Windows Security passkey dialog and forces Google to fall back to password auth
app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationProxy,FedCm');
// Ensure navigator.webdriver is false — Electron can set automation flags that trigger Google's bot detection
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');


let mainWindow = null;
const allWindows = new Set();
let downloadSettings = {
  defaultPath: app.getPath('downloads'),
  askEveryTime: true
};
const activeDownloads = new Map();

function createWindow(initialTab = null, x = undefined, y = undefined, isIncognito = false, profileId = 'main') {
  // For the very first (main) window, use saved/smart bounds;
  // for secondary windows opened via drag-off or new-window, use the supplied x/y.
  const isMainWindow = allWindows.size === 0 && x === undefined && y === undefined;
  const savedState = isMainWindow ? loadWindowState() : null;

  const options = {
    width: savedState ? savedState.width : 1200,
    height: savedState ? savedState.height : 800,
    minWidth: 800,
    minHeight: 540,
    frame: false,
    icon: path.join(__dirname, '../public/favicon.png'),

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: isIncognito ? 'incognito' : profileManager.partitionFor(profileId)
    },
  };

  if (savedState) {
    options.x = savedState.x;
    options.y = savedState.y;
  }
  if (x !== undefined) options.x = x;
  if (y !== undefined) options.y = y;

  const win = new BrowserWindow(options);
  if (savedState && savedState.isMaximized) win.maximize();
  win._isIncognito = isIncognito;
  win._profileId = profileId;
  allWindows.add(win);

  // Only track bounds for the main window (so secondary popup windows don't overwrite the saved state)
  if (isMainWindow) trackWindowState(win);

  let url = "http://localhost:3000";
  const searchParams = new URLSearchParams();
  searchParams.append('profileId', profileId);
  if (initialTab) {
    searchParams.append('initialTab', JSON.stringify(initialTab));
  }
  if (isIncognito) {
    searchParams.append('incognito', 'true');
  }
  const qs = searchParams.toString();
  
  if (isDev) {
    if (qs) url += `?${qs}`;
    win.loadURL(url);
  } else {
    // In production, load the statically exported Next.js HTML file
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');
    win.loadFile(indexPath, { search: qs });
  }

  win.on('closed', () => {
    allWindows.delete(win);
    if (mainWindow === win) mainWindow = null;
  });

  win.on('app-command', (e, cmd) => {
    if (cmd === 'browser-backward') {
      if (!win.isDestroyed()) win.webContents.send('keyboard-shortcut', 'go-back');
    } else if (cmd === 'browser-forward') {
      if (!win.isDestroyed()) win.webContents.send('keyboard-shortcut', 'go-forward');
    }
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
        if (other._profileId !== win._profileId) continue;
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

// --- Permanent fix for stale cache/lock errors after force-kills ---
// When Electron is force-killed (taskkill, crash, etc.) it can't cleanly release
// file locks on GPU cache, disk cache, and quota databases. The next launch then
// fails with "Unable to move the cache", "Could not open the quota database", etc.
//
// Fix: (1) Enforce single instance so two Electrons never fight over the same data dir.
//       (2) On startup, nuke the GPUCache dir (it's fully regenerated) and remove
//           stale lock files from quota/service-worker databases.

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // Another instance is already running — focus it instead of launching a second one
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const fs = require('fs');
try {
  const userDataPath = app.getPath('userData');

  // 1. Nuke GPUCache — it's a pure cache, Chromium regenerates it instantly.
  //    This is the ONLY fix for "Unable to move the cache: Access is denied".
  const gpuCachePath = path.join(userDataPath, 'GPUCache');
  if (fs.existsSync(gpuCachePath)) {
    fs.rmSync(gpuCachePath, { recursive: true, force: true });
  }

  // 2. Walk the entire userData tree and remove stale lock files.
  //    These cause "Could not open the quota database" errors.
  const staleLockNames = new Set(['lockfile', 'LOCK']);
  const walk = (dir) => {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (staleLockNames.has(entry.name)) {
          try { fs.unlinkSync(fullPath); } catch {}
        }
      }
    } catch {}
  };
  walk(userDataPath);
} catch {}

app.whenReady().then(async () => {
  const { pathToFileURL } = require('url');
  protocol.handle('theme', (request) => {
    let url = request.url.replace('theme://', '');
    if (url.startsWith('/')) url = url.slice(1);
    const filePath = path.join(app.getPath('userData'), url);
    return net.fetch(pathToFileURL(filePath).href);
  });
  // Dynamically strip Electron and AppName from the default User-Agent
  // We use the Chrome User-Agent globally. Because we set app.userAgentFallback,
  // Electron automatically scrubs "Electron" from navigator.userAgentData and sec-ch-ua!
  const chromeVersion = process.versions.chrome || '120.0.0.0';
  const spoofedUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  app.userAgentFallback = spoofedUA;
  session.defaultSession.setUserAgent(spoofedUA);

  // Ensure every newly created profile session partition also uses the spoofed Edge User-Agent
  // AND enable Verse Shield ad/tracker blocking on each new session partition.
  app.on('session-created', (sess) => {
    sess.setUserAgent(spoofedUA);
    enableShieldsOnSession(sess).catch(console.error);
  });



  const savedState = loadWindowState();

  // Register Verse Shield IPC handlers and enable ad/tracker blocking on the default session
  registerShieldHandlers();
  await enableShieldsOnSession(session.fromPartition('persist:main'));

  initTabManager();

  // Listen for successful system handoffs and inject session
  ipcMain.on('system-handoff-success', async (event, { tabId, partition, payload }) => {
    try {
      console.log(`[Main] Handling system handoff success for tab ${tabId} in partition ${partition}`);
      
      const sess = session.fromPartition(partition);
      
      // CRITICAL CONSTRAINT: Google does not provide an endpoint to exchange an OAuth 'code'
      // or 'access_token' into a full web session cookie (SID/HSID) for domains like .youtube.com.
      // 
      // We will inject a placeholder token cookie to represent the successful handoff,
      // but without legacy/undocumented APIs (like MergeSession), full web authentication
      // across YouTube cannot be completed solely via an OAuth token loopback.
      
      if (payload.code) {
        await sess.cookies.set({
          url: 'https://youtube.com',
          name: 'VERSE_OAUTH_TOKEN',
          value: payload.code,
          domain: '.youtube.com',
          secure: true,
          httpOnly: true,
          expirationDate: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
        });
        console.log('[Main] Injected placeholder VERSE_OAUTH_TOKEN cookie.');
      }

      // Instruct the renderer to reload the tab to consume the new state
      const { getViewsMap } = require('./tabManager');
      const viewsMap = getViewsMap ? getViewsMap() : new Map();
      const targetWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send('tab-event', {
          tabId,
          eventName: 'handoff-completed',
          data: { success: true }
        });
      }
    } catch (err) {
      console.error('[Main] Failed to handle system handoff session injection:', err);
    }
  });

  // Profile IPCs
  profileManager.registerProfileHandlers((profileId, isGuest) => {
    if (!isGuest) {
      for (const win of allWindows) {
        if (win._profileId === profileId && !win._isIncognito) {
          win.focus();
          return;
        }
      }
    }
    createWindow(null, undefined, undefined, isGuest, profileId);
  });
  
  // Session IPCs
  ipcMain.on('clear-browsing-data', async () => {
    try {
      await session.defaultSession.clearStorageData();
      console.log('Browsing data cleared');
    } catch (err) {
      console.error('Failed to clear browsing data:', err);
    }
  });
  // switch-profile is now handled by profileManager.registerProfileHandlers

  // Setup an invisible application menu to handle global shortcuts reliably
  const getTargetWin = () => BrowserWindow.getFocusedWindow() || mainWindow;
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => getTargetWin()?.webContents.send('keyboard-shortcut', 'new-tab')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => getTargetWin()?.webContents.send('keyboard-shortcut', 'close-tab')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => getTargetWin()?.webContents.send('keyboard-shortcut', 'find')
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
             const target = getTargetWin();
             if (target && !target.isDestroyed()) {
               target.webContents.send('keyboard-shortcut', 'toggle-devtools');
             }
          }
        },
        {
          label: 'Toggle Developer Tools Alt',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
             const target = getTargetWin();
             if (target && !target.isDestroyed()) {
               target.webContents.send('keyboard-shortcut', 'toggle-devtools');
             }
          }
        },
        {
          label: 'Inspect UI',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => {
             const target = getTargetWin();
             if (target && !target.isDestroyed()) {
               target.webContents.toggleDevTools();
             }
          }
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
             const target = getTargetWin();
             if (target && !target.isDestroyed()) {
               target.webContents.send('keyboard-shortcut', 'reload');
             }
          }
        },
        {
          label: 'Hard Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
             const target = getTargetWin();
             if (target && !target.isDestroyed()) {
               target.webContents.send('keyboard-shortcut', 'hard-reload');
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

  const defaultProfile = profileManager.ensureDefaultProfile();

  // Clear any stuck proxy from previous runs BEFORE creating windows
  try {
    await session.defaultSession.setProxy({});
    await session.fromPartition('persist:main').setProxy({});
    await session.fromPartition('incognito').setProxy({});
    await session.defaultSession.closeAllConnections();
    await session.fromPartition('persist:main').closeAllConnections();
    await session.fromPartition('incognito').closeAllConnections();
  } catch (e) {
    console.error('Failed to clear initial proxy', e);
  }

  createWindow(null, undefined, undefined, false, defaultProfile.id);

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

  ipcMain.on('window-new', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const profileId = win ? win._profileId : 'main';
    createWindow(null, undefined, undefined, false, profileId);
  });

  ipcMain.on('window-new-incognito', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const profileId = win ? win._profileId : 'main';
    createWindow(null, undefined, undefined, true, profileId);
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
        const bounds = win.getBounds();
        win.setBounds({
          x: newX,
          y: newY,
          width: bounds.width,
          height: bounds.height
        });
      }
    }
  });

  ipcMain.on('detach-tab', (event, { tabData, isIncognito }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const profileId = win ? win._profileId : 'main';
    const cursorPoint = screen.getCursorScreenPoint();
    const startX = parseInt(Math.round(cursorPoint.x - 100), 10);
    const startY = parseInt(Math.round(cursorPoint.y - 20), 10);
    createWindow(tabData, startX, startY, isIncognito, profileId);
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
      if (other._profileId !== sourceWin._profileId) continue;
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
      // Find the window that requested this check to use the correct partition
      const win = BrowserWindow.fromWebContents(event.sender);
      const profileId = win ? win._profileId : 'main';
      const partitionStr = profileManager.partitionFor(profileId);
      const sess = session.fromPartition(partitionStr);
      const cookies = await sess.cookies.get({ domain: '.google.com' });
      const sidCookie = cookies.find(c => c.name === 'SID' || c.name === '__Secure-1PSID' || c.name === '__Secure-3PSID');
      
      if (!sidCookie) {
        cachedGoogleAccounts = null;
        lastSid = null;

        // Fallback: Check if the profile is signed in via the new OAuth Loopback flow (saved in profiles.json)
        const profiles = profileManager.getProfiles();
        const profile = profiles.find(p => p.id === profileId);
        
        if (profile && profile.email) {
          const userObj = {
            name: profile.name,
            email: profile.email,
            pic: profile.avatar
          };
          return { isLoggedIn: true, profilePic: profile.avatar, currentUser: userObj, accounts: [userObj] };
        }

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
            partition: partitionStr
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

  ipcMain.handle('logout-google', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const profileId = win ? win._profileId : 'main';
      const sess = session.fromPartition(profileManager.partitionFor(profileId));
      
      const cookies = await sess.cookies.get({ domain: '.google.com' });
      for (const cookie of cookies) {
        let url = 'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain.replace(/^\./, '') + cookie.path;
        await sess.cookies.remove(url, cookie.name);
      }
      cachedGoogleAccounts = null;
      lastSid = null;
      return true;
    } catch (e) {
      console.error("Failed to clear cookies:", e);
      return false;
    }
  });

  ipcMain.handle('theme-save-image', async (event, { fileData, ext }) => {
    try {
      const themesDir = path.join(app.getPath('userData'), 'themes');
      if (!fs.existsSync(themesDir)) {
        fs.mkdirSync(themesDir, { recursive: true });
      }
      const filename = `ntp_background_${Date.now()}.${ext}`;
      const filePath = path.join(themesDir, filename);
      
      let buffer;
      if (typeof fileData === 'string') {
        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(fileData);
      }
      
      fs.writeFileSync(filePath, buffer);
      return { success: true, path: `theme://themes/${filename}` };
    } catch (e) {
      console.error('Failed to save theme image:', e);
      return { success: false, error: e.message };
    }
  });

  // --- Safety Check ---
  ipcMain.handle('safety-check-version', async () => {
    return {
      current: app.getVersion(),
      latest: '0.1.0', // Hardcoded for now — upgrade to GitHub Releases API later
    };
  });

  ipcMain.handle('safety-check-breaches', async (event, email) => {
    if (!email) return { success: false, error: 'No email provided' };
    try {
      // Use XposedOrNot free API — no key required
      const response = await net.fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);
      if (response.status === 404) {
        // 404 means the email was NOT found in any breaches
        return { success: true, breaches: [], count: 0 };
      }
      if (!response.ok) {
        return { success: false, error: `API returned ${response.status}` };
      }
      const data = await response.json();
      // XposedOrNot returns breaches as a nested array: [["breach1", "breach2"]]
      let breaches = data.breaches || [];
      if (breaches.length > 0 && Array.isArray(breaches[0])) {
        breaches = breaches[0];
      }
      return { success: true, breaches, count: breaches.length };
    } catch (e) {
      console.error('Safety check breach lookup failed:', e);
      return { success: false, error: e.message };
    }
  });

  // --- Document Export (replaces Next.js API route + Puppeteer) ---
  ipcMain.handle('export-document', async (event, { content, format, userPrompt }) => {
    try {
      const { marked } = require('marked');
      let HTMLtoDOCX;
      try { HTMLtoDOCX = require('html-to-docx'); } catch(e) {}

      if (!content) return { success: false, error: 'Content is required' };
      if (!['pdf', 'docx'].includes(format)) return { success: false, error: 'Invalid format' };

      let filename = `export.${format}`;
      let finalContent = content;

      if (userPrompt) {
        const sanitizedPrompt = userPrompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
        filename = `${sanitizedPrompt || 'export'}.${format}`;
        finalContent = `**Instruction:** ${userPrompt}\n\n---\n\n${content}`;
      }

      const htmlContent = marked.parse(finalContent);
      const styledHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
              h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
              p { margin-bottom: 1em; }
              code { font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; background-color: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
              pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
              pre code { background-color: transparent; padding: 0; }
              blockquote { margin: 0; padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
              th, td { padding: 6px 13px; border: 1px solid #dfe2e5; }
              th { font-weight: 600; background-color: #f6f8fa; }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `;

      let buffer;
      if (format === 'pdf') {
        const printWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
        await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(styledHtml)}`);
        // Wait a tiny bit for render
        await new Promise(r => setTimeout(r, 200));
        buffer = await printWin.webContents.printToPDF({
          printBackground: true,
          margins: { top: 1, bottom: 1, left: 1, right: 1 }
        });
        printWin.destroy();
      } else if (format === 'docx' && HTMLtoDOCX) {
        buffer = await HTMLtoDOCX(styledHtml, null, {
          table: { row: { cantSplit: true } },
          footer: true,
          pageNumber: true,
        });
      }
      
      return { success: true, buffer, filename };
    } catch (e) {
      console.error('Export error:', e);
      return { success: false, error: e.message };
    }
  });

  // --- AI Backend Proxy ---
  const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'https://versr-ai-browser-verse.hf.space';

  ipcMain.handle('ai-request', async (event, payload) => {
    try {
      const { endpoint, payload: reqPayload } = payload || {};
      const envKeys = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '';
      let envKey = envKeys.includes(',') ? envKeys.split(',')[0].trim() : envKeys.trim();
      const apiKey = reqPayload?.apiKey || envKey;
      if (!apiKey?.trim()) {
        return { error: 'OpenRouter API key not configured. Please enter your API key in AI settings or set OPENROUTER_API_KEYS in .env.local.' };
      }

      const backendPayload = {
        ...reqPayload,
        api_key: apiKey.trim(),
      };
      
      // Field mapping: extraction_goal → data_type
      if (endpoint === '/extract' && reqPayload.extraction_goal) {
        backendPayload.data_type = reqPayload.extraction_goal;
      }
      // Remove renderer-only fields the backend doesn't need
      delete backendPayload.apiKey;

      const response = await fetch(`${AI_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { error: `Backend error (${response.status}): ${errText}` };
      }

      const data = await response.json();
      return {
        answer: data.answer || data.result || 'No response received.',
        result: data.result || data.answer,
        faqs: data.result,
      };
    } catch (e) {
      console.error('AI Request Error:', e);
      return { error: e.message };
    }
  });

  ipcMain.handle('ai-chat', async (event, payload) => {
    try {
      const { messages, model, apiKey: rendererKey, fallbackModels = [] } = payload || {};
      const envKeys = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '';
      
      // Use renderer key if provided in UI, otherwise use env keys
      let rawKeys = rendererKey?.trim() ? rendererKey : envKeys;
      
      let keysArray = [rawKeys];
      if (rawKeys.includes(',')) {
        keysArray = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
        // Shuffle for random load balancing
        keysArray = keysArray.sort(() => Math.random() - 0.5);
      }
      
      if (keysArray.length === 0) {
        return { error: 'OpenRouter API key not configured. Please enter your API key in AI settings or set OPENROUTER_API_KEYS in .env.local.' };
      }

      const m = model || 'openai/gpt-3.5-turbo';
      let lastError = null;

      // Try each key for the current model
      for (const k of keysArray) {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${k}`
            },
            body: JSON.stringify({
              model: m,
              messages: messages
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            lastError = `OpenRouter API error (${response.status}): ${errText}`;
            if (response.status === 429 || response.status === 402 || response.status === 502 || response.status >= 500) {
              console.warn(`Model ${m} with key ending in ${k.slice(-4)} failed (${response.status}), trying next key...`);
              continue; // Try next key
            }
            break; // Hard error (400, etc.), break out of key loop
          }

          const data = await response.json();
          return { answer: data.choices?.[0]?.message?.content || '', usedModel: m };
        }
        
      return { error: lastError || "All keys failed for this model." };
    } catch (e) {
      console.error('AI Chat Error:', e);
      return { error: e.message };
    }
  });

  // Since Tavily streaming involves Server-Sent Events, we can either proxy the stream or just
  // let the renderer handle the fetch itself since it's an external API.
  // Actually, standard fetch() in the Electron renderer works perfectly fine for external APIs, 
  // bypassing the need for an IPC wrapper entirely!
  // We will just let AISidebar use native browser fetch() directly to Tavily and OpenRouter.

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
    
    console.log(`[will-download] item.getURL()=${item.getURL()} webContents.getURL()=${webContents.getURL()}`);
    const itemUrlStr = item.getURL().split('#')[0].replace(/\/$/, '');
    const webUrlStr = webContents.getURL().split('#')[0].replace(/\/$/, '');
    const isWebpage = itemUrlStr === webUrlStr || item.getMimeType() === 'text/html';
    
    if (!downloadSettings.askEveryTime) {
      const savePath = path.join(downloadSettings.defaultPath, fileName);
      item.setSavePath(savePath);
    } else if (isWebpage) {
      // User is saving the actual webpage, suggest the page title instead of 'download'
      let title = webContents.getTitle() || 'Webpage';
      // Sanitize title for filename
      title = title.replace(/[<>:"/\\|?*]+/g, '_');
      const suggestedPath = path.join(downloadSettings.defaultPath, title + '.html');
      console.log(`[will-download] Setting saveDialogOptions to ${suggestedPath}`);
      item.setSaveDialogOptions({
        defaultPath: suggestedPath
      });
    }

    activeDownloads.set(downloadId, item);

    // Route download progress IPC to the main UI window instead of the webview
    const hostWebContents = BrowserWindow.getAllWindows()[0]?.webContents || webContents;

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
    
    // Open floating popup instead of native dialog
    if (sessionPermissions.has(permKey)) {
      return callback(sessionPermissions.get(permKey) === 'granted');
    }
    
    const reqId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    pendingPermissionCallbacks.set(reqId, callback);

    const { showPopupWindow } = require('./popupManager');
    let bounds = { x: 0, y: 0 };
    if (mainWindow && !mainWindow.isDestroyed()) {
      bounds = mainWindow.getBounds();
    }
    
    // Position it roughly below the navigation bar on the left
    const popupX = bounds.x + 20;
    const popupY = bounds.y + 60; // Approximate height of topbar + url bar

    const baseUrl = app.isPackaged ? "browser://" : "http://localhost:3000";

    showPopupWindow({
      parentWin: mainWindow,
      url: `${baseUrl}/popup?type=permission&origin=${encodeURIComponent(origin)}&permission=${encodeURIComponent(permission)}&id=${reqId}`,
      width: 320,
      height: 120,
      x: popupX,
      y: popupY
    });
  });

  ipcMain.on('permission-response', (event, { id, origin, permission, granted }) => {
    if (pendingPermissionCallbacks.has(id)) {
      const callback = pendingPermissionCallbacks.get(id);
      callback(granted);
      pendingPermissionCallbacks.delete(id);
      
      const permKey = `${origin}-${permission}`;
      sessionPermissions.set(permKey, granted ? 'granted' : 'denied');
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('permission-updated', { origin, permission, granted });
      }
    }
    
    // Close the popup after response
    const { closePopupWindow } = require('./popupManager');
    closePopupWindow();
  });

  ipcMain.on('revoke-permission', (event, { origin, permission }) => {
    const permKey = `${origin}-${permission}`;
    sessionPermissions.delete(permKey);
    const sess = session.defaultSession;
    sess.clearHostResolverCache();
    // In a real implementation, you'd want to persist these revocations or use sess.setPermissionRequestHandler
    console.log(`[Permissions] Revoked ${permission} for ${origin}`);
  });

  // Handle custom view-source fetching
  ipcMain.handle('fetch-source', async (event, { url, partition }) => {
    const { net } = require('electron');
    try {
      const sess = session.fromPartition(partition || 'persist:main');
      const response = await net.fetch(url, { session: sess });
      const text = await response.text();
      return text;
    } catch (err) {
      console.error('[fetch-source] Error fetching URL:', url, err);
      throw err;
    }
  });

  // Handle native theme
  ipcMain.handle('theme-get', () => {
    return { effective: nativeTheme.shouldUseDarkColors ? 'dark' : 'light' };
  });

  ipcMain.on('theme-set', (event, theme) => {
    nativeTheme.themeSource = theme;
  });

  nativeTheme.on('updated', () => {
    const effective = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    for (const win of allWindows) {
      if (!win.isDestroyed()) {
        win.webContents.send('theme-updated', { effective });
      }
    }
  });

  // --- MCP Server Integration ---
  const { fork } = require('child_process');
  const http = require('http');
  const tabManager = require('./tabManager');
  let mcpServerProcess = null;

  async function handleMcpBridgeMessage(msg) {
    const { type, data } = msg;
    const { getViewsMap } = require('./tabManager');
    switch (type) {
      case 'getTabs': {
        const allTabs = [];
        for (const win of allWindows) {
          if (win.isDestroyed()) continue;
          try {
            const tabs = await win.webContents.executeJavaScript(
              `JSON.parse(JSON.stringify(window.__getBrowserTabs?.() || []))`
            );
            allTabs.push(...tabs.map(t => ({ ...t, windowId: win.id })));
          } catch(e) {}
        }
        return allTabs;
      }
      case 'getBookmarks': {
        const win = mainWindow || [...allWindows][0];
        if (!win || win.isDestroyed()) return [];
        return await win.webContents.executeJavaScript(
          `JSON.parse(JSON.stringify(window.__getBookmarks?.() || []))`
        );
      }
      case 'getHistory': {
        const win = mainWindow || [...allWindows][0];
        if (!win || win.isDestroyed()) return [];
        const limit = data.limit || 100;
        return await win.webContents.executeJavaScript(
          `JSON.parse(JSON.stringify((window.__getHistory?.() || []).slice(0, ${limit})))`
        );
      }
      case 'getActiveTab': {
        const win = mainWindow || [...allWindows][0];
        if (!win || win.isDestroyed()) return {};
        const tabs = await win.webContents.executeJavaScript(`JSON.parse(JSON.stringify(window.__getBrowserTabs?.() || []))`);
        const activeTab = tabs.find(t => t.isActive);
        if (!activeTab) return {};
        const view = getViewsMap ? getViewsMap().get(activeTab.id) : null;
        let content = '';
        if (view) {
           content = await view.webContents.executeJavaScript(`
            (function() {
              var clone = document.body.cloneNode(true);
              ['script','style','noscript','svg','iframe'].forEach(function(tag) {
                clone.querySelectorAll(tag).forEach(function(el) { el.remove(); });
              });
              return clone.innerText || clone.textContent || '';
            })()
          `);
        }
        return { id: activeTab.id, title: activeTab.title, url: activeTab.url, content };
      }
      case 'getPageContent': {
        const tabId = data.tabId;
        if (!tabId) {
            return handleMcpBridgeMessage({ type: 'getActiveTab', data: {} });
        }
        const view = getViewsMap ? getViewsMap().get(tabId) : null;
        if (!view) throw new Error(`Tab ${tabId} not found`);
        const content = await view.webContents.executeJavaScript(`
          (function() {
            var clone = document.body.cloneNode(true);
            ['script','style','noscript','svg','iframe'].forEach(function(tag) {
              clone.querySelectorAll(tag).forEach(function(el) { el.remove(); });
            });
            return clone.innerText || clone.textContent || '';
          })()
        `);
        return { content, title: view.webContents.getTitle(), url: view.webContents.getURL() };
      }
      case 'navigateTo': {
        const win = mainWindow || [...allWindows][0];
        win.webContents.send('keyboard-shortcut', 'navigate', data.url);
        return { success: true };
      }
      case 'createTab': {
        const win = mainWindow || [...allWindows][0];
        win.webContents.send('new-tab-url', data.url || 'browser://newtab');
        return { success: true };
      }
      case 'closeTab': {
        const win = mainWindow || [...allWindows][0];
        win.webContents.send('keyboard-shortcut', 'close-tab');
        return { success: true };
      }
      case 'takeScreenshot': {
        const tabId = data.tabId;
        if (!tabId) {
            const win = mainWindow || [...allWindows][0];
            const tabs = await win.webContents.executeJavaScript(`JSON.parse(JSON.stringify(window.__getBrowserTabs?.() || []))`);
            const activeTab = tabs.find(t => t.isActive);
            if (!activeTab) throw new Error(`Active tab not found`);
            data.tabId = activeTab.id;
        }
        const view = getViewsMap ? getViewsMap().get(data.tabId) : null;
        if (!view) throw new Error(`Tab ${data.tabId} not found`);
        const image = await view.webContents.capturePage();
        return { image: image.toPNG().toString('base64') };
      }
      case 'aiRequest': {
        const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'https://versr-ai-browser-verse.hf.space';
        const response = await fetch(`${AI_BACKEND_URL}${data.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data.payload, api_key: process.env.OPENROUTER_API_KEY }),
        });
        return await response.json();
      }
      default:
        throw new Error(`Unknown bridge message type: ${type}`);
    }
  }

  function startMcpServer() {
    let serverPath = path.join(__dirname, '..', 'mcp-server', 'server.js');
    if (serverPath.includes('app.asar')) {
      serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
    }
    mcpServerProcess = fork(serverPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env }
    });
    
    mcpServerProcess.on('message', async (msg) => {
      try {
        const result = await handleMcpBridgeMessage(msg);
        mcpServerProcess.send({ id: msg.id, result });
      } catch (error) {
        mcpServerProcess.send({ id: msg.id, error: error.message });
      }
    });
    
    mcpServerProcess.on('exit', (code) => {
      console.log(`[MCP Server] Exited with code ${code}`);
      mcpServerProcess = null;
    });
  }

  function startMcpBridgeHttpServer() {
    const server = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/mcp-bridge') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const msg = JSON.parse(body);
            const result = await handleMcpBridgeMessage(msg);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id: msg.id, result }));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id: 0, error: error.message }));
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    server.listen(38271, '127.0.0.1', () => {
      console.log('[MCP Bridge] HTTP server listening on http://127.0.0.1:38271');
    });
  }

  startMcpServer();
  startMcpBridgeHttpServer();

  // --- MCP Client Manager (External Connections) ---
  const McpClientManager = require('./mcpClient');
  const mcpClientManager = new McpClientManager(
    path.join(app.getPath('userData'), 'mcp-servers.json')
  );
  
  mcpClientManager.loadConfig().catch(console.error);

  ipcMain.handle('mcp-client:listServers', () => mcpClientManager.listServers());
  ipcMain.handle('mcp-client:listTools', (_, server) => mcpClientManager.listTools(server));
  ipcMain.handle('mcp-client:callTool', (_, { server, tool, args }) => 
    mcpClientManager.callTool(server, tool, args)
  );
  ipcMain.handle('mcp-client:addServer', (_, { name, config }) => 
    mcpClientManager.addServer(name, config)
  );
  ipcMain.handle('mcp-client:removeServer', (_, name) => 
    mcpClientManager.removeServer(name)
  );
  ipcMain.handle('mcp-client:toggleServer', (_, { name, enabled }) => 
    mcpClientManager.toggleServer(name, enabled)
  );

  // --- VPN Handlers ---
  ipcMain.handle('vpn:setProxy', async (event, config) => {
    try {
      if (!config || Object.keys(config).length === 0) {
        await session.defaultSession.setProxy({});
        await session.fromPartition('persist:main').setProxy({});
        await session.fromPartition('incognito').setProxy({});
        // Force close all open TCP/keep-alive connections so the next request MUST use direct connection
        try {
          await session.defaultSession.closeAllConnections();
          await session.fromPartition('persist:main').closeAllConnections();
          await session.fromPartition('incognito').closeAllConnections();
        } catch (err) {}
        return { success: true };
      }
      const pRules = config?.proxyRules || '';
      const mode = config?.mode || (pRules ? 'fixed_servers' : 'direct');
      await session.defaultSession.setProxy({ proxyRules: pRules, mode });
      await session.fromPartition('persist:main').setProxy({ proxyRules: pRules, mode });
      await session.fromPartition('incognito').setProxy({ proxyRules: pRules, mode });
      return { success: true };
    } catch (e) {
      console.error('Failed to set proxy:', e);
      return { success: false, error: e.message };
    }
  });

  // --- Vault Handlers ---
  const vaultStore = require('./vaultStore');

  ipcMain.handle('vault:getAllCredentials', () => {
    return vaultStore.getAll();
  });

  ipcMain.handle('vault:getCredentials', (event, domain) => {
    return vaultStore.getByDomain(domain);
  });

  ipcMain.handle('vault:saveCredential', (event, { domain, username, password }) => {
    return vaultStore.addCredential(domain, username, password);
  });

  ipcMain.handle('vault:deleteCredential', (event, { id }) => {
    return vaultStore.deleteCredential(id);
  });

  ipcMain.handle('vault:promptSave', (event, { domain, username, password }) => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      wins[0].webContents.send('vault:onPromptSave', { domain, username, password });
    }
    return true;
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
