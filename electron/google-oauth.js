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
      const redirectUri = `http://127.0.0.1:${port}`;

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
            return reject(new Error(`Google OAuth error: ${error}`));
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
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
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
  const greeting = name ? `Welcome, ${name}!` : 'Authentication successful!';
  return `<!DOCTYPE html>
<html>
<head><title>Sign-in Complete</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;">
  <div style="text-align:center;padding:40px;background:#16213e;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
    <div style="font-size:48px;margin-bottom:16px;">✅</div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#fff;">${greeting}</h1>
    <p style="margin:0;color:#a0a0b0;">You can close this tab and return to Verse Browser.</p>
  </div>
</body>
</html>`;
}

function getErrorPage(errorMsg) {
  return `<!DOCTYPE html>
<html>
<head><title>Sign-in Error</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;">
  <div style="text-align:center;padding:40px;background:#16213e;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
    <div style="font-size:48px;margin-bottom:16px;">❌</div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#fff;">Sign-in failed</h1>
    <p style="margin:0;color:#a0a0b0;">${errorMsg}</p>
  </div>
</body>
</html>`;
}

module.exports = {
  authenticateWithGoogle,
};
