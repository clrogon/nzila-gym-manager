import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, action } = await req.json();

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit by IP
    const { data: ipRateLimit } = await supabaseClient.rpc(
      'check_auth_rate_limit',
      { p_identifier: clientIp, p_identifier_type: 'ip' }
    );

    if (!ipRateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many attempts',
          ...ipRateLimit
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limit by email
    const { data: emailRateLimit } = await supabaseClient.rpc(
      'check_auth_rate_limit',
      { p_identifier: email.toLowerCase(), p_identifier_type: 'email' }
    );

    if (!emailRateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many attempts for this account',
          ...emailRateLimit
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Perform authentication
    let authResult;
    if (action === 'signin') {
      authResult = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
    } else if (action === 'signup') {
      authResult = await supabaseClient.auth.signUp({
        email,
        password,
      });
    } else {
      throw new Error('Invalid action');
    }

    // If successful, reset rate limits
    if (!authResult.error) {
      await supabaseClient.rpc('reset_auth_rate_limit', {
        p_identifier: clientIp,
        p_identifier_type: 'ip'
      });
      await supabaseClient.rpc('reset_auth_rate_limit', {
        p_identifier: email.toLowerCase(),
        p_identifier_type: 'email'
      });
    }

    return new Response(
      JSON.stringify(authResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: authResult.error ? 400 : 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
