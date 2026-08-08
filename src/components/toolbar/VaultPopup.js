import React, { useState, useEffect } from 'react';
import { Key, Copy, Trash2, X, Plus, ExternalLink, Lock } from 'lucide-react';

export default function VaultPopup({ onClose, isStandalone }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    setLoading(true);
    try {
      if (window.electron && window.electron.vault) {
        const creds = await window.electron.vault.getAllCredentials();
        setCredentials(creds || []);
      }
    } catch (e) {
      console.error('Error loading credentials:', e);
    }
    setLoading(false);
  }

  const handleCopy = async (id, password) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.electron && window.electron.vault) {
        await window.electron.vault.deleteCredential(id);
        await loadCredentials();
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const getDomainName = (url) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className={`flex flex-col bg-surface border border-border overflow-hidden ${isStandalone ? 'w-full h-full' : 'w-80 h-96 rounded-xl shadow-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/30">
        <div className="flex items-center gap-2 text-foreground">
          <div className="p-1.5 bg-green-500/20 text-green-500 rounded-lg">
            <Lock size={18} />
          </div>
          <span className="font-semibold text-[15px]">Vault</span>
        </div>
        {!isStandalone && (
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/60 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full text-foreground/50 text-sm">Loading...</div>
        ) : credentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="p-3 bg-foreground/5 rounded-full text-foreground/30">
              <Key size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground text-sm">Vault is Empty</h3>
              <p className="text-xs text-foreground/50">Passwords you save will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex flex-col p-3 rounded-lg bg-surface-hover/50 border border-border group">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 truncate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${getDomainName(cred.domain)}`}
                      className="w-4 h-4 rounded-sm"
                      onError={(e) => { e.target.style.display = 'none'; }}
                      alt=""
                    />
                    <span className="text-sm font-medium text-foreground truncate" title={cred.domain}>
                      {getDomainName(cred.domain)}
                    </span>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(cred.id, cred.password)}
                      className="p-1 rounded hover:bg-foreground/10 text-foreground/60 transition-colors"
                      title="Copy Password"
                    >
                      {copiedId === cred.id ? (
                        <span className="text-[10px] font-bold text-green-500 px-1">Copied!</span>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors ml-1"
                      title="Delete Credential"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-foreground/50 truncate pr-6" title={cred.username}>
                  {cred.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
