import { useEffect, useState, useRef } from "react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { BookOpen, X, Loader2, Link as LinkIcon, Home, FileText } from "lucide-react";

export default function ReaderPage({ url }) {
  const { tabs, activeTabId, navigate, updateTab } = useBrowserStore();
  
  // Extract target URL from internal URL if it's passed as a prop or query param.
  // Assuming the internal tab URL is something like browser://reader?url=...
  const activeTab = tabs.find(t => t.id === activeTabId);
  const readerUrl = url || (activeTab?.url.startsWith('browser://reader') ? new URLSearchParams(activeTab.url.split('?')[1]).get('url') : null);

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    async function fetchAndParse() {
      if (!readerUrl) {
        setLoading(false);
        setError("No URL provided for Reader Mode.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (!window.electron || !window.electron.tabManager || !window.electron.tabManager.fetchSource) {
          throw new Error("Electron API is not available.");
        }

        let html = activeTab?.readerHtml;
        if (!html) {
          html = await window.electron.tabManager.fetchSource({ url: readerUrl });
        }
        
        if (!isMounted.current) return;

        // Parse HTML into a DOM Document
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Dynamically import readability to avoid SSR issues if any
        const { Readability } = await import('@mozilla/readability');
        const reader = new Readability(doc);
        const parsedArticle = reader.parse();

        if (!parsedArticle) {
          throw new Error("This page doesn't appear to be an article, so Reader View can't extract any content.");
        }

        // --- Deduplicate images ---
        if (parsedArticle.content) {
          const contentDoc = parser.parseFromString(parsedArticle.content, 'text/html');
          const images = contentDoc.querySelectorAll('img');
          const seenSrcs = new Set();
          
          images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
              if (seenSrcs.has(src)) {
                img.remove();
              } else {
                seenSrcs.add(src);
              }
            }
          });
          
          parsedArticle.content = contentDoc.body.innerHTML;
        }

        if (isMounted.current) {
          setArticle(parsedArticle);
          setLoading(false);
          // Optionally update the tab title to match the article title
          updateTab(activeTabId, { title: parsedArticle.title || "Reader View" });
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message || "Failed to load reader view.");
          setLoading(false);
        }
      }
    }

    fetchAndParse();

    return () => {
      isMounted.current = false;
    };
  }, [readerUrl, activeTabId, updateTab]);

  const handleClose = () => {
    if (readerUrl) {
      navigate(activeTabId, readerUrl);
    } else {
      navigate(activeTabId, 'browser://newtab');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-[#FAFAFA] dark:bg-[#1A1A1A] flex flex-col items-center justify-center text-foreground/70">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Preparing reader view...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center text-foreground">
        <FileText className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-xl font-bold mb-2">Reader View Unavailable</h2>
        <p className="text-foreground/70 mb-6 max-w-md text-center">{error}</p>
        <button 
          onClick={handleClose}
          className="px-6 py-2 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors"
        >
          Return to Page
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#FDFBF7] dark:bg-[#121212] overflow-y-auto custom-scrollbar relative flex flex-col items-center selection:bg-blue-200 dark:selection:bg-blue-900/50">
      
      {/* Top Toolbar */}
      <div className="sticky top-0 w-full h-14 bg-[#FDFBF7]/90 dark:bg-[#121212]/90 flex items-center justify-between px-6 z-10 backdrop-blur-sm border-b border-border/50 shrink-0">
        <div className="flex items-center space-x-2 text-foreground/50">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-wider">Reader View</span>
        </div>
        <button 
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-foreground/10 text-foreground/70 transition-colors"
          title="Exit Reader View"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl w-full px-8 pt-12 pb-32 flex-1">
        {article?.title && (
          <h1 className="text-4xl md:text-5xl font-bold text-[#202020] dark:text-[#E0E0E0] leading-tight mb-6 font-serif">
            {article.title}
          </h1>
        )}
        
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#707070] dark:text-[#A0A0A0] mb-10 pb-8 border-b border-[#E5E5E5] dark:border-[#333333]">
          {article?.byline && (
            <span className="font-medium text-[#404040] dark:text-[#C0C0C0]">
              {article.byline}
            </span>
          )}
          {article?.siteName && (
            <span className="flex items-center">
              <span className="w-1 h-1 rounded-full bg-current mx-3 opacity-50"></span>
              {article.siteName}
            </span>
          )}
          {article?.length && (
            <span className="flex items-center">
              <span className="w-1 h-1 rounded-full bg-current mx-3 opacity-50"></span>
              {Math.ceil(article.length / 200)} min read
            </span>
          )}
          {readerUrl && (
            <a 
              href={readerUrl} 
              className="flex items-center hover:text-blue-500 transition-colors ml-auto"
              onClick={(e) => { e.preventDefault(); handleClose(); }}
            >
              <LinkIcon className="w-3 h-3 mr-1" />
              Original Article
            </a>
          )}
        </div>

        {/* Content Body */}
        {article?.content && (
          <div 
            onClick={(e) => {
              const a = e.target.closest('a');
              if (a && a.href) {
                e.preventDefault();
                navigate(activeTabId, a.href);
              }
            }}
            className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-p:text-[#333] dark:prose-p:text-[#CCC] prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl prose-img:shadow-sm max-w-none font-serif"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}
      </div>
    </div>
  );
}
