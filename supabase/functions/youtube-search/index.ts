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
    const qRaw = String(body.q || '').slice(0, 200);
    const max = Math.max(1, Math.min(Number(body.maxResults) || 24, 50));
    const regionCode = String(body.regionCode || defaultRegion || 'US').toUpperCase().slice(0, 2);

    if (!qRaw.trim()) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const query = qRaw.toLowerCase().includes('karaoke') ? qRaw : `${qRaw} karaoke`;

    const searchUrl = `${YT_API_BASE}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${max}&order=relevance&regionCode=${encodeURIComponent(regionCode)}&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;

    type SearchResp = {
      items: Array<{
        id: { videoId: string };
        snippet: { title: string; description?: string; liveBroadcastContent?: string };
      }>;
    };

    const searchData = await fetchJSON<SearchResp>(searchUrl);

    const ids = (searchData.items || [])
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
    const videosUrl = `${YT_API_BASE}/videos?part=snippet,contentDetails&id=${encodeURIComponent(idParam)}&key=${encodeURIComponent(apiKey)}`;

    type VideosResp = {
      items: Array<{
        id: string;
        snippet: { title: string; description?: string; thumbnails?: any; channelTitle?: string; categoryId?: string };
        contentDetails: { duration: string };
      }>;
    };

    const videosData = await fetchJSON<VideosResp>(videosUrl);

    const items = (videosData.items || []).map((it) => {
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
    });

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('youtube-search error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
