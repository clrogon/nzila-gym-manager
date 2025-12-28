import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  email: string;
  password: string;
  action: 'signin' | 'signup';
  fullName?: string;
}

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

    const { email, password, action, fullName }: AuthRequest = await req.json();

    if (!email || !password || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';

    console.log(`Auth attempt: ${action} for ${email} from IP ${clientIp}`);

    // Check rate limit by IP
    const { data: ipRateLimit, error: ipError } = await supabaseClient.rpc(
      'check_auth_rate_limit',
      { p_identifier: clientIp, p_identifier_type: 'ip' }
    );

    if (ipError) {
      console.error('IP rate limit check error:', ipError);
    }

    if (ipRateLimit && !ipRateLimit.allowed) {
      console.log(`IP rate limited: ${clientIp}`);
      return new Response(
        JSON.stringify({
          error: 'Too many attempts from this location',
          ...ipRateLimit
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limit by email
    const { data: emailRateLimit, error: emailError } = await supabaseClient.rpc(
      'check_auth_rate_limit',
      { p_identifier: email.toLowerCase(), p_identifier_type: 'email' }
    );

    if (emailError) {
      console.error('Email rate limit check error:', emailError);
    }

    if (emailRateLimit && !emailRateLimit.allowed) {
      console.log(`Email rate limited: ${email}`);
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
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "signin" or "signup"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If successful, reset rate limits
    if (!authResult.error) {
      console.log(`Auth success: ${action} for ${email}`);
      
      await supabaseClient.rpc('reset_auth_rate_limit', {
        p_identifier: clientIp,
        p_identifier_type: 'ip'
      });
      await supabaseClient.rpc('reset_auth_rate_limit', {
        p_identifier: email.toLowerCase(),
        p_identifier_type: 'email'
      });
    } else {
      console.log(`Auth failed: ${action} for ${email} - ${authResult.error.message}`);
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
    console.error('Auth edge function error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
