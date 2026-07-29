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

function emptyCounts() { return { ads: 0, trackers: 0, fingerprints: 0 }; }
function loadSettings() {
  try { return { globalEnabled: true, siteOverrides: {}, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; }
  catch { return { globalEnabled: true, siteOverrides: {} }; }
}
function saveSettings(data) { fs.writeFileSync(settingsFile(), JSON.stringify(data, null, 2)); }
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
  } catch (err) {
    if (err.message && err.message.includes('Attempted to register a second handler')) {
      // IPC handler for cosmetic filters was already registered globally
    } else {
      console.error('Failed to enable shields on session:', err);
    }
  }
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
}

function attachCosmeticFilters(tabWebContents) {
  tabWebContents.on('dom-ready', () => {
    const host = (() => { try { return new URL(tabWebContents.getURL()).hostname; } catch { return ''; } })();
    if (!host.includes('youtube.com') || !isEnabledForHost(host)) return;
    const code = `(() => {
      if (window.__verseYouTubeShield) return;
      window.__verseYouTubeShield = true;

      const dismissAndUnblock = () => {
        try {
          // 1. Remove YouTube's Anti-Adblock Enforcement modals and overlays safely
          document.querySelectorAll('ytd-enforcement-message-view-model, .ytp-error-screen').forEach(node => {
            try { node.remove(); } catch (e) {}
          });

          document.querySelectorAll('tp-yt-paper-dialog, #error-screen').forEach(node => {
            try {
              if (node.querySelector && node.querySelector('ytd-enforcement-message-view-model')) {
                node.remove();
              }
            } catch (e) {}
          });

          // Restore body scrolling if enforcement popup locked it
          if (document.body && document.body.style.overflow === 'hidden') {
            document.body.style.overflow = 'auto';
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

          // 3. Auto-resume video if YouTube paused it due to anti-adblock detection
          if (video && video.paused && !player?.classList.contains('ad-showing')) {
            const playBtn = document.querySelector('.ytp-play-button');
            if (playBtn && playBtn.getAttribute('aria-label')?.includes('Play')) {
              video.play().catch(() => {});
            }
          }
        } catch (err) {}
      };

      dismissAndUnblock();
      const observer = new MutationObserver(dismissAndUnblock);
      if (document.documentElement || document.body) {
        observer.observe(document.documentElement || document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'open']
        });
      }
      setInterval(dismissAndUnblock, 150);
    })();`;
    tabWebContents.executeJavaScript(code).catch(() => {});
  });
}
function registerShieldHandlers() {
  ipcMain.handle('shield:getStatus', (_event, { hostname, tabId } = {}) => ({
    hostname: hostname || null,
    enabled: hostname ? isEnabledForHost(hostname) : true,
    counts: blockedCounts.get(tabId) || emptyCounts(),
  }));
  ipcMain.handle('shield:setForSite', async (_event, hostname, enabled) => {
    setEnabledForHost(hostname, enabled);
    await rebuildAndReapply();
    return { success: true };
  });
}
module.exports = { enableShieldsOnSession, attachNavigationShields, attachCosmeticFilters, registerShieldHandlers };
