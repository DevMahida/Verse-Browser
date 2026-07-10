import HeroSection from "./HeroSection";
import RecentTabs from "./RecentTabs";

export default function Homepage() {
  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto bg-gradient-to-b from-background to-surface">
      <HeroSection />
      <RecentTabs />
    </div>
  );
}
