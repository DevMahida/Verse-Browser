const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

class VaultStore {
  constructor() {
    this.vaultPath = path.join(app.getPath('userData'), 'vault.json');
    this.vault = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.vaultPath)) {
        const data = fs.readFileSync(this.vaultPath, 'utf8');
        this.vault = JSON.parse(data);
      }
    } catch (e) {
      console.error('[VaultStore] Error loading vault:', e);
      this.vault = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.vaultPath, JSON.stringify(this.vault, null, 2));
    } catch (e) {
      console.error('[VaultStore] Error saving vault:', e);
    }
  }

  isEncryptionAvailable() {
    return safeStorage.isEncryptionAvailable();
  }

  // Encrypt string into hex so it can be stored as JSON
  encrypt(text) {
    if (this.isEncryptionAvailable()) {
      return safeStorage.encryptString(text).toString('hex');
    }
    // Fallback if safeStorage fails (e.g. Linux without libsecret)
    return Buffer.from(text).toString('base64');
  }

  decrypt(hexOrBase64) {
    if (!hexOrBase64) return '';
    if (this.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(hexOrBase64, 'hex');
        return safeStorage.decryptString(buffer);
      } catch (e) {
        // Fallback for previously unencrypted or base64 entries
        console.error('[VaultStore] Decryption failed, trying fallback', e);
      }
    }
    // Fallback
    try {
      return Buffer.from(hexOrBase64, 'base64').toString('utf8');
    } catch (e) {
      return '';
    }
  }

  getAll() {
    return this.vault.map(item => ({
      ...item,
      password: this.decrypt(item.passwordEncrypted)
    }));
  }

  getByDomain(domain) {
    if (!domain) return [];
    return this.getAll().filter(item => 
      item.domain.toLowerCase().includes(domain.toLowerCase()) || 
      domain.toLowerCase().includes(item.domain.toLowerCase())
    );
  }

  addCredential(domain, username, password) {
    const existingIndex = this.vault.findIndex(i => i.domain === domain && i.username === username);
    const newItem = {
      id: existingIndex >= 0 ? this.vault[existingIndex].id : Date.now().toString() + Math.random().toString(36).substr(2, 5),
      domain,
      username,
      passwordEncrypted: this.encrypt(password),
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      this.vault[existingIndex] = newItem;
    } else {
      this.vault.push(newItem);
    }
    this.save();
    return true;
  }

  deleteCredential(id) {
    this.vault = this.vault.filter(item => item.id !== id);
    this.save();
    return true;
  }
}

module.exports = new VaultStore();
