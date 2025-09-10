import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Public endpoint: no auth required (read-only global settings)
    // NOTE: Key is used server-side in functions where possible to reduce exposure


    // Fetch global settings using admin client
    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .select('key, value')
      .in('key', ['youtube_apiKey', 'youtube_regionCode']);

    if (error) {
      console.error('Error fetching global settings:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format the response without exposing the API key
    const settings: { hasApi?: boolean; regionCode?: string } = {};
    data?.forEach(setting => {
      if (setting.key === 'youtube_apiKey') {
        const v = (setting.value as any)?.value;
        if (v && String(v).length > 0) settings.hasApi = true;
      } else if (setting.key === 'youtube_regionCode') {
        settings.regionCode = (setting.value as any)?.value || 'US';
      }
    });

    return new Response(JSON.stringify({ settings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-global-settings function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});