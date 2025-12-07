
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept both GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    console.log(`Method ${req.method} not allowed`);
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST']
    }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication - require admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create client with user's token to verify their identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Starting to fetch newsletter recipients...');
    
    // Fetch all users from auth.users using admin listUsers
    const { data: authUsersResponse, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      throw authUsersError;
    }

    const authUsers = authUsersResponse?.users || [];
    console.log(`Found ${authUsers.length} auth users`);

    // Fetch all profiles to get additional user info
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, display_name, username');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Don't throw error for profiles as they might not exist for all users
    }

    // Create a map of profiles for quick lookup
    const profilesMap = new Map();
    if (profiles) {
      profiles.forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });
    }

    // Combine auth users with profile data
    const recipients = authUsers.map((authUser: any) => {
      const userProfile = profilesMap.get(authUser.id);
      
      // Get the best available name from various sources
      const fullName = userProfile?.full_name || 
                      userProfile?.display_name || 
                      userProfile?.username ||
                      authUser.raw_user_meta_data?.full_name || 
                      authUser.raw_user_meta_data?.display_name || 
                      authUser.raw_user_meta_data?.username || 
                      authUser.raw_user_meta_data?.name ||
                      'User';

      return {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        role: authUser.raw_user_meta_data?.role || userProfile?.role || 'user'
      };
    });

    console.log(`Returning ${recipients.length} recipients`);

    return new Response(JSON.stringify({
      recipients,
      total_count: recipients.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Get recipients error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch newsletter recipients'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
