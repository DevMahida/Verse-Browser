const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false });
  win.webContents.debugger.attach('1.3');
  win.webContents.executeJavaScript('navigator.webdriver').then(res => {
    console.log('webdriver with debugger:', res);
    app.quit();
  });
});
