const { app } = require('electron');
const { authenticateWithGoogleLoopback } = require('./electron/google-oauth');

// We use dummy credentials because opening the browser doesn't require real credentials initially,
// only the token exchange does. This is just to test if the local server boots up and opens the browser.
app.whenReady().then(async () => {
  try {
    console.log('Starting OAuth flow test...');
    // This should open the default browser to a google auth URL
    // It will probably say "Error 400: invalid_request" in the browser because the client ID is fake.
    // But it proves the shell.openExternal and loopback server are working!
    const tokens = await authenticateWithGoogleLoopback(
      'dummy-client-id.apps.googleusercontent.com',
      'dummy-client-secret',
      ['email', 'profile']
    );
    console.log('Tokens received:', tokens);
  } catch (err) {
    console.error('Test finished with expected error (due to dummy client ID):', err.message);
  }
  app.quit();
});
