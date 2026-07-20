const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

class ProfileManager {
  constructor() {
    this.profilesPath = path.join(app.getPath('userData'), 'profiles.json');
    this.profiles = this.loadProfiles();
  }

  loadProfiles() {
    try {
      if (fs.existsSync(this.profilesPath)) {
        const data = fs.readFileSync(this.profilesPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
    }

    // Default profile if file doesn't exist
    const defaultProfiles = [
      {
        id: 'main',
        name: 'Default',
        email: null,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=main',
        timestamp: Date.now()
      }
    ];
    this.saveProfiles(defaultProfiles);
    return defaultProfiles;
  }

  saveProfiles(profiles) {
    try {
      fs.writeFileSync(this.profilesPath, JSON.stringify(profiles, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving profiles:', err);
    }
  }

  getProfiles() {
    return this.profiles;
  }

  getProfileByEmail(email) {
    if (!email) return null;
    return this.profiles.find(p => p.email && p.email.toLowerCase() === email.toLowerCase()) || null;
  }

  createProfile(name, email) {
    if (!name || !name.trim()) {
      return { error: 'Name is required' };
    }

    const cleanName = name.trim();
    let cleanEmail = null;
    let id;

    if (email && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      // Check for duplicate email if provided
      const existing = this.getProfileByEmail(cleanEmail);
      if (existing) {
        return { error: 'A profile with this email already exists' };
      }
      id = cleanEmail;
    } else {
      id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    const newProfile = {
      id,
      name: cleanName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      timestamp: Date.now()
    };
    this.profiles.push(newProfile);
    this.saveProfiles(this.profiles);
    return newProfile;
  }

  updateProfileEmail(id, email) {
    if (!email || !email.trim()) return false;

    // Check for duplicate email on a different profile
    const existing = this.getProfileByEmail(email.trim());
    if (existing && existing.id !== id) return false;

    const profile = this.profiles.find(p => p.id === id);
    if (!profile) return false;

    profile.email = email.trim().toLowerCase();
    this.saveProfiles(this.profiles);
    return true;
  }

  updateProfileData(id, data) {
    const profile = this.profiles.find(p => p.id === id);
    if (!profile) return false;

    let updated = false;
    if (data.name && data.name !== profile.name) {
      profile.name = data.name;
      updated = true;
    }
    if (data.email && data.email !== profile.email) {
      profile.email = data.email;
      updated = true;
    }
    if (data.avatar && data.avatar !== profile.avatar) {
      profile.avatar = data.avatar;
      updated = true;
    }

    if (updated) {
      this.saveProfiles(this.profiles);
    }
    return updated;
  }

  deleteProfile(id) {
    if (id === 'main') return false; // Cannot delete default profile
    const initialLength = this.profiles.length;
    this.profiles = this.profiles.filter(p => p.id !== id);
    if (this.profiles.length < initialLength) {
      this.saveProfiles(this.profiles);
      return true;
    }
    return false;
  }

  partitionFor(profileId) {
    return profileId === 'guest' || !profileId ? 'incognito' : `persist:${profileId}`;
  }

  ensureDefaultProfile() {
    let defaultProfile = this.profiles.find(p => p.id === 'main');
    if (!defaultProfile) {
      defaultProfile = {
        id: 'main',
        name: 'Default',
        email: null,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=main',
        timestamp: Date.now()
      };
      this.profiles.push(defaultProfile);
      this.saveProfiles(this.profiles);
    }
    return defaultProfile;
  }

  registerProfileHandlers(openWindowFn) {
    ipcMain.handle('get-profiles', () => this.getProfiles());
    ipcMain.handle('create-profile', (event, { name, email }) => this.createProfile(name, email));
    ipcMain.handle('delete-profile', (event, id) => this.deleteProfile(id));
    ipcMain.handle('update-profile-data', (event, { id, data }) => this.updateProfileData(id, data));
    ipcMain.on('switch-profile', (event, id) => {
      openWindowFn(id, id === 'guest');
    });

    const { signInWithGoogle, encryptToken } = require('./googleAuth');
    
    ipcMain.handle('profiles:linkGoogle', async (_e, profileId) => {
      const result = await signInWithGoogle({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      });
      return this.linkGoogleAccount(profileId, result);
    });
    
    ipcMain.handle('profiles:unlinkGoogle', (_e, profileId) => this.unlinkGoogleAccount(profileId));

    ipcMain.handle('profiles:setTavilyKey', (_e, { profileId, key }) => this.setTavilyKey(profileId, key));
    ipcMain.handle('profiles:removeTavilyKey', (_e, profileId) => this.removeTavilyKey(profileId));
    ipcMain.handle('profiles:getTavilyKey', (_e, profileId) => this.getTavilyKey(profileId));
  }

  linkGoogleAccount(profileId, { tokens, profile }) {
    const p = this.profiles.find((x) => x.id === profileId);
    if (!p) return null;
    
    const { encryptToken } = require('./googleAuth');
    
    p.google = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      // refresh_token is only sent on first consent — keep the old one if this is a re-link
      refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : p.google?.refreshToken,
    };
    
    // Update the profile's main avatar and email if they aren't explicitly set, or overwrite them
    p.email = profile.email;
    p.avatar = profile.picture || p.avatar;
    if (p.name === 'Default' || !p.name) p.name = profile.name;
    
    this.saveProfiles(this.profiles);
    return p;
  }

  unlinkGoogleAccount(profileId) {
    const p = this.profiles.find((x) => x.id === profileId);
    if (!p) return null;
    delete p.google;
    this.saveProfiles(this.profiles);
    return p;
  }

  setTavilyKey(profileId, key) {
    const p = this.profiles.find((x) => x.id === profileId);
    if (!p) return null;
    const { encryptToken } = require('./googleAuth');
    p.tavily = {
      apiKey: encryptToken(key)
    };
    this.saveProfiles(this.profiles);
    return p;
  }

  removeTavilyKey(profileId) {
    const p = this.profiles.find((x) => x.id === profileId);
    if (!p) return null;
    delete p.tavily;
    this.saveProfiles(this.profiles);
    return p;
  }

  getTavilyKey(profileId) {
    const p = this.profiles.find((x) => x.id === profileId);
    if (!p || !p.tavily || !p.tavily.apiKey) return null;
    const { decryptToken } = require('./googleAuth');
    return decryptToken(p.tavily.apiKey);
  }
}

// Export a singleton instance
module.exports = new ProfileManager();
