const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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
    // Validate email is provided
    if (!email || !email.trim()) {
      return { error: 'Email is required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check for duplicate email
    const existing = this.getProfileByEmail(cleanEmail);
    if (existing) {
      return { error: 'A profile with this email already exists' };
    }

    const id = cleanEmail; // Use the email directly as the profile ID
    const newProfile = {
      id,
      name: name || cleanEmail.split('@')[0],
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
}

// Export a singleton instance
module.exports = new ProfileManager();
