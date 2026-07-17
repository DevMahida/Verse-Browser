// googleAuth.js
//
// RFC 8252 "OAuth 2.0 for Native Apps" — the legitimate way to link a
// Google account to your own app. The actual sign-in page runs in the
// user's REAL default browser (shell.openExternal), never inside your
// embedded Chromium, so Google's embedded-browser block never triggers.
// A short-lived local server on 127.0.0.1 catches the redirect back with
// an authorization code. This is the same pattern VS Code/Slack/Discord
// use, and what Google's own docs recommend for desktop apps.

const { shell, net, safeStorage } = require('electron');
const http = require('http');
const crypto = require('crypto');

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generatePkce() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

// Starts a one-shot local server, resolves with its port immediately, and
// separately resolves `waitForCallback` once Google actually redirects back.
function startLoopbackServer() {
  return new Promise((resolveReady) => {
    let resolveCallback, rejectCallback;
    const waitForCallback = new Promise((res, rej) => {
      resolveCallback = res;
      rejectCallback = rej;
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding-top:80px;">
        <h2>${error ? 'Sign-in failed' : 'Signed in'}</h2>
        <p>You can close this tab and go back to the app.</p>
      </body></html>`);

      server.close();
      if (error) rejectCallback(new Error(error));
      else resolveCallback({ code, state });
    });

    server.listen(0, '127.0.0.1', () => {
      resolveReady({ port: server.address().port, waitForCallback });
    });
  });
}

function postForm(url, params) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: 'POST', url });
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    const chunks = [];
    req.on('response', (response) => {
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(new URLSearchParams(params).toString());
    req.end();
  });
}

function getJson(url, accessToken) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: 'GET', url });
    req.setHeader('Authorization', `Bearer ${accessToken}`);
    const chunks = [];
    req.on('response', (response) => {
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ---------- The actual sign-in flow ----------

async function signInWithGoogle({ clientId, clientSecret, scope = 'openid email profile' }) {
  const { verifier, challenge } = generatePkce();
  const state = base64url(crypto.randomBytes(16));

  const { port, waitForCallback } = await startLoopbackServer();
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline'); // request a refresh_token
  authUrl.searchParams.set('prompt', 'consent');       // guarantees one is issued

  await shell.openExternal(authUrl.toString()); // opens in the user's REAL browser

  const { code, state: returnedState } = await waitForCallback;
  if (returnedState !== state) {
    throw new Error('State mismatch on OAuth callback — aborting (possible CSRF)');
  }

  const tokens = await postForm('https://oauth2.googleapis.com/token', {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });

  const profile = await getJson('https://openidconnect.googleapis.com/v1/userinfo', tokens.access_token);

  return { tokens, profile }; // profile: { email, name, picture, ... }
}

// Call later to get a fresh access_token without reopening the browser.
function refreshAccessToken({ refreshToken, clientId, clientSecret }) {
  return postForm('https://oauth2.googleapis.com/token', {
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
}

// ---------- At-rest encryption for the refresh_token ----------

function encryptToken(token) {
  if (!safeStorage.isEncryptionAvailable()) return token; // e.g. some Linux setups without a keyring
  return safeStorage.encryptString(token).toString('base64');
}

function decryptToken(encrypted) {
  if (!safeStorage.isEncryptionAvailable()) return encrypted;
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
}

module.exports = { signInWithGoogle, refreshAccessToken, encryptToken, decryptToken };
