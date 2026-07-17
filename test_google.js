const { app, BrowserWindow, session } = require('electron');

app.commandLine.appendSwitch('disable-features', 'UserAgentClientHint,WebAuthentication,WebAuthenticationProxy');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

app.whenReady().then(() => {
  const spoofedUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0';
  app.userAgentFallback = spoofedUA;
  session.defaultSession.setUserAgent(spoofedUA);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    headers['User-Agent'] = spoofedUA;
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase().startsWith('sec-ch-ua')) {
        delete headers[key];
      }
    }
    callback({ requestHeaders: headers });
  });

  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('https://accounts.google.com');
  
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript('navigator.webdriver').then(res => console.log("webdriver:", res));
    win.webContents.executeJavaScript('navigator.userAgent').then(res => console.log("userAgent:", res));
  });
});
