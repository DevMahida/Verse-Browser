const { WebContentsView, ipcMain, BrowserWindow, app, session } = require('electron');
const profileManager = require('./profileManager');
const { attachNavigationShields, attachCosmeticFilters } = require('./verseShield');
const { showPopupWindow, closePopupWindow, initSuggestionsPopup, showSuggestionsPopup, hideSuggestionsPopup, resizeSuggestionsPopup, sendSuggestionsUpdate } = require('./popupManager');
const path = require('path');
const isDev = !app.isPackaged;

const views = new Map(); // tabId -> WebContentsView
let isInitialized = false;
let globalForceDarkEnabled = false;

// --- Bug 1 Fix: Implement applyForceDarkToView ---
// Uses Chromium's built-in dark mode CSS injection via webContents.insertCSS.
function applyForceDarkToView(view, enabled, url) {
  if (!view || view.webContents.isDestroyed()) return;
  try {
    if (enabled) {
      // Skip internal pages and already-dark sites
      const currentUrl = url || view.webContents.getURL();
      if (currentUrl.startsWith('browser://') || currentUrl.startsWith('chrome://') || currentUrl === '') return;

      view.webContents.insertCSS(`
        :root {
          color-scheme: dark !important;
        }
        html {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        html img, html video, html canvas, html svg, html [style*="background-image"] {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `).catch(() => {});
    } else {
      // Remove dark mode by reloading — insertCSS doesn't have a remove API
      // In practice, toggling off triggers a reload anyway
    }
  } catch (e) {
    console.error('[TabManager] applyForceDarkToView error:', e.message);
  }
}

// --- Bug 1 Fix: Implement openGoogleAuthPopup ---
// Opens Google sign-in in the user's system browser (RFC 8252 OAuth for Native Apps),
// then links the resulting account to the active profile.
function openGoogleAuthPopup(view, partition) {
  const { signInWithGoogle } = require('./googleAuth');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[TabManager] Google OAuth credentials not configured.');
    return;
  }

  signInWithGoogle({ clientId, clientSecret })
    .then(({ tokens, profile }) => {
      // Extract the profileId from the partition string (e.g. 'persist:main' → 'main')
      const profileId = partition.replace('persist:', '') || 'main';
      profileManager.linkGoogleAccount(profileId, { tokens, profile });

      // Notify the renderer that sign-in succeeded so it can update the UI
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send('tab-event', {
            tabId: null,
            eventName: 'google-signin-success',
            data: { email: profile.email, name: profile.name, picture: profile.picture }
          });
        }
      }

      console.log(`[TabManager] Google sign-in successful for ${profile.email}`);
    })
    .catch((err) => {
      console.error('[TabManager] Google sign-in failed:', err.message);
    });
}

const isGoogleAuthUrl = (url) => {
  if (!url) return false;
  return url.includes('accounts.google.com') &&
    !url.includes('myaccount.google.com') &&
    !url.includes('SignOutOptions');
};


const checkCanGoBack = (wc) => (wc?.navigationHistory ? wc.navigationHistory.canGoBack() : wc?.canGoBack());
const checkCanGoForward = (wc) => (wc?.navigationHistory ? wc.navigationHistory.canGoForward() : wc?.canGoForward());

