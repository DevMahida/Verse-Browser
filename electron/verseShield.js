const { app, ipcMain, BrowserWindow, webContents } = require('electron');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const { NetworkFilter } = require('@ghostery/adblocker');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');

const engineCacheFile = () => path.join(app.getPath('userData'), 'shield-engine.bin');
const settingsFile = () => path.join(app.getPath('userData'), 'shield-settings.json');
let blockerInstance = null;
let blockerEventsAttached = false;
const activeSessions = new Set();
const blockedCounts = new Map(); // Verse tab ID -> { ads, trackers, fingerprints }

function emptyCounts() { return { ads: 0, trackers: 0, fingerprints: 0, httpUpgrades: 0 }; }
function loadSettings() {
  try { return { globalEnabled: true, siteOverrides: {}, siteSettings: {}, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; }
  catch { return { globalEnabled: true, siteOverrides: {}, siteSettings: {} }; }
}
function saveSettings(data) { fs.writeFileSync(settingsFile(), JSON.stringify(data, null, 2)); }
function getSiteSetting(hostname, key, defaultValue) {
  const { siteSettings } = loadSettings();
  if (siteSettings && siteSettings[hostname] && siteSettings[hostname][key] !== undefined) {
    return siteSettings[hostname][key];
  }
  return defaultValue;
}
function setSiteSetting(hostname, key, value) {
  const settings = loadSettings();
  if (!settings.siteSettings) settings.siteSettings = {};
  if (!settings.siteSettings[hostname]) settings.siteSettings[hostname] = {};
  settings.siteSettings[hostname][key] = value;
  saveSettings(settings);
}
function isEnabledForHost(hostname) {
  const { globalEnabled, siteOverrides } = loadSettings();
  return Object.prototype.hasOwnProperty.call(siteOverrides, hostname) ? siteOverrides[hostname] : globalEnabled;
}
function setEnabledForHost(hostname, enabled) {
  const settings = loadSettings();
  settings.siteOverrides[hostname] = enabled;
  saveSettings(settings);
}
function exceptionRules() {
  return Object.entries(loadSettings().siteOverrides)
    .filter(([, enabled]) => !enabled)
    .map(([hostname]) => `@@||${hostname}^`)
    .join('\n');
}
async function buildEngine() {
  // The prebuilt engine includes EasyList and EasyPrivacy. Cache avoids downloading lists at every launch.
  const engine = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  const exceptions = exceptionRules();
  if (exceptions) {
    const filters = exceptions.split('\n').map(rule => NetworkFilter.parse(rule)).filter(Boolean);
    engine.update({ newNetworkFilters: filters });
  }
  return engine;
}
async function getBlocker() {
  if (!blockerInstance) blockerInstance = await buildEngine();
  return blockerInstance;
}
function classify(url) {
  if (/fingerprint|canvas|webrtc|audio.?context|client.?hints/i.test(url)) return 'fingerprints';
  if (/analytics|metrics|telemetry|pixel|beacon|tracker|doubleclick|googletagmanager|facebook\.net/i.test(url)) return 'trackers';
  return 'ads';
}
function publish(tabId, counts) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('adblocker-stat-update', { tabId, tab: counts });
  }
}
function attachBlockEvents(blocker) {
  if (blockerEventsAttached) return;
  blockerEventsAttached = true;
  blocker.on('request-blocked', (request) => {
    const wc = webContents.fromId(request.tabId);
    const tabId = wc?._verseTabId;
    if (!tabId) return;
    const current = blockedCounts.get(tabId) || emptyCounts();
    const kind = classify(request.url || '');
    const next = { ...current, [kind]: current[kind] + 1 };
    blockedCounts.set(tabId, next);
    publish(tabId, next);
  });
}
async function enableShieldsOnSession(targetSession) {
  if (!targetSession || activeSessions.has(targetSession)) return;
  activeSessions.add(targetSession);
  try {
    const blocker = await getBlocker();
    attachBlockEvents(blocker);
    blocker.enableBlockingInSession(targetSession);

    // Disable Ghostery's cosmetic filter preload script
    // This script uses `fun-hooks` to wrap native DOM APIs (querySelector, etc), 
    // which causes "Maximum call stack size exceeded" infinite loops on modern React apps (like ChatGPT).
    const preloads = targetSession.getPreloads();
    targetSession.setPreloads(preloads.filter(p => !p.includes('adblocker-electron') && !p.includes('ghostery')));

    attachAdvancedSessionFilters(targetSession);
  } catch (err) {
    if (err.message && err.message.includes('Attempted to register a second handler')) {
      // IPC handler for cosmetic filters was already registered globally
    } else {
      console.error('Failed to enable shields on session:', err);
    }
  }
}

