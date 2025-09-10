import { KaraokeVideo, SearchParams, TrendingParams } from "@/types/youtube";
import { supabase } from "@/integrations/supabase/client";

// These helpers remain for potential local processing, but most logic is server-side now
export function parseYTDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function searchKaraoke({ q, maxResults = 25, regionCode = "US" }: SearchParams): Promise<KaraokeVideo[]> {
  const { data, error } = await supabase.functions.invoke('youtube-search', {
    body: { q, maxResults, regionCode }
  });
  if (error) throw error;
  return (data?.items || []) as KaraokeVideo[];
}

export async function getTrendingKaraoke({ maxResults = 12, regionCode = "US" }: TrendingParams): Promise<KaraokeVideo[]> {
  const { data, error } = await supabase.functions.invoke('youtube-trending', {
    body: { maxResults, regionCode }
  });
  if (error) throw error;
  return (data?.items || []) as KaraokeVideo[];
}

