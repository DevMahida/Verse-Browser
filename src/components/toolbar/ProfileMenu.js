import { useState, useEffect } from 'react';
import { User, Plus, LogOut, LogIn, Trash2, Mail, AlertCircle } from 'lucide-react';
import { useBrowserStore } from '@/store/useBrowserStore';

export default function ProfileMenu({ onClose }) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('profileId') || 'main';
    }
    return 'main';
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [error, setError] = useState('');
  
  const { currentUser, isIncognitoWindow, openSettingsTab } = useBrowserStore();

  useEffect(() => {
    if (window.electron && window.electron.getProfiles) {
      window.electron.getProfiles().then(setProfiles).catch(console.error);
    }
  }, []);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreateProfile = async () => {
    const email = newProfileEmail.trim();
    const name = newProfileName.trim();

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!window.electron) return;

    const result = await window.electron.createProfile(name || email.split('@')[0], email);
    
    if (result.error) {
      setError(result.error);
      return;
    }

    setProfiles([...profiles, result]);
    setIsAdding(false);
    setNewProfileName('');
    setNewProfileEmail('');
    setError('');
    window.electron.switchProfile(result.id);
    onClose();
  };

  const handleSwitchProfile = (id) => {
    if (window.electron) {
      window.electron.switchProfile(id);
      onClose();
    }
  };
  
  const handleDeleteProfile = async (e, id) => {
    e.stopPropagation();
    if (window.electron) {
      const deleted = await window.electron.deleteProfile(id);
      if (deleted) {
        setProfiles(profiles.filter(p => p.id !== id));
      }
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewProfileName('');
    setNewProfileEmail('');
    setError('');
  };

  if (isIncognitoWindow) {
    return (
      <div className="absolute top-[calc(100%+8px)] right-0 w-72 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 z-50 text-foreground">
        <div className="flex flex-col items-center p-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-foreground/50" />
          </div>
          <h3 className="font-semibold text-lg">Incognito Mode</h3>
          <p className="text-sm text-foreground/60 text-center mt-2">
            You are browsing privately. Profiles are disabled in Incognito Mode.
          </p>
        </div>
      </div>
    );
  }

  const currentProfile = profiles.find(p => p.id === currentProfileId) || { name: 'Default', email: null, avatar: '' };

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 text-foreground animate-in slide-in-from-top-2 duration-200">
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-4">
          <img 
            src={currentUser?.photoURL || currentProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=main"} 
            alt="Profile" 
            className="w-12 h-12 rounded-full border border-border/50 object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">{currentProfile.name}</h3>
            <p className="text-xs text-foreground/60 truncate">
              {currentProfile.email || currentUser?.email || "Not signed in"}
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          {!currentUser ? (
            <button 
              onClick={() => { openSettingsTab(); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in to Verse
            </button>
          ) : (
            <button 
              onClick={() => { window.electron?.logoutGoogle?.(); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="p-2">
        <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider px-2 py-2">
          Other Profiles
        </h4>
        <div className="max-h-48 overflow-y-auto">
          {profiles.filter(p => p.id !== currentProfileId).map(profile => (
            <div 
              key={profile.id}
              onClick={() => handleSwitchProfile(profile.id)}
              className="flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors group"
            >
              <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{profile.name}</span>
                {profile.email && (
                  <span className="text-xs text-foreground/50 truncate block">{profile.email}</span>
                )}
              </div>
              <button 
                onClick={(e) => handleDeleteProfile(e, profile.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-foreground/50 hover:text-destructive rounded-md transition-all"
                title="Delete Profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {isAdding ? (
          <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                <input 
                  type="email"
                  autoFocus
                  value={newProfileEmail}
                  onChange={(e) => { setNewProfileEmail(e.target.value); setError(''); }}
                  placeholder="Email address (required)"
                  className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProfile();
                    if (e.key === 'Escape') handleCancelAdd();
                  }}
                />
              </div>
              <input 
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProfile();
                  if (e.key === 'Escape') handleCancelAdd();
                }}
              />
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 px-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={handleCreateProfile}
                disabled={!newProfileEmail.trim()}
                className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
              >
                Add
              </button>
              <button 
                onClick={handleCancelAdd}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-1.5 rounded-md text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full mt-1 flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors text-foreground/80 hover:text-foreground"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Add Profile</span>
          </button>
        )}
      </div>
    </div>
  );
}