function initTabManager() {
  if (isInitialized) return;
  isInitialized = true;

  ipcMain.on('tab-create', (event, { tabId, url }) => {
    if (views.has(tabId)) return;

    const sender = event.sender; // The webContents of the requesting window
    const win = BrowserWindow.fromWebContents(sender);
    const profileId = win ? win._profileId : 'main';
    const isIncognito = win ? win._isIncognito : false;
    const finalPartition = isIncognito ? 'incognito' : profileManager.partitionFor(profileId);

    console.log(`[TabManager] tab-create ${tabId} url:${url} partition:${finalPartition}`);

    const view = new WebContentsView({
      webPreferences: {
        partition: finalPartition,
        contextIsolation: true,
        nodeIntegration: false,
        preload: require('path').join(__dirname, 'tab-preload.js')
      }
    });

    view.webContents.setMaxListeners(100);

    // Make sure we have a solid background color so it's not transparent
    view.setBackgroundColor('#ffffff');
    view._isAttached = false;
    view._parentWindow = win;
    views.set(tabId, view);

    // Attach Verse Shield navigation guards (HTTPS upgrade + tracking-param stripping)
    attachNavigationShields(view.webContents, tabId);
    // Attach cosmetic filters and scriptlets (e.g. YouTube Ad Skipper)
    attachCosmeticFilters(view.webContents);

    // Setup event forwarding bound specifically to the window that requested this tab
    const forwardEvent = (eventName, data = {}) => {
      if (!sender.isDestroyed()) {
        sender.send('tab-event', { tabId, eventName, data });
      }
    };

    view.webContents.on('will-navigate', (e, navigationUrl) => {
      if (globalForceDarkEnabled) {
        applyForceDarkToView(view, true, navigationUrl);
      }
    });

    view.webContents.on('will-redirect', (e, navigationUrl) => {
      // Nothing needed here if we let it redirect natively
    });

    view.webContents.on('did-start-navigation', (e, navigationUrl, isInPlace, isMainFrame) => {
      if (isMainFrame && globalForceDarkEnabled) {
        applyForceDarkToView(view, true, navigationUrl);
      }
    });

    view.webContents.on('did-navigate', (e, navigationUrl) => {
      let displayUrl = navigationUrl;
      if (navigationUrl.includes('view-source.html') && navigationUrl.includes('?url=')) {
        const target = new URL(navigationUrl).searchParams.get('url');
        displayUrl = `view-source:${target}`;
      }
      forwardEvent('did-navigate', { url: displayUrl, canGoBack: checkCanGoBack(view.webContents), canGoForward: checkCanGoForward(view.webContents) });

      if (globalForceDarkEnabled) {
        applyForceDarkToView(view, true, navigationUrl);
      }


    });
    view.webContents.on('did-navigate-in-page', (e, navigationUrl) => {
      let displayUrl = navigationUrl;
      if (navigationUrl.includes('view-source.html') && navigationUrl.includes('?url=')) {
        const target = new URL(navigationUrl).searchParams.get('url');
        displayUrl = `view-source:${target}`;
      }
      forwardEvent('did-navigate-in-page', { url: displayUrl, canGoBack: checkCanGoBack(view.webContents), canGoForward: checkCanGoForward(view.webContents) });

      if (globalForceDarkEnabled) {
        applyForceDarkToView(view, true);
      }
    });
    view.webContents.on('page-title-updated', (e, title) => forwardEvent('page-title-updated', { title }));
    view.webContents.on('page-favicon-updated', (e, favicons) => forwardEvent('page-favicon-updated', { favicons }));
    view.webContents.on('did-start-loading', () => forwardEvent('did-start-loading'));
    view.webContents.on('did-stop-loading', () => forwardEvent('did-stop-loading', { canGoBack: checkCanGoBack(view.webContents), canGoForward: checkCanGoForward(view.webContents) }));
    view.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
      if (errorCode !== -3) forwardEvent('did-fail-load', { errorCode, errorDescription });
    });

    view.webContents.on('close', (e) => {
      console.log(`[TabManager] webContents close event fired for tab ${tabId}`);
      
      // If we are on a pw.live watch page, the video player's broken script 
      // calls window.top.close() when the back button is clicked. 
      // We must intercept this at the native level and force a goBack() instead!
      // BUT only if we CAN go back. If they opened it in a new tab (canGoBack is false), 
      // we actually WANT to close the tab!
      const currentUrl = view.webContents.getURL();
      if (currentUrl.includes('pw.live') && currentUrl.includes('/watch/')) {
        if (view.webContents.canGoBack()) {
          console.log(`[TabManager] Intercepting window.close() on pw.live/watch, forcing goBack()`);
          e.preventDefault();
          view.webContents.goBack();
          return;
        } else {
          console.log(`[TabManager] pw.live/watch called window.close() on a new tab, allowing tab to close.`);
          // let it fall through and close
        }
      }

      if (!view._isDestroying) {
        forwardEvent('close');
      }
    });

    // Bug 2 Fix: Removed hardcoded debug log path.
    // Tab console messages are forwarded to Electron's stdout in dev mode only.
    if (isDev) {
      view.webContents.on('console-message', (event, level, message, line, sourceId) => {
        // Only log warnings and errors to avoid flooding stdout
        if (level >= 2) {
          console.log(`[Tab ${tabId}] ${message}`);
        }
      });
    }

    views.set(tabId, view);

    // Handle new window opens (target="_blank" or window.open)
    view.webContents.setWindowOpenHandler(({ url, disposition }) => {
      // Allow Google Auth popups to open natively so they inherit the correct session and UA
      if (isGoogleAuthUrl(url)) {
        return { action: 'allow' };
      }

      // Alt+Click natively triggers save-to-disk
      if (disposition === 'save-to-disk') {
        view.webContents.downloadURL(url);
        return { action: 'deny' };
      }

      // Otherwise open a new tab in the browser
      const win = view._parentWindow;
      if (win && !win.isDestroyed()) {
        win.webContents.send('webview-new-window', { url });
      }
      return { action: 'deny' };
    });

    // We no longer need preload IPC injection for did-finish-load because we execute JS dynamically for view-source

    view.webContents.on('media-started-playing', () => forwardEvent('media-started-playing'));
    view.webContents.on('media-paused', () => forwardEvent('media-paused'));
    view.webContents.on('zoom-changed', (e, zoomDirection) => {
      const currentLevel = view.webContents.getZoomLevel();
      const newLevel = zoomDirection === 'in' ? currentLevel + 0.5 : currentLevel - 0.5;
      view.webContents.setZoomLevel(newLevel);
      forwardEvent('zoom-changed', { level: newLevel });
    });

    view.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown') {
        const win = view._parentWindow;
        if (win && !win.isDestroyed()) {
          win.webContents.send('webview-keydown', {
            key: input.key,
            code: input.code,
            ctrlKey: input.control,
            shiftKey: input.shift,
            altKey: input.alt,
            metaKey: input.meta,
          });
        }
      }
    });
    view.webContents.on('found-in-page', (e, result) => {
      forwardEvent('found-in-page', {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches
      });
    });

    view.webContents.on('enter-html-full-screen', () => {
      console.log(`[Tab ${tabId}] enter-html-full-screen fired`);
      view._isHtmlFullScreen = true;
      const win = view._parentWindow;
      console.log(`[Tab ${tabId}] Parent window found:`, !!win);
      if (win && !win.isDestroyed()) {
        view._preFullScreenBounds = view.getBounds();
        
        const updateBoundsForFullScreen = () => {
          if (!view._isHtmlFullScreen) return;
          const bounds = win.getContentBounds();
          view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        };
        
        win.once('enter-full-screen', updateBoundsForFullScreen);
        win.setFullScreen(true);
        // Fallback in case it's already full screen or event doesn't fire
        setTimeout(updateBoundsForFullScreen, 100);
      }
    });

    view.webContents.on('leave-html-full-screen', () => {
      console.log(`[Tab ${tabId}] leave-html-full-screen fired`);
      view._isHtmlFullScreen = false;
      const win = view._parentWindow;
      if (win && !win.isDestroyed()) {
        win.setFullScreen(false);
        if (view._preFullScreenBounds) {
          view.setBounds(view._preFullScreenBounds);
        }
      }
    });

    if (url) {
      if (url.startsWith('view-source:')) {
        const target = url.replace('view-source:', '');
        const path = require('path');
        view.webContents.loadFile(path.join(__dirname, 'view-source.html'), { query: { url: target, partition: finalPartition || 'persist:main' } }).then(() => {
          const { net } = require('electron');
          net.fetch(target, { session: view.webContents.session })
            .then(res => res.text())
            .then(text => view.webContents.executeJavaScript(`window.receiveSource(${JSON.stringify(text)})`))
            .catch(err => view.webContents.executeJavaScript(`window.showError(${JSON.stringify(err.message)})`));
        }).catch(() => { });
      } else {
        view.webContents.loadURL(url).catch(() => { });
      }
    }

    // Apply Force Dark if globally enabled
    if (globalForceDarkEnabled) {
      applyForceDarkToView(view, true);
    }
  });

  // Direct Google Sign-In popup handler — triggered from ProfileMenu's "Sign in with Google" button
  ipcMain.on('google-signin-popup', (event) => {
    const sender = event.sender;
    const win = BrowserWindow.fromWebContents(sender);
    const profileId = win ? win._profileId : 'main';
    const isIncognito = win ? win._isIncognito : false;
    const partition = isIncognito ? 'incognito' : profileManager.partitionFor(profileId);

    // Find the active tab view to navigate after sign-in, or pass null
    const activeView = [...views.values()].find(v => {
      const parentWin = BrowserWindow.getAllWindows().find(w => w.contentView && w.contentView.children && w.contentView.children.includes(v));
      return parentWin === win;
    }) || null;

    openGoogleAuthPopup(activeView, partition);
  });



  ipcMain.on('tab-destroy', (event, tabId) => {
    const view = views.get(tabId);
    if (view) {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window && !window.isDestroyed() && view._isAttached) {
        try { window.contentView.removeChildView(view); } catch (e) { }
        view._isAttached = false;
      }
      if (!view.webContents.isDestroyed()) {
        view._isDestroying = true;
        view.webContents.close();
      }
      views.delete(tabId);
    }
  });

  ipcMain.on('tab-update-bounds', (event, { tabId, bounds, isActive }) => {

    const view = views.get(tabId);
    const window = BrowserWindow.fromWebContents(event.sender);

    if (view && window && !window.isDestroyed()) {
      if (!view._isHtmlFullScreen) {
        view.setBounds(bounds);
      }

      const isAttached = view._isAttached;

      if (isActive) {
        if (!isAttached) {
          window.contentView.addChildView(view);
          view._isAttached = true;

          // Give the WebContentsView keyboard focus when a tab transitions to active
          // so key events (e.g. 'F' for fullscreen on YouTube) reach the page
          if (!view.webContents.isDestroyed()) {
            view.webContents.focus();
          }
        }
        // If already attached, we do NOT remove and re-add it.
        // Doing so breaks the Chromium rendering pipeline on Windows (freezing repaints, e.g. for zooming).
        // Since inactive tabs are detached, an attached tab is already guaranteed to be visible.
      } else if (!isActive && isAttached) {
        try { window.contentView.removeChildView(view); } catch (e) { }
        view._isAttached = false;
      }
    }
  });

  // Explicit focus request — called when the user clicks into the webview area
  ipcMain.on('tab-focus', (event, tabId) => {
    const view = views.get(tabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.focus();
    }
  });

  ipcMain.on('tab-navigate', (event, { tabId, url }) => {
    console.log(`[TabManager] tab-navigate ${tabId} url:${url}`);

    const view = views.get(tabId);
    if (view && url) {
      if (url.startsWith('view-source:')) {
        const target = url.replace('view-source:', '');
        const path = require('path');
        const partition = view.webContents.session.partition || 'persist:main';
        view.webContents.loadFile(path.join(__dirname, 'view-source.html'), { query: { url: target, partition: partition } }).then(() => {
          const { net } = require('electron');
          net.fetch(target, { session: view.webContents.session })
            .then(res => res.text())
            .then(text => view.webContents.executeJavaScript(`window.receiveSource(${JSON.stringify(text)})`))
            .catch(err => view.webContents.executeJavaScript(`window.showError(${JSON.stringify(err.message)})`));
        }).catch(() => { });
      } else {
        view.webContents.loadURL(url).catch(() => { });
      }

      if (globalForceDarkEnabled) {
        applyForceDarkToView(view, true);
      }
    }
  });

  ipcMain.on('tab-action', (event, { tabId, action, data }) => {
    const view = views.get(tabId);
    if (!view || view.webContents.isDestroyed()) return;

    switch (action) {
      case 'reload':
        view.webContents.reload();
        break;
      case 'hard-reload':
        view.webContents.reloadIgnoringCache();
        break;
      case 'stop':
        view.webContents.stop();
        break;
      case 'goBack':
      case 'go-back':
        if (checkCanGoBack(view.webContents)) view.webContents.goBack();
        break;
      case 'goForward':
      case 'go-forward':
        if (checkCanGoForward(view.webContents)) view.webContents.goForward();
        break;
      case 'copy':
        view.webContents.copy();
        break;
      case 'cut':
        view.webContents.cut();
        break;
      case 'paste':
        view.webContents.paste();
        break;
      case 'save-page':
        view.webContents.downloadURL(view.webContents.getURL());
        break;
      case 'toggle-devtools':
        if (view.webContents.isDevToolsOpened()) {
          view.webContents.closeDevTools();
        } else {
          view.webContents.openDevTools({ mode: 'right' });
        }
        break;
      case 'inspect-element':
        view.webContents.inspectElement(0, 0);
        break;
      case 'open-file':
        {
          const { dialog } = require('electron');
          const mainWindow = BrowserWindow.fromWebContents(event.sender);
          dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
              { name: 'Documents', extensions: ['pdf', 'html', 'txt', 'md'] },
              { name: 'Images', extensions: ['jpg', 'png', 'svg', 'webp'] },
              { name: 'All Files', extensions: ['*'] }
            ]
          }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
              view.webContents.loadFile(result.filePaths[0]);
            }
          });
        }
        break;
      case 'set-muted':
        view.webContents.setAudioMuted(data.muted);
        break;
      case 'print':
        view.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
          if (!success && failureReason) {
            console.error('[TabManager] Print failed:', failureReason);
          }
        });
        break;
      case 'zoom-in':
        {
          const currentLevel = view._zoomLevel || 0;
          view._zoomLevel = currentLevel + 0.5;
          view.webContents.setZoomLevel(view._zoomLevel);
          if (!event.sender.isDestroyed()) {
            event.sender.send('tab-event', { tabId: tabId, eventName: 'zoom-changed', data: { level: view._zoomLevel } });
          }
        }
        break;
      case 'zoom-out':
        {
          const currentLevel = view._zoomLevel || 0;
          view._zoomLevel = currentLevel - 0.5;
          view.webContents.setZoomLevel(view._zoomLevel);
          if (!event.sender.isDestroyed()) {
            event.sender.send('tab-event', { tabId: tabId, eventName: 'zoom-changed', data: { level: view._zoomLevel } });
          }
        }
        break;
      case 'zoom-reset':
        view._zoomLevel = 0;
        view.webContents.setZoomLevel(0);
        if (!event.sender.isDestroyed()) {
          event.sender.send('tab-event', { tabId: tabId, eventName: 'zoom-changed', data: { level: 0 } });
        }
        break;
      case 'findInPage':
        if (data && data.text) {
          view.webContents.findInPage(data.text);
        }
        break;
      case 'find-next':
        if (data && data.text) {
          view.webContents.findInPage(data.text, { findNext: true, forward: true });
        }
        break;
      case 'find-prev':
        if (data && data.text) {
          view.webContents.findInPage(data.text, { findNext: true, forward: false });
        }
        break;
      case 'stop-find-in-page':
        view.webContents.stopFindInPage('clearSelection');
        break;
    }
  });



  ipcMain.handle('tab-capture-page', async (event, tabId) => {
    const view = views.get(tabId);
    if (!view || view.webContents.isDestroyed()) return null;
    try {
      const image = await view.webContents.capturePage();
      return image.toDataURL();
    } catch (e) {
      console.error('Failed to capture page:', e);
      return null;
    }
  });

  // Execute JavaScript in a tab's webContents (used by AISidebar, NavigationBar, and MCP bridge)
  // Bug 5 Fix: Validate that the caller is a host BrowserWindow's renderer, not a tab webContents
  ipcMain.handle('tab-execute-js', async (event, { tabId, code }) => {
    // Security: Only the main BrowserWindow renderer (our React UI) may call this.
    // Tab webContents (website pages) do NOT have access to this IPC because they
    // use tab-preload.js (which doesn't expose electron APIs), not preload.js.
    const callerWin = BrowserWindow.fromWebContents(event.sender);
    if (!callerWin) {
      console.warn('[TabManager] tab-execute-js rejected: caller is not a BrowserWindow');
      return null;
    }

    const view = views.get(tabId);
    if (!view || view.webContents.isDestroyed()) return null;
    try {
      return await view.webContents.executeJavaScript(code);
    } catch (e) {
      console.error(`[TabManager] executeJavaScript failed for tab ${tabId}:`, e.message);
      return null;
    }
  });

  ipcMain.on('open-popup', (event, { url, width, height, x, y }) => {
    const parentWin = BrowserWindow.fromWebContents(event.sender);
    const profileId = parentWin ? parentWin._profileId : 'main';
    const isIncognito = parentWin ? parentWin._isIncognito : false;
    const partition = isIncognito ? 'incognito' : profileManager.partitionFor(profileId);
    showPopupWindow({ parentWin, url, width, height, x, y, partition });
  });

  ipcMain.on('close-popup', () => {
    closePopupWindow();
  });

  ipcMain.on('resize-popup', (event, { width, height }) => {
    // console.log(`[IPC] resize-popup called with width=${width}, height=${height}`);
    const { resizePopupWindow } = require('./popupManager');
    resizePopupWindow(width, height);
  });

  ipcMain.on('show-suggestions-popup', (event, { x, y, width, height }) => {
    const parentWin = BrowserWindow.fromWebContents(event.sender);
    const profileId = parentWin ? parentWin._profileId : 'main';
    const isIncognito = parentWin ? parentWin._isIncognito : false;
    const partition = isIncognito ? 'incognito' : profileManager.partitionFor(profileId);
    
    // Bug 3 Fix: Use file:// paths in production instead of localhost:3000
    const baseUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '..', 'out')}`;
    
    initSuggestionsPopup(parentWin, partition, baseUrl);
    
    showSuggestionsPopup(x, y, width, height);
  });

  ipcMain.on('hide-suggestions-popup', () => {
    hideSuggestionsPopup();
  });

  ipcMain.on('update-suggestions', (event, { suggestions, selectedIndex }) => {
    sendSuggestionsUpdate(suggestions, selectedIndex);
  });

  ipcMain.on('resize-suggestions-popup', (event, { width, height }) => {
    resizeSuggestionsPopup(width, height);
  });

  ipcMain.on('suggestions-select', (event, suggestion) => {
    const mainWin = BrowserWindow.getAllWindows().find(w => !w.getParentWindow() && !w.isDestroyed() && w.isVisible());
    if (mainWin) {
      mainWin.webContents.send('suggestions:selected', suggestion);
    }
  });

  ipcMain.on('open-new-tab', (event, { url }) => {
    const mainWin = BrowserWindow.getAllWindows().find(w => !w.getParentWindow() && !w.isDestroyed() && w.isVisible());
    if (mainWin) {
      mainWin.webContents.send('tab-event', { action: 'open-tab', url: url || 'browser://extensions' });
    }
  });

  // --- Overlay helpers: hide / show all attached tab views ---
  // React modals (VPN, etc.) are rendered in the main renderer and sit BELOW
  // native WebContentsViews. These handlers temporarily detach all views so
  // the React overlay is visible, then re-attach them when the overlay closes.
  const _hiddenViews = new Set(); // track which views we hid

  ipcMain.on('tab-views-hide', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) return;
    _hiddenViews.clear();
    for (const [tabId, view] of views) {
      if (view._isAttached) {
        try { window.contentView.removeChildView(view); } catch (e) {}
        _hiddenViews.add(tabId);
      }
    }
  });

  ipcMain.on('tab-views-show', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) return;
    for (const tabId of _hiddenViews) {
      const view = views.get(tabId);
      if (view && !view.webContents.isDestroyed()) {
        try { window.contentView.addChildView(view); } catch (e) {}
        view._isAttached = true;
      }
    }
    _hiddenViews.clear();
  });
}

module.exports = { initTabManager, getViewsMap: () => views };

