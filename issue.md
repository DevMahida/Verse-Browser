# Google Login Issue in Verse Browser

Currently, the Google Login feature may not work or may fail during the authentication flow. We recently transitioned from an embedded browser sign-in approach (which Google actively blocks via BotGuard) to a legitimate **OAuth 2.0 Loopback Flow** using the native system browser (Chrome/Edge/Safari).

## Why did the internal Webview Sign-in break?

Previously, Verse attempted to open Google Sign-in in an internal `WebContentsView` (embedded browser). Google actively blocks embedded Chromium browsers (like Electron or CEF) using advanced fingerprinting and their anti-bot system, **BotGuard**.
When users attempted to sign in internally, they were met with a hard block: `"This browser or app may not be secure."`

Google checks multiple signals to detect this:

- Specialized HTTP headers (`Sec-CH-UA`)
- `navigator.webdriver` properties
- The lack of standard browser plugins
- Unmatched User-Agents

While you can technically try to spoof these in `tabManager.js` (e.g., using `session.webRequest.onBeforeSendHeaders` to strip `Sec-CH-UA`), it is an endless cat-and-mouse game. Google frequently updates its fingerprinting heuristics, and it will eventually rate-limit or permanently block the embedded browser based on TLS fingerprinting.

To permanently solve this, we abandoned the internal webview and adopted the **OAuth 2.0 Loopback Flow**, which defers the authentication to the user's real, verified system browser.

### Files related to the deprecated internal flow:

- **`electron/tabManager.js`**: Contained the `openGoogleAuthPopup` logic and the `onBeforeSendHeaders` interceptors to strip user-agent headers. (Code removed)
- **`electron/auth-preload.js`**: Contained javascript mocks (like `window.chrome` and `navigator.webdriver` spoofing) that were injected into the popup to try to trick Google. (Code removed)
- **`electron/google-oauth.js`**: The old OAuth handler that tried to manage tokens internally. (Deleted entirely)

---

## Troubleshooting the New Loopback Flow

If the _new_ Google login is not working, it is almost certainly due to one of the following configuration issues:

## 1. Missing or Invalid OAuth Credentials

The OAuth Loopback flow requires a dedicated "Desktop App" OAuth client ID and secret from the Google Cloud Console.

- **Why it fails**: If the credentials are missing from `.env.local`, the IPC handler will throw an error and abort the flow. If the credentials are valid but of the wrong type (e.g., "Web application" instead of "Desktop app"), Google will block the loopback redirect to `http://127.0.0.1`.
- **How to fix**: Ensure `.env.local` contains valid credentials:
  ```env
  GOOGLE_CLIENT_ID=your-desktop-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your-client-secret
  ```

## 2. "App isn't verified" Google Warning

Because the OAuth client is new, Google will show a stark warning screen saying "Google hasn't verified this app" when users try to sign in.

- **Why it fails**: Users might see this warning and immediately close the window, thinking it's broken.
- **How to fix**: You have to click **"Advanced" -> "Go to Verse (unsafe)"** to proceed until you officially verify the app with Google via the Cloud Console.

## 3. Port Conflicts

The loopback server dynamically spins up on an ephemeral port (port 0) on `127.0.0.1`.

- **Why it fails**: In extremely strict firewall environments or VPN setups, binding to a local port might be blocked.

## Related Files

The entire Google Auth flow is wired through these files:

