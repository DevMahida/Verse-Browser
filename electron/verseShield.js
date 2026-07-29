const { app, session, ipcMain, webContents: webContentsAPI } = require('electron');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');

const engineCacheFile = () => path.join(app.getPath('userData'), 'shield-engine.bin');
const engineMetaFile = () => path.join(app.getPath('userData'), 'shield-engine-meta.json');
const settingsFile = () => path.join(app.getPath('userData'), 'shield-settings.json');

// Same lists fromPrebuiltAdsAndTracking used under the hood — fetched
// directly here so per-site exceptions can be appended before parsing.
const FILTER_LIST_URLS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
];

let blockerInstance = null;
const activeSessions = new Set(); // sessions currently running shields — for reapplying after a rebuild
const blockedCounts = new Map(); // webContents.id -> count, reset per main-frame navigation

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'msclkid', 'mc_eid', 'igshid', 'twclid', 'yclid',
];

// ---------- Engine ----------
//
// Per-site allowlisting uses EasyList's own exception-rule syntax
// (`@@||hostname^$document`) — the same mechanism uBlock Origin and Brave
// use internally for "allowlist this site". Building this in means the
// engine itself already knows to never block sonyliv.com, rather than
// trying to intercept/override its decisions after the fact.
//
// Cached to disk, but the cache is invalidated whenever the override list
// changes (tracked via engineMetaFile), so toggling a site rebuilds once,
// not on every launch.

async function fetchListText(url) {
  const res = await fetch(url);
  return res.text();
}

function exceptionFiltersFor(siteOverrides) {
  return Object.entries(siteOverrides)
    .filter(([, enabled]) => enabled === false)
    .map(([hostname]) => `@@||${hostname}^$document`)
    .join('\n');
}

async function buildEngine() {
  const { siteOverrides } = loadSettings();
  const overridesKey = JSON.stringify(siteOverrides);

  try {
    const meta = JSON.parse(fs.readFileSync(engineMetaFile(), 'utf-8'));
    if (meta.overridesKey === overridesKey) {
      return ElectronBlocker.deserialize(fs.readFileSync(engineCacheFile()));
    }
  } catch {
    // no cache yet, or the override list changed since it was built — rebuild below
  }

  // Optimize base engine building by utilizing fromPrebuiltAdsAndTracking
  // which internally handles smart fetching and caching of its own engine!
  // Then we append our overrides.
  const engine = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  
  // Dynamically inject our user's exception overrides without fetching EasyList again!
  const exceptionFilters = exceptionFiltersFor(siteOverrides);
  if (exceptionFilters) {
    // We update the prebuilt engine with our exceptions!
    engine.update(undefined, undefined, exceptionFilters);
  }

  fs.writeFileSync(engineCacheFile(), engine.serialize());
  fs.writeFileSync(engineMetaFile(), JSON.stringify({ overridesKey }));
  return engine;
}

async function getBlocker() {
  if (blockerInstance) return blockerInstance;
  blockerInstance = await buildEngine();
  return blockerInstance;
}

// Call after setEnabledForHost() to make a toggle actually take effect —
// rebuilds the engine and reapplies it to every session shields are
// running on. Returns true so the caller knows to reload open tabs.
async function rebuildAndReapply() {
  const oldBlocker = blockerInstance;
  blockerInstance = await buildEngine();
  for (const ses of activeSessions) {
    if (oldBlocker) {
      oldBlocker.disableBlockingInSession(ses);
    }
    blockerInstance.enableBlockingInSession(ses);
  }
  return true;
}

// ---------- Settings ----------

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf-8'));
  } catch {
    return { globalEnabled: true, siteOverrides: {} }; // siteOverrides: { 'example.com': false }
  }
}

function saveSettings(data) {
  fs.writeFileSync(settingsFile(), JSON.stringify(data, null, 2));
}

function isEnabledForHost(hostname) {
  const { globalEnabled, siteOverrides } = loadSettings();
  return hostname in siteOverrides ? siteOverrides[hostname] : globalEnabled;
}

function setEnabledForHost(hostname, enabled) {
  const data = loadSettings();
  data.siteOverrides[hostname] = enabled;
  saveSettings(data);
  // NOTE: this persists the preference, but enableShieldsOnSession() below
  // blocks at the whole-SESSION level, not per-site — see the callout
  // after this file about what it takes to actually enforce this toggle.
}

function setGlobalEnabled(enabled) {
  const data = loadSettings();
  data.globalEnabled = enabled;
  saveSettings(data);
}

// ---------- Wiring ad/tracker blocking into a session (call once per profile session) ----------

async function enableShieldsOnSession(targetSession = session.defaultSession) {
  const blocker = await getBlocker();
  blocker.enableBlockingInSession(targetSession);
  activeSessions.add(targetSession);

  // Badge counting. Use request.tabId which reliably maps to the webContents.id
  blocker.on('request-blocked', (request) => {
    const tabId = request.tabId;
    if (tabId) {
      const current = blockedCounts.get(tabId) || 0;
      blockedCounts.set(tabId, current + 1);

      // Broadcast update to all browser windows so the UI can dynamically update the badge
      for (const win of require('electron').BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed() && win.webContents) {
          win.webContents.send('adblocker-stat-update', { 
            tabId, 
            tab: { ads: current + 1 } 
          });
        }
      }
    }
  });
}

// ---------- HTTPS upgrade + tracking-param stripping (call once per tab's webContents) ----------

function cleanTrackingParams(urlString) {
  const url = new URL(urlString);
  let changed = false;
  for (const param of TRACKING_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }
  return changed ? url.toString() : null;
}

function attachNavigationShields(tabWebContents) {
  tabWebContents.on('will-navigate', (event, url) => {
    let hostname;
    try { hostname = new URL(url).hostname; } catch { return; }
    if (!isEnabledForHost(hostname)) return;

    if (url.startsWith('http://')) {
      // Simplified: no fallback-on-failure yet if the site doesn't
      // actually support HTTPS. Real Brave Standard mode silently falls
      // back; that needs a did-fail-load listener paired with a retry —
      // worth adding once this base version is confirmed working.
      event.preventDefault();
      tabWebContents.loadURL(url.replace('http://', 'https://'));
      return;
    }

    const cleaned = cleanTrackingParams(url);
    if (cleaned) {
      event.preventDefault();
      tabWebContents.loadURL(cleaned);
    }
  });

  tabWebContents.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
    if (isMainFrame) blockedCounts.set(tabWebContents.id, 0);
  });
}

function getBlockedCount(tabWebContents) {
  return blockedCounts.get(tabWebContents.id) || 0;
}

// ---------- IPC ----------

function registerShieldHandlers() {
  ipcMain.handle('shield:getStatus', (event) => {
    const wc = event.sender;
    let hostname = null;
    try { hostname = new URL(wc.getURL()).hostname; } catch {}
    return {
      hostname,
      enabled: hostname ? isEnabledForHost(hostname) : true,
      blockedCount: getBlockedCount(wc),
    };
  });

  ipcMain.handle('shield:setForSite', async (event, hostname, enabled) => {
    setEnabledForHost(hostname, enabled);
    await rebuildAndReapply();
    event.sender.reload(); // matches Brave's own behavior — a toggle applies on reload, not mid-page
  });

  ipcMain.handle('shield:setGlobal', (_e, enabled) => setGlobalEnabled(enabled));
}

module.exports = {
  enableShieldsOnSession,
  attachNavigationShields,
  getBlockedCount,
  registerShieldHandlers,
  isEnabledForHost,
  rebuildAndReapply,
};
