import { useEffect, useState } from "react";
import KaraokePlayer from "@/components/controls/KaraokePlayer";
import KaraokeSearch from "@/components/search/KaraokeSearch";
import TrendingKaraoke from "@/components/trending/TrendingKaraoke";
import ReserveQueue from "@/components/queue/ReserveQueue";
import SettingsDialog from "@/components/SettingsDialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const em = session?.user?.email ?? null;
      setEmail(em);
      if (em) localStorage.setItem("karaoke_user_logged_in", "1");
      else localStorage.removeItem("karaoke_user_logged_in");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      const em = session?.user?.email ?? null;
      setEmail(em);
      if (em) localStorage.setItem("karaoke_user_logged_in", "1");
      else localStorage.removeItem("karaoke_user_logged_in");
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen">
<header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
  <div className="container flex items-center justify-between py-3">
    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
      <Link to="/">
        <img src="/lovable-uploads/3997c5c5-9313-46e5-90bf-510265840249.png" alt="Chado karaoke logo" className="h-12 w-12 rounded" loading="lazy" />
      </Link>
    </h1>
    <div className="flex items-center gap-2">
      {email ? (
        <>
          <span className="hidden md:inline text-sm text-muted-foreground">{email}</span>
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin">Admin</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={signOut}>Sign out</Button>
        </>
      ) : (
        <>
          <Button asChild size="sm" variant="outline"><Link to="/auth?mode=signin">Sign in</Link></Button>
          <Button asChild size="sm" variant="gradient"><Link to="/auth?mode=register">Register</Link></Button>
        </>
      )}
      
    </div>
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