function attachAdvancedSessionFilters(targetSession) {
  let cachedSettings = loadSettings();
  let lastLoadTime = Date.now();
  
  const getFastSettings = () => {
    if (Date.now() - lastLoadTime > 2000) { // Reload every 2s max
      cachedSettings = loadSettings();
      lastLoadTime = Date.now();
    }
    return cachedSettings;
  };
  
  const fastGetSetting = (hostname, key, defaultValue) => {
    const s = getFastSettings();
    if (s.siteSettings && s.siteSettings[hostname] && s.siteSettings[hostname][key] !== undefined) {
      return s.siteSettings[hostname][key];
    }
    return defaultValue;
  };
  
  const fastIsEnabled = (hostname) => {
    const s = getFastSettings();
    return Object.prototype.hasOwnProperty.call(s.siteOverrides || {}, hostname) ? s.siteOverrides[hostname] : (s.globalEnabled ?? true);
  };

  targetSession.webRequest.onBeforeRequest({ urls: ['http://*/*'] }, (details, callback) => {
    try {
      const url = new URL(details.url);
      const host = url.hostname;
      
      // Skip local network, localhost, IPs
      if (/^(localhost|127\.\d+\.\d+\.\d+|::1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(host)) {
        return callback({ cancel: false });
      }

      const httpsUpgrade = fastGetSetting(host, 'httpsUpgrade', true);
      const isShieldEnabled = fastIsEnabled(host);
      
      if (isShieldEnabled && httpsUpgrade) {
        url.protocol = 'https:';
        
        // Update counts if we can find the tab
        if (details.webContentsId) {
          const wc = webContents.fromId(details.webContentsId);
          if (wc && wc._verseTabId) {
            const current = blockedCounts.get(wc._verseTabId) || emptyCounts();
            const next = { ...current, httpUpgrades: (current.httpUpgrades || 0) + 1 };
            blockedCounts.set(wc._verseTabId, next);
            publish(wc._verseTabId, next);
          }
        }
        
        return callback({ redirectURL: url.toString() });
      }
    } catch(e) {}
    callback({ cancel: false });
  });

  targetSession.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, callback) => {
    let modified = false;
    let requestHeaders = details.requestHeaders;
    try {
      const url = new URL(details.url);
      const host = url.hostname;
      if (fastIsEnabled(host)) {
        const cookieLevel = fastGetSetting(host, 'cookieLevel', 'cross-site');
        if (cookieLevel === 'all') {
          if (requestHeaders['Cookie'] || requestHeaders['cookie']) {
            requestHeaders = { ...details.requestHeaders };
            delete requestHeaders['Cookie'];
            delete requestHeaders['cookie'];
            modified = true;
          }
        }
      }
    } catch(e) {}
    if (modified) {
      callback({ requestHeaders: requestHeaders });
    } else {
      callback({ cancel: false });
    }
  });

  targetSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    let modified = false;
    let responseHeaders = details.responseHeaders;
    try {
      const url = new URL(details.url);
      const host = url.hostname;
      if (fastIsEnabled(host)) {
        const cookieLevel = fastGetSetting(host, 'cookieLevel', 'cross-site');
        if (cookieLevel === 'all') {
          if (responseHeaders['Set-Cookie'] || responseHeaders['set-cookie']) {
            responseHeaders = { ...details.responseHeaders };
            delete responseHeaders['Set-Cookie'];
            delete responseHeaders['set-cookie'];
            modified = true;
          }
        }
      }
    } catch(e) {}
    if (modified) {
      callback({ responseHeaders: responseHeaders });
    } else {
      callback({ cancel: false });
    }
  });
}

async function rebuildAndReapply() {
  const old = blockerInstance;
  blockerInstance = await buildEngine();
  blockerEventsAttached = false;
  attachBlockEvents(blockerInstance);
  for (const ses of activeSessions) {
    try {
      old?.disableBlockingInSession(ses);
      blockerInstance.enableBlockingInSession(ses);
    } catch (err) {
      if (!err.message?.includes('Attempted to register a second handler')) {
        console.error('Failed to re-apply shields to session:', err);
      }
    }
  }
}

function attachNavigationShields(tabWebContents, tabId) {
  tabWebContents._verseTabId = tabId;
  tabWebContents.on('did-start-navigation', (_event, _url, _inPlace, isMainFrame) => {
    if (isMainFrame) blockedCounts.set(tabId, emptyCounts());
  });

  tabWebContents.on('dom-ready', () => {
    try {
      const urlStr = tabWebContents.getURL();
      if (!urlStr || urlStr.startsWith('browser://') || urlStr.startsWith('chrome://')) return;
      const host = new URL(urlStr).hostname;
      if (!isEnabledForHost(host)) return;
      
      const fpLevel = getSiteSetting(host, 'fingerprintLevel', 'standard');
      if (fpLevel === 'aggressive') {
        const spoofCode = `(() => {
          try {
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, contextAttributes) {
              const context = originalGetContext.apply(this, arguments);
              if (type === '2d' && context) {
                const originalGetImageData = context.getImageData;
                context.getImageData = function() {
                  const imageData = originalGetImageData.apply(this, arguments);
                  if (imageData && imageData.data) {
                    for (let i = 0; i < imageData.data.length; i += 4) {
                      imageData.data[i] = imageData.data[i] ^ 1; // flip LSB of red channel to poison hash
                    }
                  }
                  return imageData;
                };
              }
              return context;
            };
            
            const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
              if (parameter === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
              if (parameter === 37446) return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER_WEBGL
              return originalGetParameter.apply(this, arguments);
            };
            
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
            Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
          } catch(e) {}
        })();`;
        tabWebContents.executeJavaScript(spoofCode).catch(() => {});
      }
    } catch(e) {}
  });
}

