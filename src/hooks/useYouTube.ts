import { KaraokeVideo, SearchParams, TrendingParams } from "@/types/youtube";

// Parse ISO 8601 duration (e.g., PT3M15S) to seconds
export function parseYTDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

async function fetchJSON<T>(url: string) : Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

async function fetchVideoDetails(apiKey: string, ids: string[]): Promise<Record<string, KaraokeVideo>> {
  if (ids.length === 0) return {};
  const idParam = ids.join(",");
  const url = `${YT_API_BASE}/videos?part=snippet,contentDetails&id=${encodeURIComponent(idParam)}&key=${encodeURIComponent(apiKey)}`;
  type Resp = {
    items: Array<{
      id: string;
      snippet: { title: string; description?: string; thumbnails?: any; channelTitle?: string };
      contentDetails: { duration: string };
    }>
  };
  const data = await fetchJSON<Resp>(url);
  const out: Record<string, KaraokeVideo> = {};
  for (const it of data.items) {
    const durationSeconds = parseYTDurationToSeconds(it.contentDetails.duration);
    const thumb = it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || "";
    out[it.id] = {
      id: it.id,
      title: it.snippet.title,
      description: it.snippet.description,
      durationSeconds,
      thumbnailUrl: thumb,
      channelTitle: it.snippet.channelTitle,
    };
  }
  return out;
}

export async function searchKaraoke({ apiKey, q, maxResults = 25, regionCode = "US" }: SearchParams): Promise<KaraokeVideo[]> {
  const query = q.toLowerCase().includes("karaoke") ? q : `${q} karaoke`;
  const url = `${YT_API_BASE}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&order=relevance&regionCode=${encodeURIComponent(regionCode)}&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
  type Resp = {
    items: Array<{
      id: { videoId: string };
      snippet: { title: string; description?: string; liveBroadcastContent?: string };
    }>
  };
  const data = await fetchJSON<Resp>(url);
  const ids = data.items
    .filter((it) => it.id?.videoId)
    .filter((it) => (it.snippet.liveBroadcastContent || "none") !== "live")
    .filter((it) => {
      const t = (it.snippet.title || "").toLowerCase();
      const d = (it.snippet.description || "").toLowerCase();
      return t.includes("karaoke") || d.includes("karaoke");
    })
    .map((it) => it.id.videoId);

  const details = await fetchVideoDetails(apiKey, ids);
  return ids.map((id) => details[id]).filter(Boolean);
}

export async function getTrendingKaraoke({ apiKey, maxResults = 12, regionCode = "US" }: TrendingParams): Promise<KaraokeVideo[]> {
  // Approximate "trending" by using viewCount order on karaoke query
  const url = `${YT_API_BASE}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&order=viewCount&regionCode=${encodeURIComponent(regionCode)}&q=karaoke&key=${encodeURIComponent(apiKey)}`;
  type Resp = {
    items: Array<{
      id: { videoId: string };
      snippet: { title: string; description?: string; liveBroadcastContent?: string };
    }>
  };
  const data = await fetchJSON<Resp>(url);
  const ids = data.items
    .filter((it) => it.id?.videoId)
    .filter((it) => (it.snippet.liveBroadcastContent || "none") !== "live")
    .filter((it) => {
      const t = (it.snippet.title || "").toLowerCase();
      const d = (it.snippet.description || "").toLowerCase();
      return t.includes("karaoke") || d.includes("karaoke");
    })
    .map((it) => it.id.videoId);

  const details = await fetchVideoDetails(apiKey, ids);
  return ids.map((id) => details[id]).filter(Boolean);
}
