"use client";

import { useState, useEffect, useCallback } from "react";
import { Newspaper, ExternalLink, RefreshCw, Clock, TrendingUp, Cpu, Film, Trophy, Briefcase, Heart, FlaskConical, Globe } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";

const CATEGORIES = [
  { id: "general", label: "Top Stories", icon: TrendingUp },
  { id: "technology", label: "Tech", icon: Cpu },
  { id: "entertainment", label: "Entertainment", icon: Film },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "health", label: "Health", icon: Heart },
  { id: "science", label: "Science", icon: FlaskConical },
  { id: "world", label: "World", icon: Globe },
];

// Direct RSS feeds from news sources (these include media:content images)
const FEED_URLS = {
  general: [
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
    "https://feeds.bbci.co.uk/news/rss.xml",
  ],
  technology: [
    "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
    "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml",
  ],
  entertainment: [
    "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
    "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml",
  ],
  sports: [
    "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
    "https://feeds.bbci.co.uk/sport/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/cricket/rssfeed.xml",
  ],
  business: [
    "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml",
  ],
  health: [
    "https://timesofindia.indiatimes.com/rssfeeds/3908999.cms",
    "https://feeds.bbci.co.uk/news/health/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/lifestyle/rssfeed.xml",
  ],
  science: [
    "https://timesofindia.indiatimes.com/rssfeeds/56636799.cms",
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/science/rssfeed.xml",
  ],
  world: [
    "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml",
  ],
};

// Map feed domain to clean source name
function getSourceName(feedUrl) {
  if (feedUrl.includes("timesofindia")) return "Times of India";
  if (feedUrl.includes("hindustantimes")) return "Hindustan Times";
  if (feedUrl.includes("bbci.co.uk") || feedUrl.includes("bbc.")) return "BBC News";
  if (feedUrl.includes("ndtv")) return "NDTV";
  if (feedUrl.includes("indianexpress")) return "Indian Express";
  if (feedUrl.includes("thehindu")) return "The Hindu";
  if (feedUrl.includes("reuters")) return "Reuters";
  return "";
}

// Extract the best image URL from an RSS item using multiple methods
function extractImageFromItem(item, description) {
  // 1. media:content (most reliable for images)
  const mediaContents = item.getElementsByTagName("media:content");
  for (let i = 0; i < mediaContents.length; i++) {
    const el = mediaContents[i];
    const url = el.getAttribute("url");
    const medium = el.getAttribute("medium") || "";
    if (url && url.startsWith("http") && (medium === "image" || medium === "" || url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
      return url;
    }
  }

  // 2. media:thumbnail
  const mediaThumbnails = item.getElementsByTagName("media:thumbnail");
  for (let i = 0; i < mediaThumbnails.length; i++) {
    const url = mediaThumbnails[i].getAttribute("url");
    if (url && url.startsWith("http")) return url;
  }

  // 3. enclosure with image type
  const enclosures = item.querySelectorAll("enclosure");
  for (const enc of enclosures) {
    const url = enc.getAttribute("url");
    const type = enc.getAttribute("type") || "";
    if (url && (type.startsWith("image") || url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
      return url;
    }
  }

  // 4. image tag directly inside item
  const imageEl = item.querySelector("image");
  if (imageEl) {
    const urlEl = imageEl.querySelector("url");
    if (urlEl?.textContent) return urlEl.textContent;
  }

  // 5. Extract from description HTML
  if (description) {
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1].startsWith("http")) return imgMatch[1];
  }

  return "";
}

// Parse a single RSS feed's XML and return articles
function parseFeedItems(xmlText, sourceName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  // Check for parsing errors
  if (doc.querySelector("parsererror")) return [];

  const items = doc.querySelectorAll("item");
  const results = [];

  items.forEach((item) => {
    const title = item.querySelector("title")?.textContent?.trim() || "";
    if (!title) return;

    const link = item.querySelector("link")?.textContent?.trim() || "";
    const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
    const description = item.querySelector("description")?.textContent || "";
    const imageUrl = extractImageFromItem(item, description);

    // Use provided source name (mapped from feed URL)
    const source = sourceName || "News";

    results.push({
      title: title.replace(/<[^>]*>/g, "").trim(),
      link,
      pubDate,
      source,
      imageUrl,
      timestamp: pubDate ? new Date(pubDate).getTime() : 0,
    });
  });

  return results;
}

// Format relative time
function getRelativeTime(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "";
  }
}

// Generate a gradient color based on category
function getCategoryGradient(category) {
  const gradients = {
    general: "from-purple-600/30 to-indigo-600/20",
    technology: "from-cyan-600/30 to-blue-600/20",
    entertainment: "from-pink-600/30 to-rose-600/20",
    sports: "from-green-600/30 to-emerald-600/20",
    business: "from-amber-600/30 to-orange-600/20",
    health: "from-red-500/30 to-pink-500/20",
    science: "from-violet-600/30 to-purple-600/20",
    world: "from-teal-600/30 to-cyan-600/20",
  };
  return gradients[category] || gradients.general;
}

