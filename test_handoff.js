const { initiateSystemHandoff } = require('./electron/system-auth-handoff');

console.log('Testing System Auth Handoff...');

// We simulate a YouTube login navigation
const targetUrl = 'https://accounts.google.com/ServiceLogin?service=youtube';

initiateSystemHandoff(targetUrl)
  .then((payload) => {
    console.log('Handoff completed successfully:', payload);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Handoff failed:', err);
    process.exit(1);
  });
