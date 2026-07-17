const { app, session } = require('electron');
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    console.log('sec-ch-ua:', details.requestHeaders['sec-ch-ua']);
    console.log('sec-ch-ua-mobile:', details.requestHeaders['sec-ch-ua-mobile']);
    console.log('sec-ch-ua-platform:', details.requestHeaders['sec-ch-ua-platform']);
    console.log('User-Agent:', details.requestHeaders['User-Agent']);
    callback({ requestHeaders: details.requestHeaders });
  });
  const { net } = require('electron');
  net.fetch('https://httpbin.org/headers').then(res => res.text()).then(text => {
    console.log(text);
    app.quit();
  });
});
