const { app, BrowserWindow, ipcMain, session, Menu, screen, net, nativeTheme } = require("electron");
const path = require("path");

// Load .env.local so Electron main process can read GOOGLE_CLIENT_ID, etc.
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { initTabManager } = require('./tabManager');
const profileManager = require('./profileManager');
const { loadWindowState, trackWindowState } = require('./windowBounds');
// const { authenticateWithGoogle } = require('./google-oauth'); // Disabled per user request

const isDev = !app.isPackaged;

if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

// Chromium feature flags — must be a single comma-separated call (multiple calls overwrite).
// - WebAuthentication: Electron's WebAuthn is incomplete; disabling it prevents the broken
//   Windows Security passkey dialog and forces Google to fall back to password auth
app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationProxy');
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
  // Dynamically strip Electron and AppName from the default User-Agent
  // We use the Chrome User-Agent globally. Because we set app.userAgentFallback,
  // Electron automatically scrubs "Electron" from navigator.userAgentData and sec-ch-ua!
  const chromeVersion = process.versions.chrome || '120.0.0.0';
  const spoofedUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  app.userAgentFallback = spoofedUA;
  session.defaultSession.setUserAgent(spoofedUA);

  // Ensure every newly created profile session partition also uses the spoofed Edge User-Agent
  app.on('session-created', (sess) => {
    sess.setUserAgent(spoofedUA);
  });



  const savedState = loadWindowState();

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
      const viewsMap = require('./tabManager')._viewsMap || new Map();
      // Wait, we don't have direct access to views Map from here easily unless exported.
      // But tab-navigate or tab-action can be sent to the renderer, or we can just broadcast.
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tab-event', {
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

  const defaultProfile = profileManager.ensureDefaultProfile();
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
        win.setPosition(newX, newY);
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

  // --- AI Assistant IPC Handlers ---
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';

  ipcMain.handle('ai-request', async (event, payload) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return { error: 'Server API key not configured.' };

      const { endpoint, payload: reqPayload } = payload;
      const { text = '', html = '', query = '', title = '', url = '', selected_text = '', extraction_goal = '', platform = '', style = '', target_language = '' } = reqPayload;

      const pageCtx = `Page Title: ${title || 'Unknown'}\nPage URL: ${url || 'Unknown'}`;
      const contentSnippet = (text || '').substring(0, 12000);

      let systemPrompt = 'You are a helpful AI assistant.';
      let userContent = `${pageCtx}\n\nContent:\n${contentSnippet}\n\nQuery: ${query || 'Please help with this content.'}`;
      let key = 'result';

      switch (endpoint) {
        case '/summarize':
          systemPrompt = 'You are a helpful AI assistant that summarizes web page content concisely and clearly. Use markdown formatting with headers and bullet points.';
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nPlease provide a clear, concise summary of this page.`;
          break;
        case '/explain':
          systemPrompt = 'You are a helpful AI tutor that explains articles in simple, easy-to-understand language. Use analogies and plain English.';
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nPlease explain this article in simple terms.`;
          break;
        case '/key-points':
          systemPrompt = 'You are a helpful assistant that extracts the most important key points from web content. Format as a numbered or bulleted markdown list.';
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nList the key points from this page.`;
          break;
        case '/faqs':
          systemPrompt = 'You are a helpful assistant that generates frequently asked questions (FAQs) with answers based on web content. Format as markdown with bold questions.';
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nGenerate 5 relevant FAQs with answers based on this page.`;
          key = 'faqs';
          break;
        case '/study-notes':
          systemPrompt = 'You are a study assistant that creates detailed, well-structured study notes from web content. Use headers, bullet points, and highlight key terms.';
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nCreate comprehensive study notes from this page.`;
          break;
        case '/extract':
          systemPrompt = `You are a data extraction assistant. Extract all ${extraction_goal || 'relevant data'} from the provided content. Return them as a clean markdown list.`;
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nExtract all ${extraction_goal || 'relevant information'} from this page.`;
          break;
        case '/generate-post':
          systemPrompt = `You are a social media content creator. Create an engaging ${platform || 'social media'} post based on the page content. Be concise, engaging, and use relevant hashtags if appropriate.`;
          userContent = `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nCreate a ${platform || 'social media'} post about this page.`;
          break;
        case '/rewrite':
          systemPrompt = `You are a writing assistant that rewrites content in a ${style || 'professional'} style. Maintain the original meaning while improving the tone and clarity.`;
          userContent = `${pageCtx}\n\nContent to rewrite:\n${contentSnippet}\n\nRewrite this content in a ${style || 'professional'} style.`;
          break;
        case '/translate':
          systemPrompt = `You are a professional translator. Translate the given text accurately to ${target_language || 'Spanish'}. Preserve the meaning and tone.`;
          userContent = `Translate the following text to ${target_language || 'Spanish'}:\n\n${contentSnippet}`;
          break;
        case '/rag':
          const pageText = (text || html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 12000);
          const selectionNote = selected_text ? `\n\nUser has selected this text on the page: "${selected_text.substring(0, 1000)}"` : '';
          systemPrompt = 'You are a helpful AI assistant embedded in a web browser. You have access to the current web page content and can answer questions about it accurately. Be concise but thorough. Use markdown formatting where appropriate.';
          userContent = `${pageCtx}\n\nPage Content:\n${pageText}${selectionNote}\n\nUser Question: ${query}`;
          key = 'answer';
          break;
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://verse-browser.app',
          'X-Title': 'Verse Browser AI',
        },
        body: JSON.stringify({
          model: reqPayload.model || DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { error: `OpenRouter error: ${errText}` };
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'No response received.';
      return { [key]: answer, answer, result: answer };
    } catch (e) {
      console.error('AI Request Error:', e);
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