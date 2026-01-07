import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    let authResult;
    if (action === 'signin') {
      authResult = await supabaseClient.auth.signInWithPassword({ email, password });
    } else {
      authResult = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: fullName ? { full_name: fullName } : undefined },
      });
    }

    return new Response(
      JSON.stringify(authResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: authResult.error ? 400 : 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
