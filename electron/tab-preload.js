const { webFrame } = require('electron');

try {
  // Execute anti-detection scripts directly in the main world.
  // Because contextIsolation is true, modifying window/navigator in the preload
  // context won't affect the actual webpage. We use webFrame to bypass this.
  webFrame.executeJavaScript(`
    try {
      // 1. Spoof Chrome objects
      if (!window.chrome) {
        window.chrome = { runtime: {}, csi: function(){}, loadTimes: function(){} };
      }
      
      if (navigator.plugins.length === 0) {
        Object.defineProperty(navigator, 'plugins', {
          get: () => [{ name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' }]
        });
      }
      
      // 2. Hide webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      // 3. Disable WebAuthn to prevent Windows Defender Passkey popup during Google Login
      if (navigator.credentials) {
        navigator.credentials.get = undefined;
        navigator.credentials.create = undefined;
      }
      if (window.PublicKeyCredential) {
        window.PublicKeyCredential = undefined;
      }

      // 4. YouTube Anti-Adblock Defusal & Player Protection
      if (location.hostname.includes('youtube.com')) {
        try {
          if (window.yt && window.yt.config_) {
            const flags = window.yt.config_.EXPERIMENT_FLAGS || {};
            flags.ad_blocker_tasks_method = false;
            flags.enable_ad_block_tech_detection = false;
            flags.web_disable_adblock_warning = true;
            flags.ad_privacy_banner_yt_config = false;
            window.yt.config_.EXPERIMENT_FLAGS = flags;
          }

          let _resp = window.ytInitialPlayerResponse;
          Object.defineProperty(window, 'ytInitialPlayerResponse', {
            get: () => _resp,
            set: (val) => {
              if (val) {
                if (val.adPlacements) val.adPlacements = [];
                if (val.playerAds) val.playerAds = [];
                if (val.adSlots) val.adSlots = [];
              }
              _resp = val;
            },
            configurable: true
          });
        } catch (ytErr) {
          console.error("YouTube preload defuse error:", ytErr);
        }
      }
    } catch (e) {
      console.error("Failed to inject tab anti-detection:", e);
    }
  `).catch(() => {});
} catch (e) {
  console.error("Failed to run webFrame.executeJavaScript:", e);
}
