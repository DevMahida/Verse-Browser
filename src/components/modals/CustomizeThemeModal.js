"use client";

import { useBrowserStore } from "@/store/useBrowserStore";
import { X, Image as ImageIcon, Trash2, Sun, Moon, Laptop, Palette } from "lucide-react";
import { useRef } from "react";

export default function CustomizeThemeModal({ onClose }) {
  const { theme, setTheme, customColors, setCustomColors, ntpSettings, setNtpSettings } = useBrowserStore();
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 data URL directly — avoids all IPC/protocol issues
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setNtpSettings({ backgroundImage: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNtpSettings({ backgroundImage: null });
  };

  const handleColorChange = (key, value) => {
    setTheme('custom');
    setCustomColors({ [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            Customize Verse
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Theme Mode */}
          <section className="mb-8">
            <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider mb-3">Color Scheme</h3>
            <div className="grid grid-cols-4 gap-2">
              <ThemeButton 
                active={theme === 'light'} 
                onClick={() => setTheme('light')} 
                icon={<Sun className="w-5 h-5" />} 
                label="Light" 
              />
              <ThemeButton 
                active={theme === 'dark'} 
                onClick={() => setTheme('dark')} 
                icon={<Moon className="w-5 h-5" />} 
                label="Dark" 
              />
              <ThemeButton 
                active={theme === 'system'} 
                onClick={() => setTheme('system')} 
                icon={<Laptop className="w-5 h-5" />} 
                label="System" 
              />
              <ThemeButton 
                active={theme === 'custom'} 
                onClick={() => setTheme('custom')} 
                icon={<Palette className="w-5 h-5" />} 
                label="Custom" 
              />
            </div>
          </section>

          {/* Custom Colors */}
          {theme === 'custom' && (
            <section className="mb-8 animate-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider mb-3">Custom Colors</h3>
              <div className="space-y-4">
                <ColorPicker label="Background" value={customColors.background} onChange={(c) => handleColorChange('background', c)} />
                <ColorPicker label="Surface (Cards, Bars)" value={customColors.surface} onChange={(c) => handleColorChange('surface', c)} />
                <ColorPicker label="Accent (Buttons, Highlights)" value={customColors.primary} onChange={(c) => handleColorChange('primary', c)} />
                <ColorPicker label="Text" value={customColors.text} onChange={(c) => handleColorChange('text', c)} />
              </div>
            </section>
          )}

          {/* New Tab Background */}
          <section>
            <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider mb-3">New Tab Background</h3>
            
            {ntpSettings.backgroundImage ? (
              <div className="relative rounded-lg overflow-hidden border border-border group h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ntpSettings.backgroundImage} alt="NTP Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 backdrop-blur-md">
                    <ImageIcon className="w-4 h-4" /> Change
                  </button>
                  <button onClick={removeImage} className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-lg border-2 border-dashed border-border hover:border-accent/50 bg-surface-hover flex flex-col items-center justify-center gap-2 text-foreground/60 hover:text-foreground transition-colors group"
              >
                <div className="p-3 bg-surface rounded-full group-hover:bg-accent/10 transition-colors shadow-sm">
                  <ImageIcon className="w-6 h-6 group-hover:text-accent transition-colors" />
                </div>
                <span>Click to upload background image</span>
              </button>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />

            {ntpSettings.backgroundImage && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-foreground/70 block mb-1">Background Blur</label>
                  <input 
                    type="range" 
                    min="0" max="20" step="1" 
                    value={parseInt(ntpSettings.backgroundBlur) || 0}
                    onChange={(e) => setNtpSettings({ backgroundBlur: `${e.target.value}px` })}
                    className="w-full accent-accent"
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground/70 block mb-1">Overlay Darkness</label>
                  <input 
                    type="range" 
                    min="0" max="100" step="5" 
                    value={!isNaN(parseFloat(ntpSettings.backgroundOverlay?.replace(/[^0-9.,]/g, '').split(',')[3])) ? parseFloat(ntpSettings.backgroundOverlay?.replace(/[^0-9.,]/g, '').split(',')[3]) * 100 : 40}
                    onChange={(e) => setNtpSettings({ backgroundOverlay: `rgba(0,0,0,${e.target.value / 100})` })}
                    className="w-full accent-accent"
                  />
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function ThemeButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
        active 
          ? 'bg-accent/10 border-accent text-accent' 
          : 'bg-surface border-border text-foreground/70 hover:bg-surface-hover hover:text-foreground'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover border border-border">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground/50 font-mono uppercase">{value}</span>
        <div className="relative w-8 h-8 rounded-md overflow-hidden border border-border shadow-sm cursor-pointer">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
