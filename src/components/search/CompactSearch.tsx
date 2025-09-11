import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useKaraoke } from "@/state/karaokeStore";
import { searchKaraoke } from "@/hooks/useYouTube";
import { KaraokeVideo } from "@/types/youtube";
import { validateSearchQuery, searchRateLimiter } from "@/utils/inputValidation";
import { Search } from "lucide-react";

export default function CompactSearch() {
  const { settings, reserve } = useKaraoke();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<KaraokeVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate and sanitize input
    const validation = validateSearchQuery(q);
    if (!validation.isValid) {
      setError(validation.error || "Invalid search query");
      return;
    }

    // Rate limiting check
    const clientId = `compact_search_${Date.now()}`;
    if (!searchRateLimiter.isAllowed(clientId)) {
      setError("Too many requests. Please wait before searching again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchKaraoke({ 
        q: validation.sanitized, 
        regionCode: settings.regionCode, 
        maxResults: 1 
      });
      setResult(data[0] || null);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    if (result) {
      reserve(result);
      setResult(null);
      setQ("");
    }
  };

  return (
    <section aria-label="Quick Search" className="mb-4">
      <div className="bg-card border rounded-lg p-4">
        <form onSubmit={onSearch} className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Quick search for a song..." 
              className="pl-10"
              aria-label="Quick search query" 
            />
          </div>
          <Button 
            type="submit" 
            disabled={q.trim().length === 0 || loading} 
            variant="gradient"
            size="default"
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && <p className="text-destructive text-sm mb-2">{error}</p>}
        
        {result && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border">
            <div className="w-16 h-12 shrink-0 relative rounded overflow-hidden">
              <img 
                src={result.thumbnailUrl} 
                alt={`${result.title} karaoke thumbnail`} 
                className="w-full h-full object-cover" 
                loading="lazy" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium line-clamp-1" title={result.title}>
                {result.title}
              </div>
              <div className="text-xs text-muted-foreground">
                Duration: {Math.floor(result.durationSeconds/60)}:{(result.durationSeconds%60).toString().padStart(2, "0")}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="gradient" 
              onClick={handleReserve}
              aria-label={`Reserve ${result.title}`}
            >
              Reserve
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}