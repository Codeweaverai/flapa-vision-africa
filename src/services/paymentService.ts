
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
        provider: payment.provider,
        provider_transaction_id: payment.provider_transaction_id,
        metadata: payment.metadata,
        // Since we're no longer joining with user profiles, set a default email
        user_email: 'unknown'
      };
    });
    
    // If we need user emails, fetch them separately to avoid deep typing issues
    if (formattedData.length > 0) {
      // Get unique user IDs
      const userIds = [...new Set(formattedData.map(p => p.user_id))];
      
      // Fetch user profiles separately
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
        
      // Create a map of userId to email
      const userEmailMap = new Map();
      if (userProfiles) {
        userProfiles.forEach(profile => {
          if (profile.email) {
            userEmailMap.set(profile.id, profile.email);
          }
        });
        
        // Update transactions with user emails
        formattedData.forEach(transaction => {
          const email = userEmailMap.get(transaction.user_id);
          if (email) {
            transaction.user_email = email;
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
    
    if (error) throw error;
    
    return data?.url || null;
  } catch (error) {
    console.error('Error connecting Stripe account:', error);
    toast({
      title: "Connection Error",
      description: "Failed to initialize Stripe Connect account setup",
      variant: "destructive"
    });
    return null;
  }
}
