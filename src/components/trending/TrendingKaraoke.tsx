import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKaraoke } from "@/state/karaokeStore";
import { getTrendingKaraoke } from "@/hooks/useYouTube";
import { KaraokeVideo } from "@/types/youtube";

const formatDuration = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, "0")}`;

export default function TrendingKaraoke() {
  const { settings, reserve, nowPlaying, queue, setInitial } = useKaraoke();
  const [items, setItems] = useState<KaraokeVideo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.apiKey) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [us, uk] = await Promise.all([
          getTrendingKaraoke({ apiKey: settings.apiKey, regionCode: "US", maxResults: 24 }),
          getTrendingKaraoke({ apiKey: settings.apiKey, regionCode: "GB", maxResults: 24 }),
        ]);
        const map = new Map<string, KaraokeVideo>();
        [...us, ...uk].forEach((v) => map.set(v.id, v));
        const data = Array.from(map.values()).slice(0, 12);
        setItems(data);
        if (!nowPlaying && queue.length === 0 && data.length > 0) {
          setInitial(data[0]);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load trending");
      } finally {
        setLoading(false);
      }
    })();
  }, [settings.apiKey]);

  if (!settings.apiKey) return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Karaoke</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Enter your YouTube API key in Settings to load trending videos.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Karaoke</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-destructive">{error}</p>}
        {items && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((v) => (
              <div key={v.id} className="group rounded-md overflow-hidden border">
                <div className="relative aspect-video overflow-hidden">
                  <img src={v.thumbnailUrl} alt={`${v.title} karaoke thumbnail`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute right-1 bottom-1 text-xs px-1.5 py-0.5 rounded bg-background/80 border">{formatDuration(v.durationSeconds)}</div>
                </div>
                <div className="p-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-medium line-clamp-2" title={v.title}>{v.title}</div>
                  <Button size="sm" variant="gradient" onClick={() => reserve(v)} aria-label={`Reserve ${v.title}`}>Reserve</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
