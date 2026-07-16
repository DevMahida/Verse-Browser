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
      // This forces Google to fall back to password or phone authentication.
      if (navigator.credentials) {
        navigator.credentials.get = undefined;
        navigator.credentials.create = undefined;
      }
      if (window.PublicKeyCredential) {
        window.PublicKeyCredential = undefined;
      }
    } catch (e) {
      console.error("Failed to inject tab anti-detection:", e);
    }
  `);
} catch (e) {
  console.error("Failed to run webFrame.executeJavaScript:", e);
}
