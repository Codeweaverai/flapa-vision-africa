import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  userId?: string;
  userIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();
    console.log('Received notification request:', payload);

    const { title, body, icon, badge, data, userId, userIds } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions from database
    let query = supabaseClient.from('push_subscriptions').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription: PushSubscription = sub.subscription as PushSubscription;
          
          const notificationData = {
            title,
            body,
            icon: icon || '/lovable-uploads/logoskillpulse.png',
            badge: badge || '/lovable-uploads/logoskillpulse.png',
            data: data || {},
          };

          // Use Web Push Protocol
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
            },
            body: JSON.stringify(notificationData),
          });

          if (!response.ok) {
            console.error(`Failed to send to ${sub.user_id}:`, response.status);
            
            // Remove invalid subscriptions
            if (response.status === 410 || response.status === 404) {
              await supabaseClient
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);
              console.log(`Removed invalid subscription for user ${sub.user_id}`);
            }
            
            return { success: false, userId: sub.user_id };
          }

          return { success: true, userId: sub.user_id };
        } catch (error) {
          console.error(`Error sending to ${sub.user_id}:`, error);
          return { success: false, userId: sub.user_id, error };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.length - successCount;

    console.log(`Sent ${successCount} notifications, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        sent: successCount,
        failed: failCount,
        total: results.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