- **`electron/googleAuth.js`**: The core logic. Contains the PKCE generation, the local `127.0.0.1` HTTP server to catch the callback, and the API calls to exchange the auth code for tokens.
- **`electron/profileManager.js`**: Handles the `ipcMain.handle('profiles:linkGoogle')` endpoint. This is where the profile data is merged and the refresh token is encrypted via `safeStorage` and saved to `profiles.json`.
- **`electron/preload.js`**: Exposes the `window.electron.linkGoogle` and `window.electron.unlinkGoogle` IPC methods to the React frontend.
- **`src/components/toolbar/ProfileMenu.js`**: The React UI component that triggers the sign-in flow and updates the local state with the newly acquired avatar and email.
- **`.env.local`**: The environment configuration file that must contain `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## Appendix: Deprecated Code Snippets (For Reference Only)

The following blocks of code were part of the old, failing internal popup strategy. They have been completely removed from the project but are preserved here for historical reference.

### 1. `electron/tabManager.js` (Removed Popup Logic)

```javascript
/**
 * Opens a clean, native popup BrowserWindow for Google sign-in.
 * 
 * Why this works: Google blocks sign-in inside Electron WebContentsViews because
 * the CDP debugger (used for Force Dark Mode) sets navigator.webdriver = true.
 * This popup is a standard BrowserWindow with NO debugger attached, using the
 * same session partition so cookies persist back to the main browser tabs.
 * 
 * After the user signs in, the popup closes and the original tab navigates
 * to the signed-in Google page.
 */
function openGoogleAuthPopup(originView, partition, authUrl = 'https://accounts.google.com/ServiceLogin') {
  const parentWin = BrowserWindow.getAllWindows()[0];
  
  const popup = new BrowserWindow({
    width: 500,
    height: 650,
    show: true,
    title: 'Sign in with Google',
    webPreferences: {
      partition: partition,
      contextIsolation: false, // Set to false specifically for the auth popup to allow synchronous shimming
      nodeIntegration: false,
      plugins: true, // CRITICAL: Populates navigator.plugins naturally to bypass BotGuard headless detection
      preload: require('path').join(__dirname, 'auth-preload.js'),
    },
  });

  popup.setMenuBarVisibility(false);

  // Navigate to Google sign-in
  popup.loadURL(authUrl);

  // Watch for successful sign-in: when the user lands on myaccount.google.com
  // or any non-signin Google page, they've completed the flow.
  popup.webContents.on('did-navigate', (e, url) => {
    if (
      url.startsWith('https://myaccount.google.com') ||
      url.startsWith('https://www.google.com') ||
      url.startsWith('https://mail.google.com') ||
      url.startsWith('https://www.youtube.com') ||
      (url.startsWith('https://accounts.google.com') &&
        !url.includes('/ServiceLogin') &&
        !url.includes('/signin') &&
        !url.includes('/AccountChooser') &&
        !url.includes('/AddSession'))
    ) {
      // Sign-in is complete! Navigate the original tab and close the popup.
      if (originView && !originView.webContents.isDestroyed()) {
        originView.webContents.loadURL(url);
      }
      popup.close();
    }
  });
}

// Inside initTabManager(): Network-level interceptors to scrub "Electron" from headers
viewSession.webRequest.onBeforeSendHeaders((details, callback) => {
  callback({ requestHeaders: details.requestHeaders });
});
```

### 2. `electron/auth-preload.js` (Removed Headless Mocks)

This preload script was historically injected into the popup to mock Chrome internals and bypass BotGuard checks.

```javascript
try {
  // 1. Mock window.chrome
  if (!window.chrome) {
    window.chrome = {
      runtime: {},
      csi: function() {},
      loadTimes: function() {}
    };
  }

  // 2. Mock navigator.userAgentData to perfectly match Google Chrome
  const chromeVersion = process.versions.chrome ? process.versions.chrome.split('.')[0] : '120';
  
  // We redefine userAgentData to contain the Google Chrome brand list.
  // Google's BotGuard checks this list to verify that the user agent is not a modified/headless browser.
  Object.defineProperty(navigator, 'userAgentData', {
    value: {
      brands: [
        { brand: 'Not A(Brand', version: '99' },
        { brand: 'Chromium', version: chromeVersion },
        { brand: 'Google Chrome', version: chromeVersion }
      ],
      mobile: false,
      platform: 'Windows',
      getHighEntropyValues: (hints) => Promise.resolve({
        platform: 'Windows',
        platformVersion: '10.0.0',
        architecture: 'x86',
        model: '',
        uaFullVersion: process.versions.chrome || '120.0.0.0'
      })
    },
    configurable: true,
    enumerable: true,
    writable: false
  });
} catch (e) {
  console.error("Auth preload error:", e);
}
```

### 3. `electron/google-oauth.js` (Deleted File)

This file contained the old OAuth 2.0 loopback server that attempted to do token exchange internally.

```javascript
const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const { shell, net } = require('electron');

