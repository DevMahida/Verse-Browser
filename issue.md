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

If the *new* Google login is not working, it is almost certainly due to one of the following configuration issues:

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
