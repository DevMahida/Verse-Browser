// windowBounds.js
//
// Chrome doesn't use a fixed pixel size for a new window — it sizes
// relative to the current display's work area, remembers where you left
// it, and re-validates that position against whatever monitors are
// ACTUALLY connected before restoring it, so a window never opens
// off-screen after you unplug a second monitor. This replicates that.

const { screen, app } = require('electron');
const fs = require('fs');
const path = require('path');

const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function computeDefaultBounds() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.round(workArea.width * 0.85);
  const height = Math.round(workArea.height * 0.85);
  return {
    width: Math.max(width, 960),  // floor so the UI never breaks on tiny screens
    height: Math.max(height, 640),
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    isMaximized: false,
  };
}

function boundsFitOnSomeDisplay(bounds) {
  // A saved position only counts as valid if it overlaps a CURRENTLY
  // connected display's work area.
  return screen.getAllDisplays().some((display) => {
    const wa = display.workArea;
    return (
      bounds.x < wa.x + wa.width &&
      bounds.x + bounds.width > wa.x &&
      bounds.y < wa.y + wa.height &&
      bounds.y + bounds.height > wa.y
    );
  });
}

function loadWindowState() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), 'utf-8'));
    if (boundsFitOnSomeDisplay(saved)) return saved;
  } catch {
    // no saved state yet, or file is corrupted — fall through to default
  }
  return computeDefaultBounds();
}

function trackWindowState(win) {
  const save = () => {
    if (win.isDestroyed()) return;
    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, isMaximized }));
  };

  // Debounce so dragging/resizing doesn't hammer disk I/O
  let timer;
  const debouncedSave = () => {
    clearTimeout(timer);
    timer = setTimeout(save, 300);
  };

  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);
  win.on('close', save); // final, immediate save
}

module.exports = { loadWindowState, trackWindowState };
