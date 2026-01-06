import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuperAdminConfig {
  email: string;
  password: string;
  fullName: string;
}

const DEFAULT_SUPER_ADMIN: SuperAdminConfig = {
  email: 'superadmin@gymflow.app',
  password: 'SuperAdmin@2026!',
  fullName: 'Platform Super Admin',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body for custom credentials (optional)
    let config = DEFAULT_SUPER_ADMIN;
    try {
      const body = await req.json();
      if (body.email) config.email = body.email;
      if (body.password) config.password = body.password;
      if (body.fullName) config.fullName = body.fullName;
    } catch {
      // Use defaults if no body provided
    }

    // Check if super admin already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const existingSuperAdmin = existingUser?.users?.find(
      (u) => u.email === config.email
    );

    if (existingSuperAdmin) {
      // Check if they already have super_admin role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', existingSuperAdmin.id)
        .eq('role', 'super_admin')
        .is('gym_id', null)
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Super admin already exists',
            user: {
              id: existingSuperAdmin.id,
              email: existingSuperAdmin.email,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Add super_admin role to existing user
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: existingSuperAdmin.id,
          role: 'super_admin',
          gym_id: null,
        });

      if (roleError) throw roleError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Super admin role added to existing user',
          user: {
            id: existingSuperAdmin.id,
            email: existingSuperAdmin.email,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create new super admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: {
        full_name: config.fullName,
      },
    });

    if (createError) throw createError;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: config.email,
        full_name: config.fullName,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Assign super_admin role with NULL gym_id (platform-wide access)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'super_admin',
        gym_id: null,
      });

    if (roleError) throw roleError;

    console.log('Super admin created successfully:', newUser.user.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Super admin created successfully',
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
        credentials: {
          email: config.email,
          password: config.password,
          note: 'Please change this password immediately after first login!',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating super admin:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
