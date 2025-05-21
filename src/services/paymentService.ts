
import { supabase } from '@/lib/supabaseClient';
import { PaymentTransaction, PayoutTransaction, CreatorBalance } from '@/types/paymentTypes';
import { toast } from '@/components/ui/use-toast';

export async function fetchCreatorPayments(userId: string): Promise<PaymentTransaction[]> {
  try {
    // First, check the actual columns in the payment_transactions table
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        amount,
        currency,
        status,
        reference_type,
        reference_id,
        created_at,
        user_id,
        provider,
        provider_transaction_id,
        metadata,
        profiles:user_id(email)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    // Process the data to include user email and ensure all required fields are present
    const formattedData: PaymentTransaction[] = data.map(payment => {
      // Safely extract user email from the profiles join
      let userEmail = 'unknown';
      
      if (payment.profiles) {
        if (typeof payment.profiles === 'object' && 
            payment.profiles !== null && 
            'email' in payment.profiles) {
          userEmail = String(payment.profiles.email);
        }
      }
      
      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference_type: payment.reference_type,
        reference_id: payment.reference_id,
        created_at: payment.created_at,
        // Since payment_method might not exist in the database, provide a default
        payment_method: 'unknown',
        user_id: payment.user_id,
        provider: payment.provider,
        provider_transaction_id: payment.provider_transaction_id,
        metadata: payment.metadata,
        user_email: userEmail
      };
    });
    
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
