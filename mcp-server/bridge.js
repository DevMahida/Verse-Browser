export class Bridge {
  constructor() {
    this._pending = new Map();  // requestId → { resolve, reject, timer }
    this._counter = 0;
    
    // Check if we're running as a child process of Electron
    this._mode = process.send ? 'ipc' : 'http';
    
    if (this._mode === 'ipc') {
      process.on('message', (msg) => this._handleResponse(msg));
    }
  }
  
  async request(type, data = {}) {
    const id = ++this._counter;
    
    return new Promise((resolve, reject) => {
      // Timeout after 30 seconds
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error(`Bridge request '${type}' timed out`));
      }, 30000);
      
      this._pending.set(id, { resolve, reject, timer });
      
      if (this._mode === 'ipc') {
        process.send({ type, id, data });
      } else {
        // HTTP fallback for standalone mode
        this._httpRequest(type, id, data).catch(err => {
          this._pending.delete(id);
          reject(err);
        });
      }
    });
  }
  
  _handleResponse(msg) {
    const pending = this._pending.get(msg.id);
    if (!pending) return;
    
    clearTimeout(pending.timer);
    this._pending.delete(msg.id);
    
    if (msg.error) {
      pending.reject(new Error(msg.error));
    } else {
      pending.resolve(msg.result);
    }
  }

  async _httpRequest(type, id, data) {
    // Port 38271 is used by Electron app for HTTP bridge fallback
    const res = await fetch('http://127.0.0.1:38271/mcp-bridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, data }),
    });
    
    if (!res.ok) {
      throw new Error(`HTTP Bridge Error: ${res.status} ${res.statusText}`);
    }
    const msg = await res.json();
    this._handleResponse({ ...msg, id });
  }
}
