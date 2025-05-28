
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export interface CreatorBalance {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
}

export interface PaymentBreakdown {
  course_revenue: number;
  event_revenue: number;
  platform_fees: number;
  net_earnings: number;
}

export async function fetchEnhancedCreatorBalance(userId: string): Promise<CreatorBalance> {
  try {
    const { data, error } = await supabase.rpc('calculate_creator_balance', {
      creator_user_id: userId
    });

    if (error) throw error;

    return data[0] || {
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_platform_fees: 0
    };
  } catch (error) {
    console.error('Error fetching enhanced creator balance:', error);
    throw error;
  }
}

export async function fetchPaymentBreakdown(userId: string): Promise<PaymentBreakdown> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', userId)
      .eq('status', 'completed');

    if (error) throw error;

    let course_revenue = 0;
    let event_revenue = 0;
    let platform_fees = 0;

    data?.forEach(transaction => {
      const amount = Number(transaction.creator_earning || 0);
      const fee = Number(transaction.platform_fee_amount || 0);
      
      if (transaction.reference_type === 'course') {
        course_revenue += amount;
      } else if (transaction.reference_type === 'event') {
        event_revenue += amount;
      }
      platform_fees += fee;
    });

    return {
      course_revenue,
      event_revenue,
      platform_fees,
      net_earnings: course_revenue + event_revenue
    };
  } catch (error) {
    console.error('Error fetching payment breakdown:', error);
    throw error;
  }
}

export async function requestEnhancedPayout(
  userId: string,
  amount: number,
  currency: string = 'USD'
): Promise<boolean> {
  try {
    // Check minimum threshold
    if (amount < 5) {
      toast({
        title: "Minimum Threshold Not Met",
        description: "Minimum payout amount is $5.00",
        variant: "destructive"
      });
      return false;
    }

    // Check available balance
    const balance = await fetchEnhancedCreatorBalance(userId);
    if (amount > balance.available_balance) {
      toast({
        title: "Insufficient Balance",
        description: "Requested amount exceeds available balance",
        variant: "destructive"
      });
      return false;
    }

    const { data, error } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id: userId,
        amount,
        currency: currency.toLowerCase(),
        method: 'stripe',
        destination: 'Stripe Connect Account',
        status: 'pending',
        minimum_threshold_met: true
      })
      .select();

    if (error) throw error;

    toast({
      title: "Payout Requested",
      description: `Your payout of ${currency} ${amount.toFixed(2)} has been requested`,
    });

    return true;
  } catch (error) {
    console.error('Error requesting payout:', error);
    toast({
      title: "Payout Error",
      description: "Failed to process your payout request",
      variant: "destructive"
    });
    return false;
  }
}

export async function createStripeCheckoutSession(
  referenceType: 'course' | 'event',
  referenceId: string,
  amount: number,
  currency: string = 'USD',
  title: string,
  creatorId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
      body: {
        referenceType,
        referenceId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        title,
        creatorId,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      }
    });

    if (error) throw error;

    return data?.url || null;
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    toast({
      title: "Payment Error",
      description: "Failed to initialize payment. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}

export async function processPaymentCompletion(
  sessionId: string,
  userId: string,
  referenceType: 'course' | 'event',
  referenceId: string,
  amount: number,
  creatorId?: string
): Promise<boolean> {
  try {
    // Create payment transaction record
    const platformFee = amount * 0.08;
    const creatorEarning = amount * 0.92;
    const payoutEligibleDate = new Date();
    payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        creator_id: creatorId,
        reference_type: referenceType,
        reference_id: referenceId,
        amount,
        currency: 'usd',
        status: 'completed',
        provider: 'stripe',
        stripe_session_id: sessionId,
        platform_fee_amount: platformFee,
        creator_earning: creatorEarning,
        payout_eligible_date: payoutEligibleDate.toISOString()
      })
      .select();

    if (paymentError) throw paymentError;

    // Create enrollment or booking record
    if (referenceType === 'course') {
      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_id: referenceId,
          payment_status: 'completed',
          payment_id: paymentData[0].id
        });

      if (enrollmentError) throw enrollmentError;
    } else if (referenceType === 'event') {
      const { error: bookingError } = await supabase
        .from('event_bookings')
        .insert({
          user_id: userId,
          event_id: referenceId,
          payment_status: 'completed',
          status: 'confirmed',
          payment_amount: amount,
          payment_currency: 'USD',
          payment_id: paymentData[0].id
        });

      if (bookingError) throw bookingError;
    }

    return true;
  } catch (error) {
    console.error('Error processing payment completion:', error);
    return false;
  }
}
