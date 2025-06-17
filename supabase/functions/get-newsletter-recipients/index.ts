
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Fetch all users from auth.users using admin listUsers
    const { data: authUsersResponse, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    const authUsers = authUsersResponse?.users || [];
    console.log(`Found ${authUsers.length} auth users`);

    // Fetch all profiles to get additional user info
    const { data: profiles, error: profilesError } = await supabase
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
    const recipients = authUsers.map((user: any) => {
      const profile = profilesMap.get(user.id);
      
      // Get the best available name from various sources
      const fullName = profile?.full_name || 
                      profile?.display_name || 
                      profile?.username ||
                      user.raw_user_meta_data?.full_name || 
                      user.raw_user_meta_data?.display_name || 
                      user.raw_user_meta_data?.username || 
                      user.raw_user_meta_data?.name ||
                      'User';

      return {
        id: user.id,
        email: user.email,
        full_name: fullName,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        role: user.raw_user_meta_data?.role || profile?.role || 'user'
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
