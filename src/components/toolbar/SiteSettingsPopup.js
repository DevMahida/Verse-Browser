import { useBrowserStore } from "@/store/useBrowserStore";
import { Camera, MapPin, Bell, ShieldAlert, RefreshCw } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const permissionIcons = {
  media: <Camera size={16} />,
  geolocation: <MapPin size={16} />,
  notifications: <Bell size={16} />,
  default: <ShieldAlert size={16} />
};

export default function SiteSettingsPopup({ url, onClose }) {
  const { sessionPermissions } = useBrowserStore();
  const popupRef = useRef(null);
  const [showReloadHint, setShowReloadHint] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const togglePermission = (origin, perm, currentStatus) => {
    const newGranted = currentStatus !== 'granted';
    // Revoke first, then set the new state
    if (window.electron) {
      window.electron.respondToPermission({
        // eslint-disable-next-line react-hooks/purity
        id: `toggle-${Date.now()}`,
        origin,
        permission: perm,
        granted: newGranted
      });
    }
    // Update local store
    const updatedPermissions = { ...useBrowserStore.getState().sessionPermissions };
    if (!updatedPermissions[origin]) {
      updatedPermissions[origin] = {};
    }
    updatedPermissions[origin][perm] = newGranted ? 'granted' : 'denied';
    useBrowserStore.setState({ sessionPermissions: updatedPermissions });
    setShowReloadHint(true);
  };

  if (!url || url.startsWith('browser://') || url.startsWith('verse://')) {
    return (
      <div ref={popupRef} className="absolute top-10 left-0 w-72 bg-surface border border-border rounded-xl shadow-2xl z-50 p-4">
        <p className="text-sm text-foreground/70">Settings are not available for internal pages.</p>
      </div>
    );
  }

  let origin;
  try {
    origin = new URL(url).origin;
  } catch {
    origin = url;
  }

  const sitePerms = sessionPermissions[origin] || {};
  const hasPerms = Object.keys(sitePerms).length > 0;

  return (
    <div ref={popupRef} className="absolute top-10 left-0 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-background/50">
        <h3 className="text-sm font-semibold text-foreground truncate">{origin}</h3>
        <p className="text-xs text-foreground/50">Connection is secure</p>
      </div>
      
      <div className="p-4">
        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">Permissions</h4>
        
        {!hasPerms ? (
          <p className="text-sm text-foreground/50">No special permissions requested.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(sitePerms).map(([perm, status]) => {
              const isGranted = status === 'granted';
              return (
                <div key={perm} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-foreground/90">
                    {permissionIcons[perm] || permissionIcons.default}
                    <span className="text-sm capitalize">{perm}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium transition-colors ${isGranted ? 'text-green-500' : 'text-red-400'}`}>
                      {isGranted ? 'Granted' : 'Denied'}
                    </span>
                    <button
                      onClick={() => togglePermission(origin, perm, status)}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${isGranted ? 'bg-green-500' : 'bg-red-500/60'}`}
                      title={isGranted ? 'Deny permission' : 'Grant permission'}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${isGranted ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showReloadHint && (
          <div className="mt-3 flex items-center justify-between gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 animate-[fadeIn_0.2s_ease-out]">
            <p className="text-xs text-accent">Reload page to apply changes</p>
            <button
              onClick={() => {
                const { activeTabId, splitTabId, focusedPane } = useBrowserStore.getState();
                const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
                if (window.electron?.tabManager) {
                  window.electron.tabManager.action({ tabId, action: 'reload' });
                }
                onClose();
              }}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover bg-accent/15 hover:bg-accent/25 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Reload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
