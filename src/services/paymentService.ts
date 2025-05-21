import { supabase } from '@/lib/supabaseClient';
import { PaymentTransaction, PayoutTransaction, CreatorBalance } from '@/types/paymentTypes';
import { toast } from '@/components/ui/use-toast';

export async function fetchCreatorPayments(userId: string): Promise<PaymentTransaction[]> {
  try {
    // Use a simpler query approach to avoid excessive type instantiation
    const { data, error } = await supabase
      .from('payment_transactions')
      .select()
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    // Process the data to ensure all required fields are present
    const formattedData: PaymentTransaction[] = data.map(payment => {
      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference_type: payment.reference_type,
        reference_id: payment.reference_id,
        created_at: payment.created_at,
        // Use optional property access with default value
        payment_method: typeof payment === 'object' && 'payment_method' in payment ? 
                        String(payment.payment_method) : 'unknown',
        user_id: payment.user_id,
        creator_id: payment.creator_id,
        provider: payment.provider,
        provider_transaction_id: payment.provider_transaction_id,
        metadata: payment.metadata,
        // Since we're no longer joining with user profiles, set a default display name
        user_email: 'unknown'
      };
    });
    
    // If we need user display names, fetch them separately to avoid deep typing issues
    if (formattedData.length > 0) {
      // Get unique user IDs
      const userIds = [...new Set(formattedData.map(p => p.user_id))];
      
      // Fetch user profiles separately - we need to handle the case where the profile might not have all fields
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', userIds);
        
      // Create a map of userId to display name (using username or full_name)
      const userDisplayMap = new Map();
      if (userProfiles) {
        userProfiles.forEach(profile => {
          // Use username or full_name or 'unknown' as the display identifier
          const displayName = profile.username || profile.full_name || 'unknown';
          userDisplayMap.set(profile.id, displayName);
        });
        
        // Update transactions with user display names (as email)
        formattedData.forEach(transaction => {
          const displayName = userDisplayMap.get(transaction.user_id);
          if (displayName) {
            transaction.user_email = displayName;
          }
        });
      }
    }
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching creator payments:', error);
    throw error;
  }
}

export async function fetchCreatorPayouts(userId: string): Promise<PayoutTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching creator payouts:', error);
    throw error;
  }
}

export async function calculateCreatorBalance(userId: string): Promise<CreatorBalance> {
  try {
    // Calculate completed payments
    const { data: completedPayments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('creator_id', userId)
      .eq('status', 'completed');
      
    if (paymentsError) throw paymentsError;
    
    // Calculate completed payouts
    const { data: completedPayouts, error: payoutsError } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', userId)
      .eq('status', 'completed');
      
    if (payoutsError) throw payoutsError;
    
    // Calculate pending payments
    const { data: pendingPayments, error: pendingError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('creator_id', userId)
      .eq('status', 'pending');
      
    if (pendingError) throw pendingError;
    
    const totalPayments = completedPayments?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalPayouts = completedPayouts?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const pendingAmount = pendingPayments?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    
    return {
      available: totalPayments - totalPayouts,
      pending: pendingAmount,
      currency: 'USD'
    };
  } catch (error) {
    console.error('Error calculating balance:', error);
    throw error;
  }
}

export async function requestPayout(
  userId: string, 
  amount: number, 
  currency: string, 
  method: string,
  destination: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id: userId,
        amount,
        currency,
        method,
        destination,
        status: 'pending'
      })
      .select();
      
    if (error) throw error;
    
    toast({
      title: "Withdrawal Requested",
      description: `Your withdrawal of ${currency} ${amount.toFixed(2)} has been requested`,
    });
    
    return true;
  } catch (error) {
    console.error('Error requesting payout:', error);
    toast({
      title: "Withdrawal Error",
      description: "Failed to process your withdrawal request",
      variant: "destructive"
    });
    return false;
  }
}

export async function connectStripeAccount(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
      body: { userId }
    });
    
    if (error) {
      console.error('Stripe connect error:', error);
      throw new Error(`Failed to initialize Stripe Connect: ${error.message}`);
    }
    
    if (!data?.url) {
      throw new Error('No Stripe Connect URL returned');
    }
    
    return data.url;
  } catch (error) {
    console.error('Error connecting Stripe account:', error);
    toast({
      title: "Connection Error",
      description: "Failed to initialize Stripe Connect account setup. Please ensure you have Stripe Connect enabled for your account.",
      variant: "destructive"
    });
    return null;
  }
}

// New function to check Stripe account status
export async function getStripeAccountStatus(userId: string): Promise<{ isConnected: boolean, accountId?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_connect_id')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return { 
      isConnected: !!data?.stripe_connect_id, 
      accountId: data?.stripe_connect_id
    };
  } catch (error) {
    console.error('Error checking Stripe account status:', error);
    return { isConnected: false };
  }
}

// New function to handle Stripe webhooks for payment updates
export async function processStripeWebhook(event: any): Promise<boolean> {
  try {
    const eventType = event.type;
    const eventData = event.data.object;
    
    console.log(`Processing Stripe webhook: ${eventType}`);
    
    switch (eventType) {
      case 'checkout.session.completed':
        return await updatePaymentFromCheckoutSession(eventData);
      
      case 'payment_intent.succeeded':
        return await updatePaymentFromPaymentIntent(eventData, 'completed');
      
      case 'payment_intent.payment_failed':
        return await updatePaymentFromPaymentIntent(eventData, 'failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return false;
  }
}

// Helper function to update payment based on checkout session
async function updatePaymentFromCheckoutSession(session: any): Promise<boolean> {
  try {
    if (!session.id) return false;
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({ 
        status: session.payment_status === 'paid' ? 'completed' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('provider_transaction_id', session.id)
      .select();
      
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error updating payment from checkout session:', error);
    return false;
  }
}

// Helper function to update payment based on payment intent
async function updatePaymentFromPaymentIntent(paymentIntent: any, status: string): Promise<boolean> {
  try {
    if (!paymentIntent.id) return false;
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('provider_transaction_id', paymentIntent.id)
      .select();
      
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error updating payment to ${status}:`, error);
    return false;
  }
}

export const getStripeUserInfo = async (userId: string) => {
  try {
    // Get the user profile data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    // Get the user email from auth.users table separately
    const { data: authUserData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) throw authError;
    
    // Combine the data
    return {
      id: userData?.id || userId,
      email: authUserData?.user?.email || 'no-email@example.com',
      username: userData?.username || 'user',
      full_name: userData?.full_name || 'Anonymous User'
    };
  } catch (error) {
    console.error('Error getting user data for Stripe:', error);
    return {
      id: userId,
      email: 'no-email@example.com',
      username: 'user',
      full_name: 'Anonymous User'
    };
  }
};
