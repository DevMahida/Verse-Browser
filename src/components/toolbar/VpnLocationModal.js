import React from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Shield, X, MapPin } from 'lucide-react';
import clsx from 'clsx';

export default function VpnLocationModal() {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const { 
    vpnLocations, 
    vpnLocation, 
    setVpnLocation, 
    setVpnEnabled,
    setShowVpnModal,
    setVpnProxyServer 
  } = useBrowserStore();

  // Hide native tab views so this React modal is visible above them
  React.useEffect(() => {
    window.electron?.tabManager?.hideViews();
    return () => {
      window.electron?.tabManager?.showViews();
    };
  }, []);

  const handleSelectLocation = async (loc) => {
    setIsConnecting(true);
    
    // Default to the mock proxy (which will fallback to direct if it fails)
    let actualProxy = loc.proxy;
    
    // Try to fetch a real proxy for the selected country (e.g. 'au' from 'au-sydney')
    try {
      const countryCode = loc.id.split('-')[0].toUpperCase();
      const res = await fetch(`https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&country=${countryCode}`);
      if (res.ok) {
        const text = await res.text();
        const proxies = text.split('\n').map(p => p.trim()).filter(p => p !== '');
        if (proxies.length > 0) {
          actualProxy = proxies[0]; // Use the first available proxy
        }
      }
    } catch (e) {
      console.warn("Failed to fetch real proxy, using fallback.");
    }
    
    setVpnLocation(loc.id);
    actualProxy = actualProxy || 'direct://';
    setVpnProxyServer(actualProxy);
    setVpnEnabled(true);
    
    // Call the Electron backend to set the proxy
    if (window.electron && window.electron.vpn) {
      window.electron.vpn.setProxy({ proxyRules: actualProxy });
    }
    
    setIsConnecting(false);
    setShowVpnModal(false);
  };

  const handleClose = () => {
    setShowVpnModal(false);
  };

  const handleDisconnect = () => {
    setVpnEnabled(false);
    setVpnLocation(null);
    setVpnProxyServer('');
    
    if (window.electron && window.electron.vpn) {
      window.electron.vpn.setProxy({});
    }
    
    setShowVpnModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-surface-hover">
          <div className="flex items-center space-x-2">
            <Shield size={18} className="text-accent" />
            <h2 className="font-semibold text-foreground">Select VPN Location</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-md text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Location List */}
        <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar flex flex-col space-y-1">
          {vpnLocations.map((loc) => {
            const isSelected = vpnLocation === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                disabled={isConnecting}
                className={clsx(
                  "flex items-center justify-between p-3 rounded-lg transition-all text-left",
                  isSelected 
                    ? "bg-accent/20 border border-accent/30 text-foreground"
                    : "hover:bg-surface-hover border border-transparent text-foreground/80 hover:text-foreground",
                  isConnecting && "opacity-50 cursor-wait"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{loc.flag}</span>
                  <span className="font-medium text-sm">{loc.name}</span>
                </div>
                {isSelected && !isConnecting && (
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
                {isConnecting && (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        {vpnLocation && (
          <div className="p-4 border-t border-border bg-surface-hover/50 flex justify-between items-center">
            <div className="text-xs text-foreground/60 flex items-center">
              <MapPin size={12} className="mr-1" />
              Connected to {vpnLocations.find(l => l.id === vpnLocation)?.name}
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
