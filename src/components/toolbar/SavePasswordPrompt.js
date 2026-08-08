import React, { useState, useEffect } from 'react';
import { Key, X, Check } from 'lucide-react';

export default function SavePasswordPrompt() {
  const [promptData, setPromptData] = useState(null);

  useEffect(() => {
    if (window.electron && window.electron.vault) {
      const cleanup = window.electron.vault.onPromptSaveCredential((data) => {
        setPromptData(data);
      });
      return cleanup;
    }
  }, []);

  const handleSave = async () => {
    if (promptData && window.electron && window.electron.vault) {
      try {
        await window.electron.vault.saveCredential(
          promptData.domain,
          promptData.username,
          promptData.password
        );
      } catch (e) {
        console.error('Failed to save credential', e);
      }
    }
    setPromptData(null);
  };

  const handleDismiss = () => {
    setPromptData(null);
  };

  if (!promptData) return null;

  return (
    <div className="absolute top-16 right-4 w-80 bg-surface border border-border rounded-xl shadow-2xl p-4 flex flex-col gap-3 z-[9999] animate-in fade-in slide-in-from-top-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">Save Password?</h3>
            <p className="text-xs text-foreground/60 mt-0.5">Do you want to save this password in your Vault?</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 hover:bg-foreground/10 rounded-md text-foreground/50 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="text-sm bg-surface-hover/50 p-2 rounded border border-border">
        <div className="flex gap-2">
          <span className="text-foreground/50 w-16">Domain:</span>
          <span className="text-foreground font-medium truncate">{promptData.domain}</span>
        </div>
        <div className="flex gap-2 mt-1">
          <span className="text-foreground/50 w-16">User:</span>
          <span className="text-foreground font-medium truncate">{promptData.username}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-1 justify-end">
        <button onClick={handleDismiss} className="px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5 rounded-md transition-colors">
          Never
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-accent hover:bg-accent/90 text-white rounded-md transition-colors flex items-center gap-1">
          <Check size={14} />
          Save Password
        </button>
      </div>
    </div>
  );
}
