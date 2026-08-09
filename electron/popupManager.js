const { BrowserWindow } = require('electron');
const path = require('path');

/**
 * Dedicated Native Popup Manager Module for Verse Browser.
 * Handles Chrome-style floating popover windows attached directly to parent BrowserWindow.
 * Floats on top of WebContentsView with full drop-shadows and glassmorphism, with ZERO webview shifting.
 */

let activePopupWindow = null;

/**
 * Opens a native Chrome-style popover window attached to parentWin.
 *
 * @param {Object} options
 * @param {import('electron').BrowserWindow} options.parentWin - The main BrowserWindow
 * @param {string} options.url - URL to load (e.g. http://localhost:3000/popup?type=media-booster)
 * @param {number} options.width - Popup width
 * @param {number} options.height - Popup height
 * @param {number} options.x - Calculated screen X coordinate
 * @param {number} options.y - Calculated screen Y coordinate
 * @param {string} [options.partition] - The partition to use for the popup window
 */
function showPopupWindow({ parentWin, url, width = 360, height = 380, x, y, partition }) {
  closePopupWindow();

  if (!parentWin || parentWin.isDestroyed()) return;

  activePopupWindow = new BrowserWindow({
    parent: parentWin,
    width: Math.round(width),
    height: Math.round(height),
    x: Math.round(x),
    y: Math.round(y),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      ...(partition ? { partition } : {})
    }
  });

  const finalUrl = url.startsWith('file://') && !url.includes('.html') 
    ? url.replace('/popup?', '/popup.html?') 
    : url;
  activePopupWindow.loadURL(finalUrl);

  activePopupWindow.once('ready-to-show', () => {
    activePopupWindow.webContents.insertCSS('body, html { background: transparent !important; overflow: hidden !important; }');
    if (activePopupWindow && !activePopupWindow.isDestroyed()) {
      activePopupWindow.show();
    }
  });

  activePopupWindow.on('blur', () => {
    // Automatically close popover when user clicks outside
    closePopupWindow();
  });
}

/**
 * Closes any active floating popup window.
 */
function closePopupWindow() {
  if (activePopupWindow && !activePopupWindow.isDestroyed()) {
    try {
      activePopupWindow.close();
    } catch (e) { }
  }
  activePopupWindow = null;
}

/**
 * Resizes the active floating popup window.
 */
function resizePopupWindow(width, height) {
  if (activePopupWindow && !activePopupWindow.isDestroyed()) {
    const bounds = activePopupWindow.getBounds();
    activePopupWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: Math.round(width),
      height: Math.round(height)
    });
  }
}

let suggestionsPopupWindow = null;

let lastSuggestions = [];
let lastSelectedIndex = -1;

function initSuggestionsPopup(parentWin, partition, baseUrl) {
  if (suggestionsPopupWindow && !suggestionsPopupWindow.isDestroyed()) return;

  suggestionsPopupWindow = new BrowserWindow({
    parent: parentWin,
    width: 600,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      ...(partition ? { partition } : {})
    }
  });

  const finalUrl = baseUrl.startsWith('file://') ? `${baseUrl}/popup.html?type=suggestions` : `${baseUrl}/popup?type=suggestions`;
  suggestionsPopupWindow.loadURL(finalUrl);

  suggestionsPopupWindow.webContents.on('did-finish-load', () => {
    suggestionsPopupWindow.webContents.insertCSS('body, html { background: transparent !important; overflow: hidden !important; }');
    if (lastSuggestions && lastSuggestions.length > 0) {
      suggestionsPopupWindow.webContents.send('suggestions:update', { suggestions: lastSuggestions, selectedIndex: lastSelectedIndex });
    }
  });

  suggestionsPopupWindow.on('blur', () => {
    hideSuggestionsPopup();
    if (!parentWin.isDestroyed()) {
      parentWin.webContents.send('suggestions:blur');
    }
  });
}

function showSuggestionsPopup(x, y, width, height) {
  if (suggestionsPopupWindow && !suggestionsPopupWindow.isDestroyed()) {
    suggestionsPopupWindow.setBounds({
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    });
    if (!suggestionsPopupWindow.isVisible()) {
      suggestionsPopupWindow.showInactive(); // Do not steal focus from the main window's input!
    }
  }
}

function hideSuggestionsPopup() {
  if (suggestionsPopupWindow && !suggestionsPopupWindow.isDestroyed()) {
    suggestionsPopupWindow.hide();
  }
}

function resizeSuggestionsPopup(width, height) {
  if (suggestionsPopupWindow && !suggestionsPopupWindow.isDestroyed()) {
    const bounds = suggestionsPopupWindow.getBounds();
    suggestionsPopupWindow.setBounds({
      ...bounds,
      width: Math.round(width),
      height: Math.round(height)
    });
  }
}

function sendSuggestionsUpdate(suggestions, selectedIndex) {
  lastSuggestions = suggestions || [];
  lastSelectedIndex = selectedIndex ?? -1;
  if (suggestionsPopupWindow && !suggestionsPopupWindow.isDestroyed()) {
    suggestionsPopupWindow.webContents.send('suggestions:update', { suggestions: lastSuggestions, selectedIndex: lastSelectedIndex });
  }
}

module.exports = {
  showPopupWindow,
  closePopupWindow,
  resizePopupWindow,
  initSuggestionsPopup,
  showSuggestionsPopup,
  hideSuggestionsPopup,
  resizeSuggestionsPopup,
  sendSuggestionsUpdate
};
