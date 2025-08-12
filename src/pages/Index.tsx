import { useEffect } from "react";
import KaraokePlayer from "@/components/controls/KaraokePlayer";
import KaraokeSearch from "@/components/search/KaraokeSearch";
import TrendingKaraoke from "@/components/trending/TrendingKaraoke";
import ReserveQueue from "@/components/queue/ReserveQueue";
import SettingsDialog from "@/components/SettingsDialog";

const Index = () => {
useEffect(() => {
  document.title = "Chado – Karaoke App";
  const desc = "Chado karaoke app – search, reserve, and sing your favorite songs.";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", desc);
  else {
    const m = document.createElement("meta");
    m.name = "description";
    m.content = desc;
    document.head.appendChild(m);
  }
  const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  const canonical = window.location.href;
  if (link) link.href = canonical; else {
    const l = document.createElement("link");
    l.rel = "canonical";
    l.href = canonical;
    document.head.appendChild(l);
  }
}, []);

  return (
    <div className="min-h-screen">
<header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
  <div className="container flex items-center justify-between py-3">
    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
      <img src="/lovable-uploads/3997c5c5-9313-46e5-90bf-510265840249.png" alt="Chado karaoke logo" className="h-8 w-8 rounded" loading="lazy" />
      Chado
    </h1>
    <SettingsDialog />
  </div>
</header>

      <main className="container py-4 md:py-6">
        <KaraokePlayer />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <KaraokeSearch />
            <TrendingKaraoke />
          </div>
          <div className="md:col-span-1">
            <ReserveQueue />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
