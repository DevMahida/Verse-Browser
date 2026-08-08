"use client";

import { useState, useEffect, useRef } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin, Loader2, Thermometer, Calendar, Search, X } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";

export default function WeatherWidget() {
  const { setLiveWeather, savedWeatherLocation, setSavedWeatherLocation, vpnEnabled } = useBrowserStore();
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);
  
  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const widgetRef = useRef(null);

  // Debounced Search Fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch(e) {
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let lat, lng, locString;
        
        if (savedWeatherLocation && vpnEnabled) {
          // Only use saved location if VPN is active (user chose a VPN city)
          lat = savedWeatherLocation.latitude;
          lng = savedWeatherLocation.longitude;
          locString = savedWeatherLocation.name;
        } else {
          // Always fall back to real IP geolocation when VPN is off.
          // Add a timestamp to prevent the browser from returning a cached proxy response!
          const locRes = await fetch(`https://get.geojs.io/v1/ip/geo.json?_t=${Date.now()}`);
          if (!locRes.ok) throw new Error("Location fetch failed");
          if (cancelled) return;
          const locData = await locRes.json();
          lat = locData.latitude;
          lng = locData.longitude;
          locString = `${locData.city || locData.region}, ${locData.country}`;
        }
        
        if (cancelled) return;
        setLocation(locString);

        // Step 2: Get Weather from Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        if (!weatherRes.ok) throw new Error("Weather fetch failed");
        if (cancelled) return;
        const weatherJson = await weatherRes.json();
        
        setWeatherData(weatherJson);
        
        // Push to global store for AI context
        if (setLiveWeather) {
          setLiveWeather({
            location: locString,
            temperature: weatherJson.current.temperature_2m,
            feelsLike: weatherJson.current.apparent_temperature,
            condition: getWeatherString(weatherJson.current.weather_code),
            humidity: weatherJson.current.relative_humidity_2m,
            windSpeed: weatherJson.current.wind_speed_10m,
            fetchedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Weather Widget Error:", err);
          setError("Unable to load weather.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    // When VPN is off, add a small delay to let proxy fully clear before re-fetching
    if (!vpnEnabled) {
      const timer = setTimeout(fetchWeather, 1500);
      return () => { cancelled = true; clearTimeout(timer); };
    } else {
      fetchWeather();
      return () => { cancelled = true; };
    }
  }, [setLiveWeather, savedWeatherLocation, vpnEnabled]);

  const handleSelectLocation = (loc) => {
    setSavedWeatherLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      name: `${loc.name}, ${loc.country}`
    });
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  // Close widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const getWeatherIcon = (code) => {
    if (code <= 3) return <Sun className="w-8 h-8 text-yellow-400" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8 text-blue-400" />;
    return <Cloud className="w-8 h-8 text-gray-400" />;
  };

  function getWeatherString(code) {
    if (code === 0) return "Clear sky";
    if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 95) return "Thunderstorm";
    return "Cloudy";
  }

  if (isLoading) {
    return (
      <div className="absolute top-6 right-6 p-4 rounded-2xl bg-surface/80 backdrop-blur-md border border-border/50 shadow-sm flex items-center gap-3 z-40">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="text-sm text-foreground/60 font-medium">Loading weather...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return null; // Don't show anything if it completely fails
  }

  const current = weatherData.current;

  return (
    <div 
      ref={widgetRef}
      className={`absolute top-6 right-6 z-40 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[380px]' : 'w-[260px] cursor-pointer hover:scale-105'} `}
    >
      <div 
        onClick={() => !isExpanded && setIsExpanded(true)}
        className="bg-surface/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Compact View / Search Header */}
        <div className="p-4 flex items-center justify-between gap-6 relative">
          {isSearching ? (
            <div className="flex items-center gap-3 w-full animate-in fade-in zoom-in duration-200">
              <Search className="w-5 h-5 text-foreground/50" />
              <input
                autoFocus
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) setSearchResults([]);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-none outline-none text-base font-medium w-full text-foreground placeholder:text-foreground/40"
              />
              {isSearchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-foreground/50" />
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsSearching(false); setSearchQuery(''); setSearchResults([]); }} 
                  className="p-1 hover:bg-foreground/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-foreground/50" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {getWeatherIcon(current.weather_code)}
                <div>
                  <div className="text-2xl font-bold tracking-tight">{Math.round(current.temperature_2m)}°</div>
                  <div 
                    className="text-xs font-medium text-foreground/60 tracking-wider uppercase flex items-center gap-1 cursor-text hover:text-foreground transition-colors group"
                    onClick={(e) => { e.stopPropagation(); setIsSearching(true); if (!isExpanded) setIsExpanded(true); }}
                    title="Change location"
                  >
                    <MapPin className="w-3 h-3" /> {location?.split(',')[0]}
                    <Search className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                  </div>
                </div>
              </div>
              {!isExpanded && (
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground/80">{getWeatherString(current.weather_code)}</div>
                  <div className="text-xs text-foreground/50">Feels like {Math.round(current.apparent_temperature)}°</div>
                </div>
              )}
            </>
          )}

          {/* Search Dropdown Results */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-[100%] left-0 w-full bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200 mt-2">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); handleSelectLocation(res); }}
                  className="px-4 py-3 hover:bg-foreground/5 cursor-pointer flex items-center gap-3 border-b border-border/20 last:border-0 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-foreground/50" />
                  <div>
                    <div className="text-sm font-medium">{res.name}</div>
                    <div className="text-xs text-foreground/50">{res.admin1 ? `${res.admin1}, ` : ''}{res.country}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Detailed View */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="px-5 pb-5 pt-2 border-t border-border/50">
            
            {/* Hourly Forecast Slider */}
            <div 
              className="flex gap-4 overflow-x-auto pb-4 mb-4 snap-x [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-foreground/5 [&::-webkit-scrollbar-thumb]:bg-foreground/10 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {weatherData.hourly && weatherData.hourly.time.slice(
                Math.max(0, weatherData.hourly.time.findIndex(t => new Date(t) >= new Date())),
                Math.max(0, weatherData.hourly.time.findIndex(t => new Date(t) >= new Date())) + 24
              ).map((time, idx) => {
                const startIndex = Math.max(0, weatherData.hourly.time.findIndex(t => new Date(t) >= new Date()));
                const code = weatherData.hourly.weather_code[startIndex + idx];
                const temp = weatherData.hourly.temperature_2m[startIndex + idx];
                
                // Scale down the icon
                let Icon = Cloud;
                let colorClass = "text-gray-400";
                if (code <= 3) { Icon = Sun; colorClass = "text-yellow-400"; }
                else if (code >= 51 && code <= 67) { Icon = CloudRain; colorClass = "text-blue-400"; }
                
                return (
                  <div key={time} className="flex flex-col items-center justify-between gap-2 min-w-[64px] snap-start bg-foreground/5 p-3 rounded-2xl border border-border/30 hover:bg-foreground/10 transition-colors">
                    <div className="text-[11px] font-semibold text-foreground/70">{new Date(time).toLocaleTimeString([], { hour: 'numeric' })}</div>
                    <Icon className={`w-7 h-7 ${colorClass} drop-shadow-sm`} />
                    <div className="text-base font-bold">{Math.round(temp)}°</div>
                  </div>
                );
              })}
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-foreground/50 text-xs font-semibold uppercase tracking-wider">
                  <Droplets className="w-4 h-4 text-blue-400" /> Humidity
                </div>
                <div className="text-lg font-medium">{current.relative_humidity_2m}%</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-foreground/50 text-xs font-semibold uppercase tracking-wider">
                  <Wind className="w-4 h-4 text-cyan-400" /> Wind
                </div>
                <div className="text-lg font-medium">{current.wind_speed_10m} km/h</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-foreground/50 text-xs font-semibold uppercase tracking-wider">
                  <Thermometer className="w-4 h-4 text-orange-400" /> Feels Like
                </div>
                <div className="text-lg font-medium">{Math.round(current.apparent_temperature)}°</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-foreground/50 text-xs font-semibold uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-purple-400" /> 3-Day Max
                </div>
                <div className="text-lg font-medium">{Math.round(weatherData.daily.temperature_2m_max[0])}°</div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors shadow-sm"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
