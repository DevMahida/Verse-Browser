import { MoreVertical } from "lucide-react";
import Image from "next/image"; // We'll use a placeholder div since we don't have images

const recentItems = [
  {
    id: 1,
    domain: "medium.com",
    title: "The Future of AI in Everyday Life",
    time: "5 min ago",
    color: "bg-blue-900/40",
    icon: "M",
    brandColor: "bg-black"
  },
  {
    id: 2,
    domain: "notion.so",
    title: "AI Browser – Product Roadmap",
    time: "1 hour ago",
    color: "bg-zinc-800",
    icon: "N",
    brandColor: "bg-white text-black"
  },
  {
    id: 3,
    domain: "docs.google.com",
    title: "Project Plan – AI Browser",
    time: "3 hours ago",
    color: "bg-blue-100",
    icon: "☰",
    brandColor: "bg-blue-600 text-white"
  },
  {
    id: 4,
    domain: "youtube.com",
    title: "Building an AI Browser (Full Tutorial)",
    time: "Yesterday",
    color: "bg-red-900/20",
    icon: "▶",
    brandColor: "bg-red-600 text-white"
  }
];

export default function RecentTabs() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 pb-8 shrink-0">
      <h2 className="text-foreground font-medium mb-4 text-lg tracking-wide">Continue where you left off</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentItems.map((item) => (
          <div 
            key={item.id} 
            className="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-border/60 transition-all cursor-pointer hover:shadow-lg"
          >
            {/* Thumbnail Placeholder */}
            <div className={`h-32 w-full ${item.color} relative overflow-hidden flex items-center justify-center border-b border-border`}>
              {/* Fake UI elements inside thumbnail to match mockup */}
              <div className="w-16 h-16 bg-foreground/10 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-xl">
                 <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${item.brandColor}`}>
                    {item.icon}
                 </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-surface to-transparent opacity-50" />
            </div>

            {/* Details */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-xs text-foreground/70">
                  <div className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center text-[8px] font-bold ${item.brandColor}`}>
                    {item.icon}
                  </div>
                  {item.domain}
                </div>
                <button aria-label="More options" className="text-gray-500 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity min-w-11 min-h-11 flex items-center justify-center -mr-2 focus-visible:ring-2 focus-visible:outline-none focus-visible:opacity-100">
                  <MoreVertical size={14} />
                </button>
              </div>
              <h3 className="text-sm text-foreground/90 font-medium line-clamp-2 leading-snug mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
