const { app, BrowserWindow, session } = require('electron');

// Same flags as the real app
app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationProxy');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

app.whenReady().then(() => {
  const chromeVersion = process.versions.chrome || '120.0.0.0';
  const cleanUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  app.userAgentFallback = cleanUA;
  session.defaultSession.setUserAgent(cleanUA);

  // This simulates the popup — a plain BrowserWindow, no debugger, no preload
  const popup = new BrowserWindow({
    width: 500,
    height: 650,
    title: 'Sign in with Google',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  popup.setMenuBarVisibility(false);
  popup.webContents.setUserAgent(cleanUA);
  popup.loadURL('https://accounts.google.com/ServiceLogin');

  popup.webContents.on('did-finish-load', () => {
    popup.webContents.executeJavaScript('navigator.webdriver').then(r => console.log('webdriver:', r));
    popup.webContents.executeJavaScript('navigator.userAgent').then(r => console.log('userAgent:', r));
    popup.webContents.executeJavaScript('navigator.userAgentData ? JSON.stringify(navigator.userAgentData.brands) : "N/A"').then(r => console.log('userAgentData:', r));
  });
});
