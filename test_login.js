const { app, BrowserWindow, session } = require('electron');

app.whenReady().then(async () => {
  const offscreen = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
  
  offscreen.webContents.on('did-finish-load', async () => {
    try {
      const html = await offscreen.webContents.executeJavaScript('document.documentElement.innerHTML');
      
      const fs = require('fs');
      fs.writeFileSync('accountchooser.html', html);
      console.log('Saved to accountchooser.html');
    } catch(e) {
      console.error(e);
    }
    app.quit();
  });
  
  offscreen.loadURL('https://accounts.google.com/AccountChooser');
});