/**
 * Handles the Google OAuth 2.0 loopback flow for desktop applications.
 * Opens sign-in in the user's REAL system browser (Chrome, Edge, etc.),
 * captures the redirect on a local server, and exchanges the code for tokens.
 * 
 * This is the ONLY approach that works because Google blocks ALL Electron
 * BrowserWindows (including "clean" ones) via TLS fingerprinting.
 * 
 * @param {string} clientId - The OAuth Client ID (Desktop app type)
 * @param {string} clientSecret - The OAuth Client Secret
 * @param {Array<string>} scopes - The scopes to request
 * @returns {Promise<Object>} - Resolves with { tokens, userInfo }
 */
function authenticateWithGoogle(clientId, clientSecret, scopes) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    // Timeout: if the user doesn't sign in within 5 minutes, clean up
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Sign-in timed out. Please try again.'));
    }, 5 * 60 * 1000);

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const redirectUri = \`http://127.0.0.1:\${port}\`;

      const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
      });

      // Open in the user's REAL system browser — NOT in Electron
      shell.openExternal(authorizeUrl);

      server.on('request', async (req, res) => {
        try {
          const parsedUrl = url.parse(req.url, true);
          const { code, error } = parsedUrl.query;

          // Ignore favicon and other non-callback requests
          if (!code && !error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('');
            return;
          }

          if (error) {
            clearTimeout(timeout);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getErrorPage(error));
            server.close();
            return reject(new Error(\`Google OAuth error: \${error}\`));
          }

          if (code) {
            // Exchange the authorization code for tokens
            const { tokens } = await oAuth2Client.getToken(code);

            // Fetch user profile info using the access token
            let userInfo = null;
            try {
              userInfo = await fetchUserInfo(tokens.access_token);
            } catch (e) {
              console.error('Failed to fetch user info:', e.message);
            }

            clearTimeout(timeout);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getSuccessPage(userInfo?.name));
            server.close();
            resolve({ tokens, userInfo });
          }
        } catch (e) {
          clearTimeout(timeout);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(getErrorPage(e.message));
          server.close();
          reject(e);
        }
      });
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Fetches user profile info from Google's userinfo endpoint.
 */
async function fetchUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: \`Bearer \${accessToken}\` },
  });

  if (!response.ok) {
    throw new Error(\`Failed to fetch user info: \${response.status}\`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    picture: data.picture,
  };
}

function getSuccessPage(name) {
  const greeting = name ? \`Welcome, \${name}!\` : 'Authentication successful!';
  return \`<!DOCTYPE html>
<html>
<head><title>Sign-in Complete</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;">
  <div style="text-align:center;padding:40px;background:#16213e;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
    <div style="font-size:48px;margin-bottom:16px;">✅</div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#fff;">\${greeting}</h1>
    <p style="margin:0;color:#a0a0b0;">You can close this tab and return to Verse Browser.</p>
  </div>
</body>
</html>\`;
}

function getErrorPage(errorMsg) {
  return \`<!DOCTYPE html>
<html>
<head><title>Sign-in Error</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;">
  <div style="text-align:center;padding:40px;background:#16213e;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
    <div style="font-size:48px;margin-bottom:16px;">❌</div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#fff;">Sign-in failed</h1>
    <p style="margin:0;color:#a0a0b0;">\${errorMsg}</p>
  </div>
</body>
</html>\`;
}

module.exports = {
  authenticateWithGoogle,
};
```
