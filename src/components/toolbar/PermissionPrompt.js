import { useSearchParams } from "next/navigation";
import { Camera, MapPin, Bell, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

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
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const permission = searchParams.get('permission');
  const id = searchParams.get('id');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleResponse = (granted) => {
    if (window.electron && window.electron.respondToPermission) {
      window.electron.respondToPermission({
        id,
        origin,
        permission,
        granted
      });
    }
  };

  if (!isMounted) return null;

  const icon = permissionIcons[permission] || permissionIcons.default;
  const label = permissionLabels[permission] || permissionLabels.default;

  return (
    <div className="w-full h-full bg-surface border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col pointer-events-auto">
      <div className="p-4 flex items-start space-x-3">
        <div className="mt-1 bg-background p-2 rounded-lg border border-border shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug truncate">
            {origin} wants to
          </h3>
          <p className="text-sm text-foreground/70 leading-snug mb-4">
            {label}
          </p>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleResponse(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-foreground bg-background hover:bg-surface border border-border rounded-lg transition-colors"
            >
              Block
            </button>
            <button 
              onClick={() => handleResponse(true)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
