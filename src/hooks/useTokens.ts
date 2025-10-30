// hooks/useTokens.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface TokenBalance {
  id: string;
  user_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  free_tokens_used: number;
  free_tokens_available: number;
  has_used_free_trial: boolean;
  created_at: string;
  updated_at: string;
}

interface TopUpConfig {
  id: string;
  min_amount: number;
  max_amount: number;
  default_amounts: number[];
  token_price: number;
}

interface TokenTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  amount_paid?: number;
  token_price?: number;
  reference_id?: string;
  created_at: string;
}

interface DeductTokensResult {
  success: boolean;
  tokensUsed: number;
  wasFree: boolean;
  remainingTokens: number;
}

export const useTokens = () => {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [topUpConfig, setTopUpConfig] = useState<TopUpConfig | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch token balance - use upsert instead of separate insert
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      if (!balanceData) {
        // Use upsert to handle the case where record might already exist
        const { data: newBalance, error: upsertError } = await supabase
          .from('user_tokens')
          .upsert({ 
            user_id: user.id, 
            balance: 0,
            free_tokens_available: 30,
            free_tokens_used: 0,
            has_used_free_trial: false
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (upsertError) {
          // If upsert fails, try to fetch again in case record was created by another process
          const { data: retryData, error: retryError } = await supabase
            .from('user_tokens')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (retryError) throw retryError;
          setTokenBalance(retryData);
        } else {
          setTokenBalance(newBalance);
        }
      } else {
        setTokenBalance(balanceData);
      }

      // Fetch top-up config with fallback
      const { data: configData, error: configError } = await supabase
        .from('top_up_config')
        .select('*')
        .single();

      if (configError) {
        console.warn('Top-up config not found, using defaults');
        setTopUpConfig({
          id: 'default',
          min_amount: 10,
          max_amount: 1000,
          default_amounts: [50, 100, 200, 500],
          token_price: 0.01
        });
      } else {
        setTopUpConfig(configData);
      }

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) {
        console.warn('Error fetching transactions:', transactionsError);
        setTransactions([]);
      } else {
        setTransactions(transactionsData || []);
      }

    } catch (error: any) {
      console.error('Error fetching token data:', error);
      
      // Don't show toast for common errors
      if (!error.message?.includes('duplicate key') && !error.message?.includes('PGRST116')) {
        toast.error('Failed to load token data');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const hasEnoughTokens = useCallback((requiredTokens: number): boolean => {
    if (!tokenBalance) return false;
    
    // Check free tokens first
    if (tokenBalance.free_tokens_available >= requiredTokens && !tokenBalance.has_used_free_trial) {
      return true;
    }
    
    // Then check paid tokens
    return tokenBalance.balance >= requiredTokens;
  }, [tokenBalance]);

  const getAvailableTokens = useCallback((): { free: number; paid: number } => {
    if (!tokenBalance) return { free: 0, paid: 0 };
    
    return {
      free: tokenBalance.free_tokens_available,
      paid: tokenBalance.balance
    };
  }, [tokenBalance]);

  const hasFreeTokensAvailable = useCallback((): boolean => {
    if (!tokenBalance) return false;
    return tokenBalance.free_tokens_available > 0 && !tokenBalance.has_used_free_trial;
  }, [tokenBalance]);

  const calculatePrice = useCallback((tokenAmount: number): number => {
    if (!topUpConfig) return 0;
    return Number((tokenAmount * topUpConfig.token_price).toFixed(2));
  }, [topUpConfig]);

  const calculateTokens = useCallback((price: number): number => {
    if (!topUpConfig) return 0;
    return Math.floor(price / topUpConfig.token_price);
  }, [topUpConfig]);

  const topUpTokens = useCallback(async (tokenAmount: number, amountPaid: number) => {
    if (!user) throw new Error('User not authenticated');
    if (!topUpConfig) throw new Error('Top-up configuration not loaded');

    // Validate amount
    if (tokenAmount < topUpConfig.min_amount) {
      throw new Error(`Minimum top-up amount is ${topUpConfig.min_amount} tokens`);
    }

    if (tokenAmount > topUpConfig.max_amount) {
      throw new Error(`Maximum top-up amount is ${topUpConfig.max_amount} tokens`);
    }

    try {
      // Record transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('token_transactions')
        .insert([{
          user_id: user.id,
          amount: tokenAmount,
          amount_paid: amountPaid,
          token_price: topUpConfig.token_price,
          type: 'purchase',
          description: `Top-up of ${tokenAmount} tokens`,
          reference_id: `topup_${Date.now()}`
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update user token balance using upsert to handle conflicts
      const { error: updateError } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: user.id,
          balance: (tokenBalance?.balance || 0) + tokenAmount,
          total_purchased: (tokenBalance?.total_purchased || 0) + tokenAmount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      // Update local state
      setTokenBalance(prev => prev ? {
        ...prev,
        balance: prev.balance + tokenAmount,
        total_purchased: prev.total_purchased + tokenAmount
      } : null);

      // Add to transactions
      setTransactions(prev => [transaction, ...prev]);

      return { success: true, tokensAdded: tokenAmount, amountPaid };
    } catch (error: any) {
      console.error('Error topping up tokens:', error);
      throw error;
    }
  }, [user, topUpConfig, tokenBalance]);

  const deductTokens = useCallback(async (featureType: string, referenceId?: string): Promise<DeductTokensResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get token cost for this feature with fallback
      let tokenCost = 0;
      let description = `Usage of ${featureType}`;
      
      try {
        const { data: costData, error: costError } = await supabase
          .from('ai_usage_costs')
          .select('token_cost, description')
          .eq('feature_type', featureType)
          .eq('is_active', true)
          .single();

        if (costError) {
          // Use default costs if table doesn't exist or record not found
          const defaultCosts: { [key: string]: number } = {
            'course_proposal': 8,
            'full_course': 25,
            'lesson_content': 5,
            'quiz_generation': 3,
            'exam_generation': 5
          };
          tokenCost = defaultCosts[featureType] || 10;
          description = `AI feature: ${featureType}`;
        } else {
          tokenCost = costData.token_cost;
          description = costData.description;
        }
      } catch (costLookupError) {
        console.warn('Failed to lookup feature cost, using defaults:', costLookupError);
        tokenCost = featureType === 'course_proposal' ? 8 : 25;
      }

      // Check if user has enough tokens
      if (!hasEnoughTokens(tokenCost)) {
        const available = getAvailableTokens();
        throw new Error(`Insufficient tokens. Required: ${tokenCost}, Available Free: ${available.free}, Available Paid: ${available.paid}`);
      }

      // Determine if using free or paid tokens
      const useFreeTokens = tokenBalance?.free_tokens_available >= tokenCost && !tokenBalance?.has_used_free_trial;
      const transactionType = useFreeTokens ? 'free_usage' : 'usage';

      // Record transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('token_transactions')
        .insert([{
          user_id: user.id,
          amount: -tokenCost,
          type: transactionType,
          description: description,
          reference_id: referenceId
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update user token balance using upsert
      const updateData: any = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (useFreeTokens) {
        updateData.free_tokens_available = (tokenBalance?.free_tokens_available || 0) - tokenCost;
        updateData.free_tokens_used = (tokenBalance?.free_tokens_used || 0) + tokenCost;
        updateData.has_used_free_trial = true;
      } else {
        updateData.balance = (tokenBalance?.balance || 0) - tokenCost;
        updateData.total_used = (tokenBalance?.total_used || 0) + tokenCost;
      }

      const { error: updateError } = await supabase
        .from('user_tokens')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      // Update local state
      setTokenBalance(prev => {
        if (!prev) return null;
        
        if (useFreeTokens) {
          return {
            ...prev,
            free_tokens_available: prev.free_tokens_available - tokenCost,
            free_tokens_used: prev.free_tokens_used + tokenCost,
            has_used_free_trial: true
          };
        } else {
          return {
            ...prev,
            balance: prev.balance - tokenCost,
            total_used: prev.total_used + tokenCost
          };
        }
      });

      // Add to transactions
      setTransactions(prev => [transaction, ...prev]);

      return { 
        success: true, 
        tokensUsed: tokenCost, 
        wasFree: useFreeTokens,
        remainingTokens: useFreeTokens ? 
          (tokenBalance?.free_tokens_available || 0) - tokenCost : 
          (tokenBalance?.balance || 0) - tokenCost
      };
    } catch (error: any) {
      console.error('Error deducting tokens:', error);
      throw error;
    }
  }, [user, tokenBalance, hasEnoughTokens, getAvailableTokens]);

  const getFeatureCost = useCallback(async (featureType: string): Promise<number> => {
    try {
      const { data: costData, error } = await supabase
        .from('ai_usage_costs')
        .select('token_cost')
        .eq('feature_type', featureType)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn(`Feature cost not found for ${featureType}, using default`);
        // Return default costs for common features
        const defaultCosts: { [key: string]: number } = {
          'course_proposal': 8,
          'full_course': 25,
          'lesson_content': 5,
          'quiz_generation': 3,
          'exam_generation': 5
        };
        return defaultCosts[featureType] || 10;
      }
      return costData.token_cost;
    } catch (error) {
      console.error('Error getting feature cost:', error);
      // Return safe default
      return featureType === 'course_proposal' ? 8 : 25;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tokenBalance,
    topUpConfig,
    transactions,
    loading,
    hasEnoughTokens,
    getAvailableTokens,
    hasFreeTokensAvailable,
    topUpTokens,
    deductTokens,
    calculatePrice,
    calculateTokens,
    getFeatureCost,
    refetch: fetchData
  };
};

export type { DeductTokensResult };
