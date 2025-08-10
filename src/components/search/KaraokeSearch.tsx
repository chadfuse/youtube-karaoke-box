import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKaraoke } from "@/state/karaokeStore";
import { searchKaraoke } from "@/hooks/useYouTube";
import { KaraokeVideo } from "@/types/youtube";

export default function KaraokeSearch() {
  const { settings, reserve } = useKaraoke();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [results, setResults] = useState<KaraokeVideo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings.apiKey) return;
    try {
      setLoading(true);
      setError(null);
      const data = await searchKaraoke({ apiKey: settings.apiKey, q, regionCode: settings.regionCode, maxResults: 24 });
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Karaoke</CardTitle>
      </CardHeader>
      <CardContent>
        {!settings.apiKey && (
          <p className="text-sm text-muted-foreground mb-3">Enter your YouTube API key in Settings to enable search.</p>
        )}
        <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs (e.g., Adele Hello)" aria-label="Search query" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" aria-label="Your name" />
          <Button type="submit" disabled={!settings.apiKey || q.trim().length === 0} className="w-full">Search</Button>
        </form>
        {loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Array.from({length:4}).map((_,i)=>(<div key={i} className="h-24 rounded-md bg-muted animate-pulse"/>))}</div>}
        {error && <p className="text-destructive mb-2">{error}</p>}
        {results && results.length === 0 && <p className="text-sm text-muted-foreground">No results.</p>}
        {results && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((v) => (
              <div key={v.id} className="flex gap-2 border rounded-md overflow-hidden">
                <div className="w-40 shrink-0 relative">
                  <img src={v.thumbnailUrl} alt={`${v.title} karaoke thumbnail`} className="w-40 h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 p-2 flex flex-col gap-1">
                  <div className="text-sm font-medium line-clamp-2" title={v.title}>{v.title}</div>
                  <div className="text-xs text-muted-foreground">Duration: {Math.floor(v.durationSeconds/60)}:{(v.durationSeconds%60).toString().padStart(2, "0")}</div>
                  <div className="mt-auto flex justify-end">
                    <Button size="sm" variant="secondary" onClick={() => reserve(v, name)} aria-label={`Reserve ${v.title}`}>Reserve</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
