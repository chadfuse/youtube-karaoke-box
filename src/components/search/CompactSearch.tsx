import { useState, useEffect } from "react";
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

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (q.trim().length === 0) {
        setResult(null);
        setError(null);
        return;
      }

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
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [q, settings.regionCode]);

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
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Start typing to search for a song..." 
              className="pl-10"
              aria-label="Auto-search query" 
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

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