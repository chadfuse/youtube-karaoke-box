export interface KaraokeVideo {
  id: string;
  title: string;
  description?: string;
  durationSeconds: number;
  thumbnailUrl: string;
  channelTitle?: string;
}

export interface SearchParams {
  apiKey: string;
  q: string;
  maxResults?: number;
  regionCode?: string;
}

export interface TrendingParams {
  apiKey: string;
  maxResults?: number;
  regionCode?: string;
}
