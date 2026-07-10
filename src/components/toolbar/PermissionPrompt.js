import { useBrowserStore } from "@/store/useBrowserStore";
import { Camera, MapPin, Bell, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const permissionIcons = {
  media: <Camera size={18} className="text-blue-400" />,
  geolocation: <MapPin size={18} className="text-green-400" />,
  notifications: <Bell size={18} className="text-yellow-400" />,
  default: <ShieldAlert size={18} className="text-red-400" />
};

const permissionLabels = {
  media: "use your camera and microphone",
  geolocation: "know your location",
  notifications: "show notifications",
  default: "access a restricted feature"
};

export default function PermissionPrompt() {
  const { activePermissionRequests, resolvePermissionRequest } = useBrowserStore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const promptRef = useRef(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (activePermissionRequests.length > 0) {
      setCurrentRequest(activePermissionRequests[0]);
      setIsVisible(true);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setCurrentRequest(null), 300); // fade out duration
      return () => clearTimeout(timer);
    }
  }, [activePermissionRequests]);

  useEffect(() => {
    if (window.electron) {
      const cleanup = window.electron.onPermissionRequest((request) => {
        useBrowserStore.getState().addPermissionRequest(request);
      });
      return cleanup;
    }
  }, []);

  // Dismiss (block) when clicking outside the prompt or into the webview
  useEffect(() => {
    if (!isVisible || !currentRequest) return;

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setIsVisible(false);
      setTimeout(() => resolvePermissionRequest(currentRequest.id, false), 300);
    };

    const handleClickOutside = (e) => {
      if (promptRef.current && !promptRef.current.contains(e.target)) {
        dismiss();
      }
    };

    // Clicking inside a webview doesn't fire mousedown on the parent document,
    // but it does cause the parent window to lose focus.
    const handleWindowBlur = () => {
      dismiss();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isVisible, currentRequest, resolvePermissionRequest]);

  if (!currentRequest && !isVisible) return null;

  const { id, origin, permission } = currentRequest || {};
  const icon = permissionIcons[permission] || permissionIcons.default;
  const label = permissionLabels[permission] || permissionLabels.default;

  return (
    <div ref={promptRef} className={`absolute top-full left-4 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
      <div className="p-4 flex items-start space-x-3">
        <div className="mt-1 bg-background p-2 rounded-lg border border-border">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug">
            {origin} wants to
          </h3>
          <p className="text-sm text-foreground/70 leading-snug mb-4">
            {label}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => resolvePermissionRequest(id, false), 300);
              }}
              className="flex-1 px-3 py-1.5 bg-surface-hover hover:bg-border text-foreground rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Block
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => resolvePermissionRequest(id, true), 300);
              }}
              className="flex-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors shadow-md cursor-pointer"
            >
              Allow
            </button>
          </div>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => resolvePermissionRequest(id, false), 300);
          }}
          className="text-foreground/50 hover:text-foreground cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
