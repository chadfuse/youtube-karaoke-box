import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

function parseYTDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

async function getGlobalYouTubeConfig(supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin
    .from('global_settings')
    .select('key, value')
    .in('key', ['youtube_apiKey', 'youtube_regionCode']);

  if (error) throw error;

  let apiKey = '';
  let regionCode = 'US';
  for (const row of data || []) {
    if (row.key === 'youtube_apiKey') apiKey = (row.value as any)?.value || '';
    if (row.key === 'youtube_regionCode') regionCode = (row.value as any)?.value || 'US';
  }
  if (!apiKey) throw new Error('YouTube API key not configured');
  return { apiKey, regionCode };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { apiKey, regionCode: defaultRegion } = await getGlobalYouTubeConfig(supabaseAdmin);

    const body = await req.json().catch(() => ({}));
    const max = Math.max(1, Math.min(Number(body.maxResults) || 12, 50));
    const regionCode = String(body.regionCode || defaultRegion || 'US').toUpperCase().slice(0, 2);

    // Fetch popular videos in region, then filter for karaoke
    const fetchCount = Math.min(50, Math.max(max * 4, max));
    const url = `${YT_API_BASE}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${fetchCount}&order=viewCount&regionCode=${encodeURIComponent(regionCode)}&q=${encodeURIComponent('top karaoke songs english')}&key=${encodeURIComponent(apiKey)}`;

    type SearchResp = {
      items: Array<{
        id: { videoId: string };
        snippet: { title: string; description?: string; liveBroadcastContent?: string };
      }>;
    };

    const data = await fetchJSON<SearchResp>(url);

    const ids = (data.items || [])
      .filter((it) => it.id?.videoId)
      .filter((it) => (it.snippet.liveBroadcastContent || 'none') !== 'live')
      .filter((it) => {
        const t = (it.snippet.title || '').toLowerCase();
        const d = (it.snippet.description || '').toLowerCase();
        return t.includes('karaoke') || d.includes('karaoke');
      })
      .map((it) => it.id.videoId);

    if (ids.length === 0) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const idParam = ids.join(',');
    const detailsUrl = `${YT_API_BASE}/videos?part=snippet,contentDetails&id=${encodeURIComponent(idParam)}&key=${encodeURIComponent(apiKey)}`;

    type VideosResp = {
      items: Array<{
        id: string;
        snippet: { title: string; description?: string; thumbnails?: any; channelTitle?: string; categoryId?: string };
        contentDetails: { duration: string };
      }>;
    };

    const details = await fetchJSON<VideosResp>(detailsUrl);

    const banned = /(challenge|#shorts|shorts|pov|vlog|prank|episode|ranking|react|compilation|funny)/i;

    const items = (details.items || [])
      .map((it) => {
        const durationSeconds = parseYTDurationToSeconds(it.contentDetails.duration);
        const thumb = it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || '';
        return {
          id: it.id,
          title: it.snippet.title,
          description: it.snippet.description,
          durationSeconds,
          thumbnailUrl: thumb,
          channelTitle: it.snippet.channelTitle,
          categoryId: it.snippet.categoryId,
        };
      })
      .filter((v) => v.durationSeconds >= 120 && v.durationSeconds <= 600)
      .filter((v) => (v.categoryId || '') === '10')
      .filter((v) => {
        const t = (v.title || '').toLowerCase();
        const d = (v.description || '').toLowerCase();
        return !banned.test(t) && !banned.test(d);
      })
      .slice(0, max);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('youtube-trending error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
