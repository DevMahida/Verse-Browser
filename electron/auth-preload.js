try {
  // 1. Mock window.chrome
  if (!window.chrome) {
    window.chrome = {
      runtime: {},
      csi: function() {},
      loadTimes: function() {}
    };
  }

  // 2. Mock navigator.userAgentData to perfectly match Google Chrome
  const chromeVersion = process.versions.chrome ? process.versions.chrome.split('.')[0] : '120';
  
  // We redefine userAgentData to contain the Google Chrome brand list.
  // Google's BotGuard checks this list to verify that the user agent is not a modified/headless browser.
  Object.defineProperty(navigator, 'userAgentData', {
    value: {
      brands: [
        { brand: 'Not A(Brand', version: '99' },
        { brand: 'Chromium', version: chromeVersion },
        { brand: 'Google Chrome', version: chromeVersion }
      ],
      mobile: false,
      platform: 'Windows',
      getHighEntropyValues: (hints) => Promise.resolve({
        platform: 'Windows',
        platformVersion: '10.0.0',
        architecture: 'x86',
        model: '',
        uaFullVersion: process.versions.chrome || '120.0.0.0'
      })
    },
    configurable: true,
    enumerable: true,
    writable: false
  });
} catch (e) {
  console.error("Auth preload error:", e);
}
