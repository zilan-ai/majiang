import HeroSection from "@/components/HeroSection";
import CategoryNav from "@/components/CategoryNav";
import TileGrid from "@/components/TileGrid";
import FunctionTileSection from "@/components/FunctionTileSection";
import RuleSection from "@/components/RuleSection";
import TileDetailModal from "@/components/TileDetailModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-[#f5f0e8]">
      <HeroSection />
      <CategoryNav />
      <TileGrid />
      <FunctionTileSection />
      <RuleSection />
      <TileDetailModal />
      <footer className="text-center py-8 text-xs text-[#f5f0e8]/15 border-t border-white/[0.04]">
        创新文字麻将 · 脑洞大开版 — 以字为牌，以句为胡
      </footer>
    </div>
  );
}
