const { WebContentsView, ipcMain, BrowserWindow, app } = require('electron');
const profileManager = require('./profileManager');
const { attachNavigationShields, attachCosmeticFilters } = require('./verseShield');
const { showPopupWindow, closePopupWindow } = require('./popupManager');

const views = new Map(); // tabId -> WebContentsView
let isInitialized = false;
let globalForceDarkEnabled = false;

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

    view.webContents.on('console-message', (event, level, message, line, sourceId) => {
      try {
        const fs = require('fs');
        const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\f834f673-3d34-41ac-823e-7cce8eea0470\\scratch\\tab_console.log';
        fs.appendFileSync(logPath, `[Tab ${tabId}] ${message}\n`);
      } catch (e) {}
    });

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
      if (!sender.isDestroyed()) {
        sender.send('webview-new-window', { url });
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
    view.webContents.on('found-in-page', (e, result) => {
      forwardEvent('found-in-page', {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches
      });
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
        }).catch(() => {});
      } else {
        view.webContents.loadURL(url).catch(() => {});
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
        try { window.contentView.removeChildView(view); } catch (e) {}
        view._isAttached = false;
      }
      if (!view.webContents.isDestroyed()) {
        view.webContents.close();
      }
      views.delete(tabId);
    }
  });

  ipcMain.on('tab-update-bounds', (event, { tabId, bounds, isActive }) => {
    
    const view = views.get(tabId);
    const window = BrowserWindow.fromWebContents(event.sender);
    
    if (view && window && !window.isDestroyed()) {
      view.setBounds(bounds);
      
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
        try { window.contentView.removeChildView(view); } catch(e) {}
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
        }).catch(() => {});
      } else {
        view.webContents.loadURL(url).catch(() => {});
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

  ipcMain.on('open-new-tab', (event, { url }) => {
    const mainWin = BrowserWindow.getAllWindows().find(w => !w.getParentWindow() && !w.isDestroyed() && w.isVisible());
    if (mainWin) {
      mainWin.webContents.send('tab-event', { action: 'open-tab', url: url || 'browser://extensions' });
    }
  });
}

module.exports = { initTabManager, getViewsMap: () => views };

