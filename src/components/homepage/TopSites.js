import { useMemo, useState } from "react";
import { MoreVertical, X } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `bg-[hsl(${hue},20%,20%)] text-[hsl(${hue},70%,60%)]`;
};

export default function TopSites() {
  const { navigate, activeTabId, history, hiddenTopSites = [], hideTopSite } = useBrowserStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const dynamicTopSites = useMemo(() => {
    if (!history || history.length === 0) return [];

    const visits = {};
    history.forEach(entry => {
      // Ignore internal browser pages
      if (entry.url.startsWith('browser://')) return;
      
      const parsedUrl = new URL(entry.url);
      
      // Ignore search engine result pages
      const isSearchPage = 
        (parsedUrl.hostname.includes('google.com') && parsedUrl.pathname.startsWith('/search')) ||
        (parsedUrl.hostname.includes('bing.com') && parsedUrl.pathname.startsWith('/search')) ||
        (parsedUrl.hostname.includes('duckduckgo.com') && parsedUrl.searchParams.has('q'));
        
      if (isSearchPage) return;

      const domain = parsedUrl.hostname.replace('www.', '') || entry.url;
      const fullHostname = parsedUrl.hostname;
      
      // Filter out explicitly hidden sites
      if (hiddenTopSites.includes(fullHostname)) return;
      
      if (!visits[domain]) {
        visits[domain] = { 
          count: 0, 
          url: entry.url, 
          title: entry.title || domain,
          favicon: entry.favicon,
          domain,
          fullHostname
        };
      }
      visits[domain].count += 1;
      // Keep the most recent title/favicon
      if (entry.title) visits[domain].title = entry.title;
      if (entry.favicon) visits[domain].favicon = entry.favicon;
    });

    // Sort by most visited and filter by minimum visits
    const sortedVisits = Object.values(visits)
      .filter(site => site.count >= 4)
      .sort((a, b) => b.count - a.count);
    
    // Map to the required format
    return sortedVisits.slice(0, 18).map((site, index) => ({
      id: `hist-${index}`,
      name: site.title,
      icon: site.domain.charAt(0).toUpperCase(),
      color: generateColor(site.domain),
      url: site.url,
      favicon: site.favicon,
      fullHostname: site.fullHostname
    }));
  }, [history, hiddenTopSites]);

  if (dynamicTopSites.length === 0) {
    return null;
  }

  const itemsPerSlide = 6;
  const totalPages = Math.ceil(dynamicTopSites.length / itemsPerSlide);
  const visibleSites = dynamicTopSites.slice(currentSlide * itemsPerSlide, (currentSlide + 1) * itemsPerSlide);

  return (
    <div className="w-full max-w-4xl mt-12 flex flex-col items-center">
      <div className="flex items-center justify-center gap-6">
        {visibleSites.map((site) => (
          <div key={site.id} className="relative group">
            {isEditing && (
              <button 
                onClick={() => hideTopSite(site.fullHostname)}
                aria-label={`Remove ${site.name} from Top Sites`}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white z-20 shadow-lg hover:scale-110 transition-transform relative before:absolute before:-inset-2 before:content-[''] focus-visible:ring-2 focus-visible:outline-none"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => {
                if (!isEditing) navigate(activeTabId, site.url);
              }}
              className={`flex flex-col items-center gap-2 cursor-pointer ${isEditing ? 'animate-wiggle' : ''}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-surface border border-border group-hover:bg-foreground/10 transition-colors flex items-center justify-center shadow-sm overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=128`} 
                alt={site.name} 
                className="w-8 h-8 rounded-md z-10"
                onError={(e) => {
                  e.currentTarget.style.opacity = 0; // Hide broken image
                }}
              />
              <div className={`absolute inset-0 flex items-center justify-center font-bold text-xl ${site.color} z-0`}>
                {site.icon}
              </div>
            </div>
              <span className="text-xs text-foreground/80 group-hover:text-foreground truncate max-w-16">
                {site.name}
              </span>
            </button>
          </div>
        ))}
        
        {/* Menu dot button */}
        <button 
          onClick={() => setIsEditing(!isEditing)}
          aria-label={isEditing ? "Done editing" : "Edit shortcuts"}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors mb-6 focus-visible:ring-2 focus-visible:outline-none ${isEditing ? 'bg-foreground/ text-foreground' : 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'}`}
          title={isEditing ? "Done editing" : "Edit shortcuts"}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to page ${index + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer relative before:absolute before:-inset-3 before:content-[''] focus-visible:ring-2 focus-visible:outline-none ${
                currentSlide === index ? "w-6 bg-white" : "w-2 bg-gray-600 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
