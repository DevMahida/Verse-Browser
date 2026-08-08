const http = require('http');
const url = require('url');
const { shell } = require('electron');
const { z } = require('zod');

// Strict schema validation for the incoming Google OAuth callback
const callbackSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
}).refine(data => data.code || data.error, {
  message: "Callback must contain either an authorization 'code' or an 'error'.",
});

/**
 * Initiates the System Browser Handoff for Google Authentication.
 * Spins up a temporary loopback server, opens the system browser, captures the callback,
 * validates it using Zod, and returns the payload.
 * 
 * @param {string} targetUrl - The original Google Auth URL (e.g., ServiceLogin or OAuth)
 * @returns {Promise<Object>} Resolves with the valid callback payload
 */
function initiateSystemHandoff(targetUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    
    // Timeout to prevent hanging ports
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('System browser authentication timed out.'));
    }, 5 * 60 * 1000); // 5 minutes

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}`;
      
      console.log(`[SystemAuthHandoff] Listening for callback on ${redirectUri}`);

      // We append the redirect_uri to the target URL. 
      // If it's ServiceLogin, it expects 'continue'
      // If it's an OAuth endpoint, it expects 'redirect_uri'
      let finalUrl = targetUrl;
      try {
        const urlObj = new URL(targetUrl);
        if (targetUrl.includes('ServiceLogin')) {
          urlObj.searchParams.set('continue', redirectUri);
        } else {
          urlObj.searchParams.set('redirect_uri', redirectUri);
        }
        finalUrl = urlObj.toString();
      } catch (e) {
        console.error('Failed to parse target URL:', e);
      }

      // Open in native system browser
      shell.openExternal(finalUrl);

      server.on('request', (req, res) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost');
          
          // Ignore favicon requests
          if (parsedUrl.pathname === '/favicon.ico') {
            res.writeHead(204);
            res.end();
            return;
          }

          const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
          console.log(`[SystemAuthHandoff] Received callback:`, queryParams);

          // Validate payload with Zod
          const parseResult = callbackSchema.safeParse(queryParams);

          if (!parseResult.success) {
            console.error('[SystemAuthHandoff] Validation Error:', parseResult.error);
            // Ignore requests that don't match our schema (might be stray requests)
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad Request - Invalid callback payload.');
            return;
          }

          const payload = parseResult.data;

          if (payload.error) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Authentication Failed</h1><p>Error: ${payload.error}</p><p>You can close this tab.</p>`);
            clearTimeout(timeout);
            server.close();
            return reject(new Error(`Google Auth Error: ${payload.error}`));
          }

          // Success - we have the code!
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #4CAF50;">Authentication Successful</h1>
                <p>You can safely close this tab and return to the Verse Browser.</p>
                <script>window.close();</script>
              </body>
            </html>
          `);
          
          clearTimeout(timeout);
          server.close();
          resolve(payload);

        } catch (e) {
          console.error('[SystemAuthHandoff] Request handler error:', e);
          res.writeHead(500);
          res.end('Internal Server Error');
          clearTimeout(timeout);
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

module.exports = {
  initiateSystemHandoff
};
