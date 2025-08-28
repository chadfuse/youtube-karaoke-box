import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

/**
 * Edge Function to add security headers to responses
 * This function can be used as middleware to enhance security
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Security headers for enhanced protection
    const securityHeaders = {
      // Content Security Policy - restrict resource loading
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://eyetltsnrajukzrxmtbt.supabase.co https://www.googleapis.com https://youtube.googleapis.com",
        "frame-src 'self' https://www.youtube.com https://youtube.com",
        "media-src 'self' https: blob:",
      ].join('; '),
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // XSS Protection (legacy but still good to have)
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      
      // Strict Transport Security (if served over HTTPS)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // CORS headers
      ...corsHeaders
    }

    // You can add logic here to proxy requests or return security information
    const response = {
      message: 'Security headers applied',
      timestamp: new Date().toISOString(),
      headers: Object.keys(securityHeaders)
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders,
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
        status: 400,
      },
    )
  }
})