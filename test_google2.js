const { app, BrowserWindow, session } = require('electron');

app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationProxy');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

app.whenReady().then(() => {
  const chromeVersion = process.versions.chrome || '120.0.0.0';
  const spoofedUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  app.userAgentFallback = spoofedUA;
  session.defaultSession.setUserAgent(spoofedUA);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    headers['User-Agent'] = spoofedUA;
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase().startsWith('sec-ch-ua')) {
        // let's see what happens if we delete them
        delete headers[key];
      }
    }
    callback({ requestHeaders: headers });
  });

  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('https://accounts.google.com');
  
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript('navigator.userAgentData ? JSON.stringify(navigator.userAgentData.brands) : "undefined"').then(res => console.log("userAgentData:", res));
    win.webContents.executeJavaScript('navigator.vendor').then(res => console.log("vendor:", res));
  });
});
