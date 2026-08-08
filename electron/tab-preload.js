const { webFrame, ipcRenderer } = require('electron');

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

      // 5. Force allowfullscreen on all iframes to fix video player fullscreen issues
      const forceAllowFullScreen = (iframe) => {
        if (iframe && iframe.tagName === 'IFRAME') {
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('webkitallowfullscreen', 'true');
          iframe.setAttribute('mozallowfullscreen', 'true');
        }
      };
      
      // Handle DOM-dependent setup (iframes and custom intercepts)
      const setupDOMListeners = () => {
        // Handle existing iframes
        document.querySelectorAll('iframe').forEach(forceAllowFullScreen);
        
        // Handle dynamically added iframes
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.tagName === 'IFRAME') {
                forceAllowFullScreen(node);
              } else if (node.querySelectorAll) {
                node.querySelectorAll('iframe').forEach(forceAllowFullScreen);
              }
            }
          }
        });
        if (document.documentElement) {
          observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        // 6. Physics Wallah / pw.live Custom Fix
        // The back button on the video player calls window.close(). Because it's opened in the same tab,
        // Chromium blocks window.close(). We override it to call history.back() instead!
        if (location.hostname.includes('pw.live')) {
          const originalClose = window.close;
          window.close = function() {
            if (location.pathname.includes('/watch/')) {
              console.log("[Verse Browser] pw.live called window.close(), intercepting and going back instead!");
              window.history.back();
            } else {
              originalClose.apply(window, arguments);
            }
          };

          // Listen for our custom message from cross-origin iframes
          window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'verse-go-back' && location.pathname.includes('/watch/')) {
              console.log("[Verse Browser] Received verse-go-back message, going back!");
              window.history.back();
            }
          });
        }

        // Global coordinate fallback for ALL frames (including cross-origin video player iframes like vdocipher)
        // If they click in the top-left 60x60 pixels, we send a postMessage to the top window.
        // The top window (if it's pw.live/watch) will intercept it and go back.
        document.addEventListener('click', (e) => {
          if (e.clientX < 60 && e.clientY < 60) {
            try {
              if (window.top.location.pathname.includes('/watch/')) {
                window.top.history.back();
                return;
              }
            } catch(err) {
              // Cross-origin iframe, send postMessage
              window.top.postMessage({ type: 'verse-go-back' }, '*');
            }
          }
        }, true);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDOMListeners);
      } else {
        setupDOMListeners();
      }

      // Intercept clicks on video links (pw.live/watch/) to force them into a new tab!
      // This bypasses React Router's pushState, giving the user the new-tab experience they requested.
      document.addEventListener('click', (e) => {
        // Find the closest anchor tag
        const a = e.target.closest('a');
        if (a && a.href && a.href.includes('pw.live') && a.href.includes('/watch/')) {
          console.log("[Verse Browser] Intercepted click on PW video link, forcing to new tab!");
          e.preventDefault();
          e.stopPropagation();
          window.open(a.href, '_blank');
        }
      }, true); // Use capture phase to intercept before React does

    } catch (e) {
      console.error("Failed to inject tab anti-detection:", e);
    }
  `).catch(() => {});
} catch (e) {
  console.error("Failed to run webFrame.executeJavaScript:", e);
}

// --- Vault (Password Manager) Content Script ---
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const domain = window.location.origin;
    
    // 1. Attempt Auto-fill
    const credentials = await ipcRenderer.invoke('vault:getCredentials', domain);
    if (credentials && credentials.length > 0) {
      // Pick the first credential for now
      const credential = credentials[0];
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      passwordInputs.forEach(pwInput => {
        const form = pwInput.closest('form');
        if (form) {
          // Find likely username field
          const userInputs = form.querySelectorAll('input[type="text"], input[type="email"]');
          if (userInputs.length > 0) {
            userInputs[0].value = credential.username;
          }
          pwInput.value = credential.password;
        }
      });
    }

    // 2. Detect Form Submissions to Save
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const pwInput = form.querySelector('input[type="password"]');
      if (pwInput && pwInput.value) {
        const userInputs = form.querySelectorAll('input[type="text"], input[type="email"]');
        const username = userInputs.length > 0 ? userInputs[0].value : 'unknown';
        const password = pwInput.value;
        
        // Trigger save prompt instead of silently saving
        ipcRenderer.invoke('vault:promptSave', { domain, username, password });
      }
    }, true);
  } catch (err) {
    console.error("Vault script error:", err);
  }
});
