const { WebContentsView, ipcMain, BrowserWindow } = require('electron');

const views = new Map(); // tabId -> WebContentsView
let isInitialized = false;

function initTabManager() {
  if (isInitialized) return;
  isInitialized = true;
  
  ipcMain.on('tab-create', (event, { tabId, url, partition }) => {
    console.log(`[TabManager] tab-create ${tabId} url:${url} partition:${partition}`);
    if (views.has(tabId)) return;

    const sender = event.sender; // The webContents of the requesting window
    
    const view = new WebContentsView({
      webPreferences: {
        partition: partition || 'persist:main',
        contextIsolation: true,
        nodeIntegration: false,
      }
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

    view.webContents.on('did-navigate', (e, navigationUrl) => forwardEvent('did-navigate', { url: navigationUrl, canGoBack: view.webContents.canGoBack(), canGoForward: view.webContents.canGoForward() }));
    view.webContents.on('did-navigate-in-page', (e, navigationUrl) => forwardEvent('did-navigate-in-page', { url: navigationUrl, canGoBack: view.webContents.canGoBack(), canGoForward: view.webContents.canGoForward() }));
    view.webContents.on('page-title-updated', (e, title) => forwardEvent('page-title-updated', { title }));
    view.webContents.on('page-favicon-updated', (e, favicons) => forwardEvent('page-favicon-updated', { favicons }));
    view.webContents.on('did-start-loading', () => forwardEvent('did-start-loading'));
    view.webContents.on('did-stop-loading', () => forwardEvent('did-stop-loading', { canGoBack: view.webContents.canGoBack(), canGoForward: view.webContents.canGoForward() }));
    view.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
      if (errorCode !== -3) forwardEvent('did-fail-load', { errorCode, errorDescription });
    });
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
      view.webContents.loadURL(url).catch(() => {});
    }
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
      view.webContents.loadURL(url).catch(() => {});
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
        view.webContents.print();
        break;
      case 'zoom-in':
        {
          const currentLevel = view.webContents.getZoomLevel();
          view.webContents.setZoomLevel(currentLevel + 0.5);
          if (!event.sender.isDestroyed()) {
            event.sender.send('tab-event', { tabId: tabId, eventName: 'zoom-changed', data: { level: currentLevel + 0.5 } });
          }
        }
        break;
      case 'zoom-out':
        {
          const currentLevel = view.webContents.getZoomLevel();
          view.webContents.setZoomLevel(currentLevel - 0.5);
          if (!event.sender.isDestroyed()) {
            event.sender.send('tab-event', { tabId: tabId, eventName: 'zoom-changed', data: { level: currentLevel - 0.5 } });
          }
        }
        break;
      case 'zoom-reset':
        view.webContents.setZoomLevel(0);
        if (!event.sender.isDestroyed()) {
          event.sender.send('tab-event', { tabId: tabId, eventName: 'zoom-changed', data: { level: 0 } });
        }
        break;
      case 'cut':
        view.webContents.cut();
        break;
      case 'copy':
        view.webContents.copy();
        break;
      case 'paste':
        view.webContents.paste();
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