// Deterministic color for source badge
function getSourceColor(source) {
  if (!source) return "bg-accent/20 text-accent";
  const colors = [
    "bg-blue-500/20 text-blue-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-cyan-500/20 text-cyan-400",
    "bg-violet-500/20 text-violet-400",
    "bg-orange-500/20 text-orange-400",
    "bg-teal-500/20 text-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Shimmer loading skeleton
function NewsCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-36 w-full bg-surface-hover" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-surface-hover rounded-full w-20" />
        <div className="space-y-2">
          <div className="h-4 bg-surface-hover rounded-full w-full" />
          <div className="h-4 bg-surface-hover rounded-full w-3/4" />
        </div>
        <div className="h-3 bg-surface-hover rounded-full w-16" />
      </div>
    </div>
  );
}

// Fetch a single feed via Electron's main-process fetch (CORS-free)
async function fetchFeed(url) {
  if (typeof window !== "undefined" && window.electron?.tabManager?.fetchSource) {
    return window.electron.tabManager.fetchSource({ url });
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch");
  return response.text();
}

export default function LiveNews() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { activeTabId, navigate } = useBrowserStore();

  const fetchNews = useCallback(async (cat, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const feeds = FEED_URLS[cat] || FEED_URLS.general;

      // Fetch all feeds in parallel
      const feedResults = await Promise.allSettled(
        feeds.map(async (feedUrl) => {
          const xmlText = await fetchFeed(feedUrl);
          return parseFeedItems(xmlText, getSourceName(feedUrl));
        })
      );

      // Merge all articles from all feeds
      let allArticles = [];
      feedResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
          allArticles = allArticles.concat(result.value);
        }
      });

      if (allArticles.length === 0) throw new Error("No articles found");

      // Sort by date (newest first) and deduplicate by title similarity
      allArticles.sort((a, b) => b.timestamp - a.timestamp);

      // Simple dedup: skip articles with very similar titles
      const seen = new Set();
      const deduped = allArticles.filter((article) => {
        const key = article.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Assign stable IDs
      const finalArticles = deduped.slice(0, 12).map((a, i) => ({ ...a, id: i }));

      setArticles(finalArticles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("News fetch error:", err);
      setError("Unable to load news. Check your connection.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews(category);
    }, 0);
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchNews(category, true), 5 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [category, fetchNews]);

  const handleArticleClick = (article) => {
    if (article.link) {
      navigate(activeTabId, article.link);
    }
  };

  const handleCategoryChange = (newCat) => {
    if (newCat !== category) {
      setCategory(newCat);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 pb-8 shrink-0">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <Newspaper className="w-4.5 h-4.5 text-accent" />
          </div>
          <h2 className="text-foreground font-semibold text-lg tracking-wide">
            Live News
          </h2>
          {lastUpdated && !loading && (
            <span className="text-xs text-foreground/40 ml-1 hidden sm:inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {getRelativeTime(lastUpdated.toISOString())}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchNews(category, true)}
          disabled={isRefreshing}
          className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50"
          title="Refresh news"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? "bg-accent/15 text-accent border-accent/30 shadow-[0_0_12px_rgba(107,70,193,0.15)]"
                  : "bg-surface text-foreground/60 hover:text-foreground/90 border-border hover:border-border/80 hover:bg-surface-hover"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-foreground/60 text-sm mb-3">{error}</p>
          <button
            onClick={() => fetchNews(category)}
            className="text-accent hover:text-accent-hover text-sm font-medium cursor-pointer underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* News Grid */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.slice(0, 8).map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-accent/30 transition-all cursor-pointer hover:shadow-[0_8px_30px_rgba(107,70,193,0.12)] hover:-translate-y-0.5 duration-300"
            >
              {/* Thumbnail / Gradient Area */}
              <div className={`h-36 w-full bg-linear-to-br ${getCategoryGradient(category)} relative overflow-hidden flex items-center justify-center border-b border-border`}>
                {article.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 opacity-0"
                      referrerPolicy="no-referrer"
                      onLoad={(e) => { e.target.style.opacity = "1"; }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
                  </>
                ) : (
                  <>
                    {/* Abstract decorative pattern */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-3 left-3 w-20 h-20 rounded-full bg-white/5 blur-xl" />
                      <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-white/5 blur-lg" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/10 rotate-45" />
                    </div>
                    <div className="relative w-12 h-12 bg-surface/60 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Newspaper className="w-5 h-5 text-foreground/60" />
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-surface to-transparent opacity-60" />
                  </>
                )}

                {/* Source badge floating on thumbnail */}
                {article.source && (
                  <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md ${getSourceColor(article.source)} border border-white/5`}>
                    {article.source}
                  </div>
                )}

                {/* External link icon on hover */}
                <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-surface/70 backdrop-blur-sm text-foreground/50 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/5">
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm text-foreground/90 font-medium line-clamp-2 leading-snug mb-auto group-hover:text-foreground transition-colors">
                  {article.title}
                </h3>
                {article.pubDate && (
                  <div className="flex items-center gap-1 text-xs text-foreground/40 mt-3">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(article.pubDate)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
