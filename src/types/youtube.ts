export interface KaraokeVideo {
  id: string;
  title: string;
  description?: string;
  durationSeconds: number;
  thumbnailUrl: string;
  channelTitle?: string;
  categoryId?: string;
}

export interface SearchParams {
  q: string;
  maxResults?: number;
  regionCode?: string;
}

export interface TrendingParams {
  maxResults?: number;
  regionCode?: string;
}