function attachCosmeticFilters(tabWebContents) {
  tabWebContents.on('dom-ready', () => {
    const host = (() => { try { return new URL(tabWebContents.getURL()).hostname; } catch { return ''; } })();
    if (!host.includes('youtube.com') || !isEnabledForHost(host)) return;
    const code = `(() => {
      if (window.__verseYouTubeShield) return;
      window.__verseYouTubeShield = true;

      const dismissAndUnblock = () => {
        let didRemoveModal = false;
        try {
          // 1. Remove YouTube's Anti-Adblock Enforcement modals and overlays
          document.querySelectorAll('ytd-enforcement-message-view-model, .ytp-error-screen').forEach(node => {
            try { node.remove(); didRemoveModal = true; } catch (e) {}
          });

          document.querySelectorAll('tp-yt-paper-dialog, #error-screen').forEach(node => {
            try {
              if (node.querySelector && node.querySelector('ytd-enforcement-message-view-model')) {
                node.remove();
                didRemoveModal = true;
              }
            } catch (e) {}
          });

          // Only restore body scrolling if we actually removed a modal
          if (didRemoveModal && document.body && document.body.style.overflow === 'hidden') {
            document.body.style.overflow = '';
          }

          const player = document.querySelector('#movie_player');
          const video = player ? player.querySelector('video') : document.querySelector('video');

          // 2. Skip and fast-forward video ads if loaded
          if (player && player.classList.contains('ad-showing')) {
            document.querySelectorAll('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-container').forEach(b => b.click());
            document.querySelectorAll('.ytp-ad-overlay-close-button, .ytp-ad-overlay-slot button[aria-label*="Close"]').forEach(b => b.click());
            if (video) {
              video.muted = true;
              video.playbackRate = 16.0;
              if (Number.isFinite(video.duration) && video.duration > 0) {
                video.currentTime = Math.max(0, video.duration - 0.05);
              }
            }
          }

          // 3. Auto-resume ONLY if we just dismissed an enforcement modal
          //    This prevents overriding the user's manual pause
          if (didRemoveModal && video && video.paused && !player?.classList.contains('ad-showing')) {
            video.play().catch(() => {});
          }
        } catch (err) {}
      };

      // Debounce observer callbacks to avoid firing thousands of times
      let _debounceTimer = null;
      const debouncedDismiss = () => {
        if (_debounceTimer) return;
        _debounceTimer = setTimeout(() => {
          _debounceTimer = null;
          dismissAndUnblock();
        }, 300);
      };

      // Run once on load
      dismissAndUnblock();

      // Scope observer narrowly — only watch for new child nodes being added
      // to the main content area, not every class/style change on the whole page
      const observeTarget = document.querySelector('ytd-app') || document.querySelector('#content') || document.body;
      if (observeTarget) {
        const observer = new MutationObserver(debouncedDismiss);
        observer.observe(observeTarget, {
          childList: true,
          subtree: true
        });
      }

      // Fallback interval — very infrequent, just a safety net
      setInterval(dismissAndUnblock, 2000);
    })();`;
    tabWebContents.executeJavaScript(code).catch(() => {});
  });
}
function registerShieldHandlers() {
  ipcMain.handle('shield:getStatus', (_event, { hostname, tabId } = {}) => {
    const defaultSettings = {
      trackingLevel: 'standard',
      fingerprintLevel: 'standard',
      cookieLevel: 'cross-site',
      httpsUpgrade: true
    };
    const siteSettings = hostname ? (loadSettings().siteSettings?.[hostname] || {}) : {};
    
    return {
      hostname: hostname || null,
      enabled: hostname ? isEnabledForHost(hostname) : true,
      counts: blockedCounts.get(tabId) || emptyCounts(),
      settings: { ...defaultSettings, ...siteSettings }
    };
  });
  ipcMain.handle('shield:setForSite', async (_event, hostname, enabled) => {
    setEnabledForHost(hostname, enabled);
    await rebuildAndReapply();
    return { success: true };
  });
  ipcMain.handle('shield:setSetting', async (_event, hostname, key, value) => {
    setSiteSetting(hostname, key, value);
    return { success: true };
  });
}
module.exports = { enableShieldsOnSession, attachNavigationShields, attachCosmeticFilters, registerShieldHandlers };
