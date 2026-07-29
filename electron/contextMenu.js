const { Menu, clipboard, shell, BrowserWindow } = require('electron');

function setupContextMenu(webContents) {
  webContents.on('context-menu', (event, params) => {
    const { 
      mediaType, 
      linkURL, 
      srcURL, 
      isEditable, 
      selectionText, 
      dictionarySuggestions, 
      editFlags,
      mediaFlags,
      x, y,
      frameURL
    } = params;

    const template = [];
    const isFrame = frameURL !== '' && frameURL !== webContents.getURL();
    
    // Since we use WebContentsView, we need to send UI commands to the main BrowserWindow's webContents
    const targetWebContents = BrowserWindow.getAllWindows()[0]?.webContents || webContents;
    
    const sendToUI = (action, data = {}) => {
      targetWebContents.send('context-menu-command', { action, ...data });
    };

    // Check if we are on the custom view-source page
    const isViewSource = webContents.getURL().includes('view-source.html');
    if (isViewSource) {
      const template = [
        { label: 'Copy', role: 'copy' },
        { label: 'Select all', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Save as…', click: async () => {
            try {
              const rawText = await webContents.executeJavaScript('window.__rawSource');
              if (rawText) {
                const urlParams = new URL(webContents.getURL()).searchParams;
                const targetUrl = urlParams.get('url');
                
                let defaultName = 'source.txt';
                try {
                  const parsed = new URL(targetUrl);
                  let pathname = parsed.pathname.split('/').pop();
                  if (pathname) {
                    defaultName = pathname;
                    if (!pathname.includes('.')) defaultName += '.html';
                  } else {
                    defaultName = parsed.hostname + '.html';
                  }
                } catch (e) {}

                const defaultPath = require('path').join(require('electron').app.getPath('downloads'), defaultName);
                const { dialog } = require('electron');
                const fs = require('fs');
                
                const { filePath } = await dialog.showSaveDialog({
                  defaultPath,
                  title: `Save source for ${targetUrl}`,
                  filters: [{ name: 'All Files', extensions: ['*'] }]
                });
                
                if (filePath) {
                  fs.writeFileSync(filePath, rawText);
                }
              }
            } catch (err) {
              console.error("Save as error:", err);
            }
        }},
        { label: 'Print…', click: () => webContents.print() }
      ];
      const menu = Menu.buildFromTemplate(template);
      menu.popup();
      return;
    }

    // 1. Link (with or without image)
    if (linkURL) {
      template.push(
        { label: 'Open link in new tab', click: () => sendToUI('open-new-tab', { url: linkURL }) },
        { label: 'Open link in new window', click: () => sendToUI('open-new-window', { url: linkURL }) },
        { label: 'Open link in Incognito window', click: () => sendToUI('open-incognito', { url: linkURL }) },
        { type: 'separator' },
        { label: 'Save link as…', click: () => webContents.downloadURL(linkURL) },
        { label: 'Copy link address', click: () => clipboard.writeText(linkURL) },
        { type: 'separator' }
      );
    }

    // 2. Image
    if (mediaType === 'image') {
      template.push(
        { label: 'Open image in new tab', click: () => sendToUI('open-new-tab', { url: srcURL }) },
        { label: 'Save image as…', click: () => webContents.downloadURL(srcURL) },
        { label: 'Copy image', click: () => webContents.copyImageAt(x, y) },
        { label: 'Copy image address', click: () => clipboard.writeText(srcURL) },
        { label: 'Search image with Google', click: () => sendToUI('open-new-tab', { url: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(srcURL)}` }) },
        { type: 'separator' }
      );
    }

    // 3. Video
    if (mediaType === 'video') {
      template.push(
        { label: mediaFlags.isPaused ? 'Play' : 'Pause', click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).${mediaFlags.isPaused ? 'play' : 'pause'}();`).catch(() => {}) },
        { label: mediaFlags.isMuted ? 'Unmute' : 'Mute', click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).muted = ${!mediaFlags.isMuted};`).catch(() => {}) },
        { label: 'Loop', type: 'checkbox', checked: mediaFlags.isLooping, click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).loop = ${!mediaFlags.isLooping};`).catch(() => {}) },
        { label: 'Show controls', type: 'checkbox', checked: mediaFlags.isControlsVisible, click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).controls = ${!mediaFlags.isControlsVisible};`).catch(() => {}) },
        { label: 'Picture-in-picture', click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).requestPictureInPicture?.();`).catch(() => {}) },
        { type: 'separator' },
        { label: 'Save video as…', click: () => webContents.downloadURL(srcURL) },
        { label: 'Copy video URL', click: () => clipboard.writeText(srcURL) },
        { label: 'Open video in new tab', click: () => sendToUI('open-new-tab', { url: srcURL }) },
        { type: 'separator' }
      );
    }

    // 4. Audio
    if (mediaType === 'audio') {
      template.push(
        { label: mediaFlags.isPaused ? 'Play' : 'Pause', click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).${mediaFlags.isPaused ? 'play' : 'pause'}();`).catch(() => {}) },
        { label: mediaFlags.isMuted ? 'Unmute' : 'Mute', click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).muted = ${!mediaFlags.isMuted};`).catch(() => {}) },
        { label: 'Loop', type: 'checkbox', checked: mediaFlags.isLooping, click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).loop = ${!mediaFlags.isLooping};`).catch(() => {}) },
        { label: 'Show controls', type: 'checkbox', checked: mediaFlags.isControlsVisible, click: () => webContents.executeJavaScript(`document.elementFromPoint(${x}, ${y}).controls = ${!mediaFlags.isControlsVisible};`).catch(() => {}) },
        { type: 'separator' },
        { label: 'Save audio as…', click: () => webContents.downloadURL(srcURL) },
        { label: 'Copy audio URL', click: () => clipboard.writeText(srcURL) },
        { label: 'Open audio in new tab', click: () => sendToUI('open-new-tab', { url: srcURL }) },
        { type: 'separator' }
      );
    }

    // 5. Canvas
    if (mediaType === 'canvas') {
      template.push(
        { 
            label: 'Save image as…', 
            click: () => {
                webContents.executeJavaScript(`
                    (function() {
                        const el = document.elementFromPoint(${x}, ${y});
                        if(el && el.tagName === 'CANVAS') {
                            const link = document.createElement('a');
                            link.download = 'canvas.png';
                            link.href = el.toDataURL();
                            link.click();
                        }
                    })();
                `).catch(() => {});
            }
        },
        { type: 'separator' }
      );
    }

    // 6. Editable Field
    if (isEditable) {
      if (dictionarySuggestions && dictionarySuggestions.length > 0) {
        dictionarySuggestions.forEach(suggestion => {
          template.push({
            label: suggestion,
            click: () => webContents.replaceMisspelling(suggestion)
          });
        });
        template.push({ type: 'separator' });
        template.push({
          label: 'Add to dictionary',
          click: () => webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        });
        template.push({ type: 'separator' });
      } else if (params.misspelledWord) {
         template.push({
          label: 'Add to dictionary',
          click: () => webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        });
        template.push({ type: 'separator' });
      }

      template.push(
        { label: 'Undo', role: 'undo', enabled: editFlags.canUndo },
        { label: 'Redo', role: 'redo', enabled: editFlags.canRedo },
        { type: 'separator' },
        { label: 'Cut', role: 'cut', enabled: editFlags.canCut },
        { label: 'Copy', role: 'copy', enabled: editFlags.canCopy },
        { label: 'Paste', role: 'paste', enabled: editFlags.canPaste },
        { label: 'Paste as plain text', role: 'pasteAndMatchStyle', enabled: editFlags.canPaste },
        { label: 'Delete', role: 'delete', enabled: editFlags.canDelete },
        { type: 'separator' },
        { label: 'Select all', role: 'selectAll', enabled: editFlags.canSelectAll },
        { type: 'separator' }
      );
    }

    // 7. Selected Text
    if (selectionText && !isEditable) {
      template.push(
        { label: 'Copy', role: 'copy', enabled: editFlags.canCopy },
        { label: `Search Google for "${selectionText.length > 15 ? selectionText.slice(0, 15) + '...' : selectionText}"`, click: () => sendToUI('open-new-tab', { url: `https://www.google.com/search?q=${encodeURIComponent(selectionText)}` }) },
        { label: 'Print…', click: () => webContents.print() },
        { type: 'separator' }
      );
    }

    const canGoBack = (wc) => (wc?.navigationHistory ? wc.navigationHistory.canGoBack() : wc?.canGoBack());
    const canGoForward = (wc) => (wc?.navigationHistory ? wc.navigationHistory.canGoForward() : wc?.canGoForward());

    // 8. Page Background / IFrame
    if (!linkURL && mediaType === 'none' && !isEditable && !selectionText) {
      if (isFrame) {
        template.push(
          { label: 'Back', click: () => webContents.goBack(), enabled: canGoBack(webContents) },
          { label: 'Forward', click: () => webContents.goForward(), enabled: canGoForward(webContents) },
          { label: 'Reload frame', click: () => webContents.reload() },
          { type: 'separator' },
          { label: 'Save frame as…', click: () => webContents.downloadURL(frameURL) },
          { label: 'Print frame', click: () => webContents.print() },
          { label: 'View frame source', click: () => sendToUI('open-new-tab', { url: `view-source:${frameURL}` }) },
          { type: 'separator' }
        );
      } else {
        template.push(
          { label: 'Back', click: () => webContents.goBack(), enabled: canGoBack(webContents) },
          { label: 'Forward', click: () => webContents.goForward(), enabled: canGoForward(webContents) },
          { label: 'Reload', click: () => webContents.reload() },
          { type: 'separator' },
          { label: 'Save as…', click: () => webContents.downloadURL(webContents.getURL()) },
          { label: 'Print…', click: () => webContents.print() },
          { label: 'View page source', click: () => sendToUI('open-new-tab', { url: `view-source:${webContents.getURL()}` }) },
          { type: 'separator' }
        );
      }
    }

    // 9. Inspect Element
    template.push({
      label: 'Inspect',
      click: () => webContents.inspectElement(x, y)
    });

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  });
}

module.exports = setupContextMenu;
