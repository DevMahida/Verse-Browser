"use client";

import HeroSection from "./HeroSection";
import LiveNews from "./LiveNews";
import { useBrowserStore } from "@/store/useBrowserStore";
import CustomizeThemeModal from "../modals/CustomizeThemeModal";
import { Palette } from "lucide-react";
import { useState } from "react";

export default function Homepage() {
  const { ntpSettings } = useBrowserStore();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-background to-surface">
      {/* Optional Background Image */}
      {ntpSettings?.backgroundImage && (
        <div 
          className="absolute inset-0 z-0 bg-[length:100%_100%] bg-center bg-no-repeat transition-all duration-500"
          style={{ 
            backgroundImage: `url(${ntpSettings.backgroundImage})`,
            filter: `blur(${ntpSettings.backgroundBlur || '0px'})`
          }} 
        />
      )}
      
      {/* Background Overlay to ensure text readability */}
      {ntpSettings?.backgroundImage && (
        <div 
          className="absolute inset-0 z-0 transition-colors duration-500"
          style={{ backgroundColor: ntpSettings.backgroundOverlay || 'rgba(0,0,0,0.4)' }}
        />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full flex flex-col items-center overflow-y-auto">
        <div className="w-full flex flex-col items-center min-h-max pb-8">
          <HeroSection />
          <LiveNews />
        </div>
      </div>

      {/* Customize Button - absolute to viewport bottom-right */}
      <button 
        onClick={() => setIsCustomizeOpen(true)}
        className="absolute bottom-6 right-6 p-3 rounded-full bg-surface/80 hover:bg-surface border border-border backdrop-blur-md text-foreground/70 hover:text-foreground shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all group z-20 cursor-pointer"
        title="Customize Theme"
      >
        <Palette className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {isCustomizeOpen && <CustomizeThemeModal onClose={() => setIsCustomizeOpen(false)} />}
    </div>
  );
}
