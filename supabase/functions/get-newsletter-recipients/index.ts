
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
    // Fetch all users from auth
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    const users = authUsers?.users || [];
    
    // Format user data for frontend
    const recipients = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      full_name: user.raw_user_meta_data?.full_name || 
                user.raw_user_meta_data?.display_name || 
                user.raw_user_meta_data?.username || 
                'User',
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at
    }));

    return new Response(JSON.stringify({
      recipients,
      total_count: users.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Get recipients error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
