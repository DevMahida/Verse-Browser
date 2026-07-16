const { WebContentsView, ipcMain, BrowserWindow } = require('electron');
const profileManager = require('./profileManager');

const views = new Map(); // tabId -> WebContentsView
let isInitialized = false;
let globalForceDarkEnabled = false;

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

    // --- Comprehensive anti-detection for Google Sign-In ---
    // Google checks multiple signals: UA string, Sec-CH-UA headers,
    // navigator.webdriver, window.chrome, navigator.plugins.
    // We must address ALL of them or sign-in gets blocked.

    const viewSession = view.webContents.session;
    const chromeVersion = process.versions.chrome || '120.0.0.0';
    const spoofedUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    viewSession.setUserAgent(spoofedUA);

    // Network-level: intercept ALL outgoing requests and spoof the UA and Client Hints.
    viewSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders };
      
      // Force the User-Agent header
      headers['User-Agent'] = spoofedUA;

      // Spoof Client Hints to look like standard Google Chrome instead of Electron
      for (const key of Object.keys(headers)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'sec-ch-ua') {
          headers[key] = headers[key].replace(/Electron/g, 'Google Chrome');
        }
      }
      
      callback({ requestHeaders: headers });
    });



    // Make sure we have a solid background color so it's not transparent
    view.setBackgroundColor('#ffffff');
    view._isAttached = false;
    views.set(tabId, view);
    
    // Setup event forwarding bound specifically to the window that requested this tab
    const forwardEvent = (eventName, data = {}) => {
      if (!sender.isDestroyed()) {
        sender.send('tab-event', { tabId, eventName, data });
      }
    };

    view.webContents.on('did-navigate', (e, navigationUrl) => {
      let displayUrl = navigationUrl;
      if (navigationUrl.includes('view-source.html') && navigationUrl.includes('?url=')) {
        const target = new URL(navigationUrl).searchParams.get('url');
        displayUrl = `view-source:${target}`;
      }
      forwardEvent('did-navigate', { url: displayUrl, canGoBack: view.webContents.canGoBack(), canGoForward: view.webContents.canGoForward() });
    });
    view.webContents.on('did-navigate-in-page', (e, navigationUrl) => {
      let displayUrl = navigationUrl;
      if (navigationUrl.includes('view-source.html') && navigationUrl.includes('?url=')) {
        const target = new URL(navigationUrl).searchParams.get('url');
        displayUrl = `view-source:${target}`;
      }
      forwardEvent('did-navigate-in-page', { url: displayUrl, canGoBack: view.webContents.canGoBack(), canGoForward: view.webContents.canGoForward() });
    });
    view.webContents.on('page-title-updated', (e, title) => forwardEvent('page-title-updated', { title }));
    view.webContents.on('page-favicon-updated', (e, favicons) => forwardEvent('page-favicon-updated', { favicons }));
    view.webContents.on('did-start-loading', () => forwardEvent('did-start-loading'));
    view.webContents.on('did-stop-loading', () => forwardEvent('did-stop-loading', { canGoBack: view.webContents.canGoBack(), canGoForward: view.webContents.canGoForward() }));
    view.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
      if (errorCode !== -3) forwardEvent('did-fail-load', { errorCode, errorDescription });
    });

    // Allow popups for OAuth flows (like Google Sign-In) to open normally
    view.webContents.setWindowOpenHandler(({ url }) => {
      return { action: 'allow' };
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

    view.webContents.setWindowOpenHandler(({ url }) => {
      if (!sender.isDestroyed()) {
        sender.send('webview-new-window', { url });
      }
      return { action: 'deny' };
    });

    if (url) {
      if (url.startsWith('view-source:')) {
        const target = url.replace('view-source:', '');
        const path = require('path');
        view.webContents.loadFile(path.join(__dirname, 'view-source.html'), { query: { url: target, partition: partition || 'persist:main' } }).then(() => {
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

  ipcMain.on('set-force-dark', (event, enabled) => {
    globalForceDarkEnabled = enabled;
    for (const view of views.values()) {
      applyForceDarkToView(view, enabled);
    }
  });

  function applyForceDarkToView(view, enabled) {
    if (!view || view.webContents.isDestroyed()) return;
    try {
      if (enabled) {
        if (!view.webContents.debugger.isAttached()) {
          view.webContents.debugger.attach('1.3');
        }
        view.webContents.debugger.sendCommand('Emulation.setAutoDarkModeOverride', { enabled: true }).catch(() => {});
      } else {
        if (view.webContents.debugger.isAttached()) {
          view.webContents.debugger.sendCommand('Emulation.setAutoDarkModeOverride', { enabled: false }).catch(() => {});
          view.webContents.debugger.detach();
        }
      }
    } catch (err) {
      console.error('Failed to apply force dark mode:', err);
    }
  }

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
    console.log(`[TabManager] tab-update-bounds ${tabId} isActive:${isActive} bounds:`, bounds);
    
    const view = views.get(tabId);
    const window = BrowserWindow.fromWebContents(event.sender);
    
    if (view && window && !window.isDestroyed()) {
      view.setBounds(bounds);
      
      const isAttached = view._isAttached;
      
      if (isActive) {
        if (!isAttached) {
          window.contentView.addChildView(view);
          view._isAttached = true;
        } else {
          // Since we can't easily check the top-most view due to wrapper objects, we safely remove and re-add.
          try { window.contentView.removeChildView(view); } catch(e) {}
          window.contentView.addChildView(view);
          view._isAttached = true;
        }
      } else if (!isActive && isAttached) {
        try { window.contentView.removeChildView(view); } catch(e) {}
        view._isAttached = false;
      }
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
        if (view.webContents.canGoBack()) view.webContents.goBack();
        break;
      case 'goForward':
        if (view.webContents.canGoForward()) view.webContents.goForward();
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
      case 'save-page':
        view.webContents.downloadURL(view.webContents.getURL());
        break;
    }
  });

  ipcMain.handle('tab-execute-javascript', async (event, { tabId, code }) => {
    const view = views.get(tabId);
    if (!view || view.webContents.isDestroyed()) return null;
    return await view.webContents.executeJavaScript(code);
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
}

module.exports = { initTabManager };
