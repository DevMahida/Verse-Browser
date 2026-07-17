# Google Login Issue in Verse Browser

Currently, the Google Login feature may not work or may fail during the authentication flow. We recently transitioned from an embedded browser sign-in approach (which Google actively blocks via BotGuard) to a legitimate **OAuth 2.0 Loopback Flow** using the native system browser (Chrome/Edge/Safari).

If Google login is not working, it is almost certainly due to one of the following configuration issues:

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
