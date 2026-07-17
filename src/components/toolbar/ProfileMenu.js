import { useState, useEffect } from 'react';
import { User, Plus, LogOut, LogIn, Trash2, Mail, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useBrowserStore } from '@/store/useBrowserStore';
import { useShallow } from 'zustand/react/shallow';

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
  
  const { currentUser, isLoggedIn, userProfilePic, isIncognitoWindow, addTab, checkLoginState, logoutGoogle, accounts, switchAccount } = useBrowserStore(
    useShallow((state) => ({
      currentUser: state.currentUser,
      isLoggedIn: state.isLoggedIn,
      userProfilePic: state.userProfilePic,
      isIncognitoWindow: state.isIncognitoWindow,
      addTab: state.addTab,
      checkLoginState: state.checkLoginState,
      logoutGoogle: state.logoutGoogle,
      accounts: state.accounts,
      switchAccount: state.switchAccount,
    }))
  );

  useEffect(() => {
    // Check login state when menu opens
    checkLoginState(true);
  }, [checkLoginState]);

  useEffect(() => {
    if (window.electron && window.electron.getProfiles) {
      window.electron.getProfiles().then(setProfiles).catch(console.error);
    }
  }, []);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreateProfile = async () => {
    const name = newProfileName.trim();

    if (!name) {
      setError('Name is required');
      return;
    }
    if (!window.electron) return;

    const result = await window.electron.createProfile(name, '');
    
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

  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!window.electron?.linkGoogle) {
      addTab('https://accounts.google.com/ServiceLogin', 'Sign In');
      onClose();
      return;
    }

    setIsSigningIn(true);
    try {
      const updatedProfile = await window.electron.linkGoogle(currentProfileId);
      if (updatedProfile) {
        // Update local state to reflect the new linked profile data
        setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        onClose();
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (window.electron?.unlinkGoogle) {
      const updatedProfile = await window.electron.unlinkGoogle(currentProfileId);
      if (updatedProfile) {
        setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
      }
    } else if (typeof logoutGoogle === 'function') {
      await logoutGoogle(); // Fallback
    }
    onClose();
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
      {/* Signed-in User Header */}
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-4">
          {isLoggedIn && userProfilePic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={userProfilePic} 
              alt="Profile" 
              className="w-14 h-14 rounded-full border-2 border-accent/30 object-cover shadow-md"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=main"} 
              alt="Profile" 
              className="w-14 h-14 rounded-full border border-border/50 object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">
              {isLoggedIn ? (currentUser?.name || 'Google User') : currentProfile.name}
            </h3>
            <p className="text-xs text-foreground/60 truncate">
              {isLoggedIn ? (currentUser?.email || 'Signed in with Google') : 'Not signed in'}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          {!isLoggedIn ? (
            <button 
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm border border-gray-200 disabled:opacity-60 disabled:cursor-wait"
            >
              <FcGoogle size={18} />
              {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { addTab('https://myaccount.google.com', 'Google Account'); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Manage Account
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground/70 hover:text-foreground py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Other Google accounts (if signed in with multiple) */}
      {isLoggedIn && accounts && accounts.length > 1 && (
        <div className="border-b border-border/50">
          <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider px-4 pt-3 pb-1">
            Other Accounts
          </h4>
          {accounts.filter(a => a.email !== currentUser?.email).map((acc, idx) => (
            <button 
              key={idx} 
              onClick={() => {
                switchAccount(acc.email);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-foreground/10 flex items-center justify-center">
                {acc.pic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={acc.pic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-foreground/70" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-foreground truncate">{acc.name || 'Account'}</p>
                <p className="text-xs text-foreground/50 truncate">{acc.email}</p>
              </div>
            </button>
          ))}
          <button 
            onClick={() => { addTab('https://accounts.google.com/AddSession', 'Add Account'); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
              <Plus className="w-4 h-4 text-foreground/70" />
            </div>
            <span className="text-sm text-foreground/80">Add another account</span>
          </button>
        </div>
      )}

      {/* Browser Profiles */}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                <input 
                  type="text"
                  autoFocus
                  value={newProfileName}
                  onChange={(e) => { setNewProfileName(e.target.value); setError(''); }}
                  placeholder="Profile Name (required)"
                  className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProfile();
                    if (e.key === 'Escape') handleCancelAdd();
                  }}
                />
              </div>
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
                disabled={!newProfileName.trim()}
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
          <div className="space-y-1 mt-1">
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors text-foreground/80 hover:text-foreground"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Add Profile</span>
            </button>
            <button 
              onClick={() => handleSwitchProfile('guest')}
              className="w-full flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors text-foreground/80 hover:text-foreground"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Guest Mode</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
