import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Calendar, DollarSign, CreditCard, Download, AlertCircle, ExternalLink, TrendingUp, Minus, Settings, Smartphone, ChevronLeft, ChevronRight, Building2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  fetchCreatorPayouts,
  fetchCreatorEarnings,
  fetchCreatorPaymentTransactions
} from '@/services/creatorPaymentService';
import { 
  getCreatorPayoutMethod
} from '@/services/creatorEarningsService';
import EnhancedWithdrawDialog from '@/components/creator/EnhancedWithdrawDialog';
import PayoutMethodSetupDialog from '@/components/creator/PayoutMethodSetupDialog';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 5;

// Bank Transfer Status Tracker Component
const BankTransferStatusTracker: React.FC<{ payout: any; onStatusUpdate: () => void }> = ({ payout, onStatusUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(payout.status);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!payout.external_reference || currentStatus !== 'processing') return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Checking transfer status for:', payout.external_reference);
      
      const { data, error } = await supabase.functions.invoke('check-transfer-status', {
        body: { reference: payout.external_reference }
      });

      console.log('📊 Status check response:', data);

      if (error) {
        console.error('❌ Status check error:', error);
        setError(error.message);
        return;
      }

      if (data.success) {
        // Find the result for this specific payout
        const result = data.results?.find((r: any) => r.reference === payout.external_reference);
        
        if (result) {
          const lencoStatus = result.lenco_status;
          let newStatus = payout.status;
          
          if (lencoStatus === 'successful' || lencoStatus === 'completed') {
            newStatus = 'completed';
          } else if (lencoStatus === 'failed' || lencoStatus === 'rejected') {
            newStatus = 'failed';
          }
          
          console.log(`🔄 Status update: ${currentStatus} -> ${newStatus} (Lenco: ${lencoStatus})`);
          
          setCurrentStatus(newStatus);
          setLastChecked(new Date());
          
          // Trigger parent to reload payouts if status changed
          if (newStatus !== payout.status) {
            console.log(`✅ Status changed for payout ${payout.id}: ${payout.status} -> ${newStatus}`);
            onStatusUpdate();
          }
        }
      }
    } catch (err) {
      console.error('💥 Error checking transfer status:', err);
      setError('Failed to check status');
    } finally {
      setLoading(false);
    }
  }, [payout.external_reference, payout.status, payout.id, currentStatus, onStatusUpdate]);

  useEffect(() => {
    // Only auto-check if status is processing
    if (currentStatus === 'processing') {
      // Check immediately
      checkStatus();
      
      // Then check every 2 minutes
      const interval = setInterval(checkStatus, 120000);
      return () => clearInterval(interval);
    }
  }, [checkStatus, currentStatus]);

  const getStatusDisplay = () => {
    switch (currentStatus) {
      case 'completed':
        return {
          badge: (
            <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Completed
            </Badge>
          ),
          message: 'Transfer completed successfully'
        };
      case 'failed':
        return {
          badge: (
            <Badge variant="destructive" className="shadow-sm flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          ),
          message: payout.failure_reason || 'Transfer failed'
        };
      case 'processing':
        return {
          badge: (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 shadow-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Processing
            </Badge>
          ),
          message: 'Transfer is being processed'
        };
      default:
        return {
          badge: (
            <Badge variant="secondary" className="shadow-sm">
              {currentStatus}
            </Badge>
          ),
          message: `Status: ${currentStatus}`
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {statusDisplay.badge}
        {currentStatus === 'processing' && (
          <button
            onClick={checkStatus}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
            title="Check status now"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      {statusDisplay.message && (
        <div className="text-xs text-white">
          {statusDisplay.message}
        </div>
      )}
      
      {lastChecked && currentStatus === 'processing' && (
        <div className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
      
      {payout.bank_transfer_details?.lenco_reference && (
        <div className="text-xs text-white">
          Lenco Ref: {payout.bank_transfer_details.lenco_reference}
        </div>
      )}
    </div>
  );
};

const CreatorPayments: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    available_balance: 0,
    pending_balance: 0,
    total_earnings: 0,
    total_platform_fees: 0,
    course_revenue: 0,
    event_revenue: 0,
    fundraising_revenue: 0
  });

  // Pagination states
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [payoutsTotal, setPayoutsTotal] = useState(0);

  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertPrice, currentCurrency } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    if (user) {
      loadPaymentData();
      loadPayoutMethod();
      loadProfileData();
      
      // Check URL parameters for Stripe callback
      const success = searchParams.get('success');
      const refresh = searchParams.get('refresh');
      const accountId = searchParams.get('account_id');
      
      if (success === 'true' && accountId) {
        handleStripeOnboardingSuccess(accountId);
        setSearchParams({});
      } else if (refresh === 'true') {
        toast({
          title: "Account Setup Incomplete",
          description: "Please complete your Stripe Connect account setup to receive payments.",
        });
        setSearchParams({});
      }
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, transactionsPage]);

  useEffect(() => {
    if (user) {
      loadPayouts();
    }
  }, [user, payoutsPage]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id, stripe_onboarding_completed, mobile_money_operator, mobile_money_number, default_payout_method, bank_account_details')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };
  
  const handleStripeOnboardingSuccess = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          stripe_connect_account_id: accountId,
          stripe_onboarding_completed: true,
          default_payout_method: 'stripe'
        })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating Stripe account:', error);
        toast({
          title: "Error",
          description: "Failed to save Stripe account details",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Stripe Account Connected",
          description: "Your Stripe Connect account has been set up successfully!",
        });
        loadPayoutMethod();
        loadProfileData();
      }
    } catch (error) {
      console.error('Error handling Stripe onboarding success:', error);
    }
  };

  const loadPaymentData = async () => {
    if (!user) return;
    
    try {
      setLoadingEarnings(true);
      
      const earningsData = await fetchCreatorEarnings(user.id);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoadingEarnings(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setLoadingTransactions(true);
      
      const offset = (transactionsPage - 1) * ITEMS_PER_PAGE;
      const { transactions: transactionsData, total } = await fetchCreatorPaymentTransactions(user.id, ITEMS_PER_PAGE, offset);
      
      setTransactions(transactionsData);
      setTransactionsTotal(total);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadPayouts = async () => {
    if (!user) return;
    
    try {
      setLoadingPayouts(true);
      
      const offset = (payoutsPage - 1) * ITEMS_PER_PAGE;
      const { payouts: payoutsData, total } = await fetchCreatorPayouts(user.id, ITEMS_PER_PAGE, offset);
      
      setPayouts(payoutsData);
      setPayoutsTotal(total);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast({
        title: "Error",
        description: "Failed to load payouts",
        variant: "destructive"
      });
    } finally {
      setLoadingPayouts(false);
    }
  };

  const loadPayoutMethod = async () => {
    if (!user) return;
    
    try {
      const method = await getCreatorPayoutMethod(user.id);
      setPayoutMethod(method);
    } catch (error) {
      console.error('Error loading payout method:', error);
    }
  };

  // Function to verify settlement status for all processing bank transfers
  const verifySettlementStatus = async () => {
    if (!user) return;
    
    try {
      // Find all processing bank transfer payouts
      const processingBankTransfers = payouts.filter(
        payout => payout.payout_method === 'bank' && payout.status === 'processing'
      );

      if (processingBankTransfers.length === 0) {
        toast({
          title: "No Processing Transfers",
          description: "There are no bank transfers currently processing.",
          variant: "default"
        });
        return;
      }

      toast({
        title: "Checking Settlement Status",
        description: `Checking status for ${processingBankTransfers.length} bank transfer(s)...`,
      });

      let updatedCount = 0;
      
      // Check status for each processing bank transfer
      for (const payout of processingBankTransfers) {
        if (!payout.external_reference) continue;
        
        try {
          console.log('🔄 Checking transfer status for:', payout.external_reference);
          
          const { data, error } = await supabase.functions.invoke('check-transfer-status', {
            body: { reference: payout.external_reference }
          });

          if (error) {
            console.error('❌ Status check error:', error);
            continue;
          }

          if (data.success) {
            const result = data.results?.find((r: any) => r.reference === payout.external_reference);
            
            if (result) {
              const lencoStatus = result.lenco_status;
              let newStatus = payout.status;
              
              if (lencoStatus === 'successful' || lencoStatus === 'completed') {
                newStatus = 'completed';
              } else if (lencoStatus === 'failed' || lencoStatus === 'rejected') {
                newStatus = 'failed';
              }
              
              // If status changed, increment counter
              if (newStatus !== payout.status) {
                updatedCount++;
              }
            }
          }
        } catch (err) {
          console.error('💥 Error checking transfer status:', err);
        }
      }

      // Reload payouts to reflect any status changes
      await loadPayouts();

      if (updatedCount > 0) {
        toast({
          title: "Status Updated",
          description: `${updatedCount} transfer status(es) have been updated.`,
          variant: "default"
        });
      } else {
        toast({
          title: "No Changes",
          description: "All transfers are still processing. No status changes detected.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error verifying settlement status:', error);
      toast({
        title: "Error",
        description: "Failed to verify settlement status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 shadow-sm">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 shadow-sm">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="shadow-sm">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="shadow-sm">{status}</Badge>;
    }
  };
  
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Course Purchase';
      case 'event_ticket':
        return 'Event Registration';
      case 'fundraising_contribution':
        return 'Campaign Contribution';
      case 'consultation':
        return 'Consultation Booking';
      default:
        return type;
    }
  };

  // NEW: Get platform fee percentage based on transaction type
  const getPlatformFeePercentage = (transaction: any) => {
    return transaction.item_type === 'fundraising_contribution' ? '5%' : '8%';
  };

  // NEW: Get hold period description based on transaction type
  const getHoldPeriodDescription = (transaction: any) => {
    if (transaction.item_type === 'fundraising_contribution') {
      return 'Available after campaign ends';
    }
    return 'Funds in 7-day hold period';
  };

  // NEW: Check if transaction is fundraising and campaign has ended
  const isCampaignEnded = (transaction: any) => {
    if (transaction.item_type !== 'fundraising_contribution') return false;
    
    const payoutDate = transaction.payout_eligible_date ? new Date(transaction.payout_eligible_date) : null;
    const now = new Date();
    
    return payoutDate && payoutDate <= now;
  };

  const hasBankTransferSetup = () => {
    return profileData?.bank_account_details && 
           profileData.bank_account_details.verified && 
           profileData.bank_account_details.account_number;
  };

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="bg-white/80 hover:bg-white shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <div className="text-sm px-2 sm:px-4 text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="bg-white/80 hover:bg-white shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderPayoutMethodInfo = () => {
    const hasStripeSetup = profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed;
    const hasMobileMoneySetup = profileData?.mobile_money_operator && profileData?.mobile_money_number;
    const hasBankSetup = hasBankTransferSetup();

    if (!hasStripeSetup && !hasMobileMoneySetup && !hasBankSetup) {
      return (
        <Alert className="bg-gradient-to-r from-orange-100 to-purple-100 border-orange-200 shadow-sm">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">No Payout Method Set Up</AlertTitle>
          <AlertDescription className="text-orange-700">
            Set up a payout method to withdraw your earnings. Choose between Stripe (for USA), Mobile Money, or Bank Transfer (for African countries).
          </AlertDescription>
        </Alert>
      );
    }

    if (profileData?.default_payout_method === 'stripe' && hasStripeSetup) {
      return (
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">Stripe Connect - Connected</div>
              <div className="text-sm text-blue-700">Bank transfers (2-7 business days)</div>
              {profileData.stripe_connect_account_id && (
                <div className="text-xs text-blue-600 mt-1">
                  Account ID: {profileData.stripe_connect_account_id.substring(0, 16)}...
                </div>
              )}
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm mt-2 sm:mt-0">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    if (profileData?.default_payout_method === 'mobile_money' && hasMobileMoneySetup) {
      return (
        <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Smartphone className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-900">Mobile Money - Connected</div>
              <div className="text-sm text-green-700">
                {profileData.mobile_money_operator} • {profileData.mobile_money_number}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Within 24 hours processing
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm mt-2 sm:mt-0">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    if (profileData?.default_payout_method === 'bank' && hasBankSetup) {
      const bankDetails = profileData.bank_account_details;
      return (
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-lg border border-purple-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Building2 className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <div className="font-medium text-purple-900">Bank Transfer - Connected</div>
              <div className="text-sm text-purple-700">
                {bankDetails.bank_name} • {bankDetails.account_number}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {bankDetails.account_name} • 1-3 business days
              </div>
              {bankDetails.recipient_id && (
                <div className="text-xs text-purple-500 mt-1">
                  Recipient ID: {bankDetails.recipient_id.substring(0, 16)}...
                </div>
              )}
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm mt-2 sm:mt-0">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    // Show all available methods if no default is set
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">Available Payout Methods:</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hasStripeSetup && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Stripe</span>
              </div>
            </div>
          )}
          {hasMobileMoneySetup && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Mobile Money</span>
              </div>
            </div>
          )}
          {hasBankSetup && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Bank Transfer</span>
              </div>
            </div>
          )}
        </div>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            No default payout method selected. Please set a default method in payout settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const hasAnyPayoutMethod = () => {
    const hasStripeSetup = profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed;
    const hasMobileMoneySetup = profileData?.mobile_money_operator && profileData?.mobile_money_number;
    const hasBankSetup = hasBankTransferSetup();
    
    return hasStripeSetup || hasMobileMoneySetup || hasBankSetup;
  };

  const renderTransactionCard = (transaction: any) => {
    const gradientClass = transaction.item_type === 'course' 
      ? 'bg-gradient-to-br from-orange-500 to-purple-600'
      : transaction.item_type === 'event_ticket'
      ? 'bg-gradient-to-br from-purple-500 to-orange-600'
      : 'bg-gradient-to-br from-blue-500 to-blue-600';
    
    const isFundraising = transaction.item_type === 'fundraising_contribution';
    const campaignEnded = isCampaignEnded(transaction);
    
    return (
      <Card key={transaction.id} className={`mb-3 ${gradientClass} text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 w-full`}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg line-clamp-1">{transaction.item_name}</CardTitle>
              <CardDescription className="text-white/80">
                {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                {isFundraising && (
                  <span className="ml-2">
                    • {campaignEnded ? 'Campaign Ended' : 'Campaign Active'}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                {getPaymentTypeLabel(transaction.item_type)}
              </Badge>
              {isFundraising && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-100 border-blue-300/30 text-xs">
                  {getPlatformFeePercentage(transaction)} Platform Fee
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Customer</p>
              <p className="font-medium line-clamp-1">{transaction.customer_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Order ID</p>
              <p className="font-mono text-sm font-medium line-clamp-1">{transaction.order_id?.substring(0, 8) || 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Amount</p>
              <PriceDisplay 
                amount={transaction.total_amount} 
                originalCurrency="USD" 
                className="font-medium text-white"
              />
            </div>
            <div>
              <p className="text-sm text-white/80">Your Earning</p>
              <PriceDisplay 
                amount={transaction.creator_earning} 
                originalCurrency="USD" 
                className="font-bold text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Platform Fee</p>
              <div className="flex items-center gap-2">
                <PriceDisplay 
                  amount={transaction.platform_fee} 
                  originalCurrency="USD" 
                  className="text-white/90"
                />
                <Badge variant="outline" className="bg-white/20 text-white text-xs border-white/30">
                  {getPlatformFeePercentage(transaction)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/80">Status</p>
              <div className="mt-1">
                {getStatusBadge(transaction.payment_status)}
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-white/80">
              {isFundraising ? 'Available Date' : 'Payout Date'}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {transaction.payout_eligible_date ? 
                  format(new Date(transaction.payout_eligible_date), 'MMM dd, yyyy') :
                  'N/A'
                }
              </p>
              {isFundraising && campaignEnded && (
                <Badge variant="default" className="bg-green-500/20 text-green-100 text-xs">
                  Available Now
                </Badge>
              )}
              {isFundraising && !campaignEnded && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-100 text-xs border-yellow-300/30">
                  After Campaign
                </Badge>
              )}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {getHoldPeriodDescription(transaction)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPayoutCard = (payout: any) => {
    const getGradientClass = (method: string) => {
      switch (method) {
        case 'stripe':
          return 'bg-gradient-to-br from-blue-500 to-blue-600';
        case 'mobile_money':
          return 'bg-gradient-to-br from-green-500 to-green-600';
        case 'bank':
          return 'bg-gradient-to-br from-purple-500 to-purple-600';
        default:
          return 'bg-gradient-to-br from-gray-500 to-gray-600';
      }
    };

    const statusColor = payout.status === 'completed' 
      ? getGradientClass(payout.payout_method)
      : payout.status === 'failed'
      ? 'bg-gradient-to-br from-red-500 to-rose-600'
      : payout.status === 'processing'
      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
      : 'bg-gradient-to-br from-gray-500 to-gray-600';
    
    const getMethodIcon = (method: string) => {
      switch (method) {
        case 'stripe':
          return <CreditCard className="h-4 w-4" />;
        case 'mobile_money':
          return <Smartphone className="h-4 w-4" />;
        case 'bank':
          return <Building2 className="h-4 w-4" />;
        default:
          return <DollarSign className="h-4 w-4" />;
      }
    };

    const getMethodLabel = (method: string) => {
      switch (method) {
        case 'stripe':
          return 'Stripe Connect';
        case 'mobile_money':
          return 'Mobile Money';
        case 'bank':
          return 'Bank Transfer';
        default:
          return method;
      }
    };
    
    return (
      <Card key={payout.id} className={`mb-3 ${statusColor} text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 w-full`}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg">
                {payout.currency?.toUpperCase() || 'USD'} {Number(payout.amount).toFixed(2)}
              </CardTitle>
              <CardDescription className="text-white/80">
                {format(new Date(payout.created_at), 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {payout.payout_method === 'bank' ? (
                <BankTransferStatusTracker 
                  payout={payout} 
                  onStatusUpdate={loadPayouts}
                />
              ) : (
                <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Method</p>
              <div className="flex items-center gap-2 mt-1">
                {getMethodIcon(payout.payout_method)}
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  {getMethodLabel(payout.payout_method)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/80">Currency</p>
              <p className="font-medium">{payout.currency?.toUpperCase() || 'USD'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-white/80">Destination</p>
            <p className="font-medium line-clamp-1">{payout.destination}</p>
          </div>

          {/* Additional bank transfer details */}
          {payout.payout_method === 'bank' && payout.bank_transfer_details && (
            <div className="bg-white/10 p-2 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                <div>
                  <span className="text-white/70">Sent:</span>{' '}
                  <span className="font-medium">
                    ZMW {payout.bank_transfer_details.zmw_amount_sent}
                  </span>
                </div>
                <div>
                  <span className="text-white/70">Fee:</span>{' '}
                  <span className="font-medium">
                    ZMW {payout.bank_transfer_details.fee || '0.00'}
                  </span>
                </div>
                {payout.bank_transfer_details.exchange_rate && (
                  <div className="sm:col-span-2">
                    <span className="text-white/70">Exchange Rate:</span>{' '}
                    <span className="font-medium">
                      1 USD = {Number(payout.bank_transfer_details.exchange_rate).toFixed(2)} ZMW
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Payments & Payouts
            </h1>
            <Button
              variant="outline"
              onClick={() => setIsSetupDialogOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 border-transparent hover:border-transparent shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Settings className="h-4 w-4" />
              <span className="whitespace-nowrap">Payout Settings</span>
            </Button>
          </div>

          {/* Payout Method Status */}
          <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-4 rounded-lg border border-orange-200/50 shadow-sm w-full">
            {renderPayoutMethodInfo()}
          </div>
          
          {/* Enhanced Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <Card className="bg-gradient-to-br from-orange-100 to-orange-50 shadow-sm hover:shadow-md transition-shadow border-orange-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-orange-800">Available Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-orange-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold text-orange-800">
                    <PriceDisplay amount={earnings.available_balance} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-orange-600/80 mt-1">
                  Available for withdrawal (minimum $5.00)
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setIsWithdrawDialogOpen(true)}
                  disabled={loadingEarnings || earnings.available_balance < 5 || !hasAnyPayoutMethod()}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Withdraw Funds
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-100 to-purple-50 shadow-sm hover:shadow-md transition-shadow border-purple-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-purple-800">Pending Balance</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-purple-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold text-purple-800">
                    <PriceDisplay amount={earnings.pending_balance} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-purple-600/80 mt-1">
                  Includes funds in 7-day hold + campaign contributions
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-100 to-purple-100 shadow-sm hover:shadow-md transition-shadow border-orange-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-purple-800">Total Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-gradient-to-r from-orange-200 to-purple-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold bg-gradient-to-r from-orange-700 to-purple-700 bg-clip-text text-transparent">
                    <PriceDisplay amount={earnings.total_earnings} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-orange-600/80 mt-1">
                  Your share (92% courses/events, 95% fundraising)
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-100 to-orange-100 shadow-sm hover:shadow-md transition-shadow border-purple-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-purple-800">Platform Fees</CardTitle>
                <Minus className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-gradient-to-r from-purple-200 to-orange-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold bg-gradient-to-r from-purple-700 to-orange-700 bg-clip-text text-transparent">
                    <PriceDisplay amount={earnings.total_platform_fees} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-purple-600/80 mt-1">
                  Platform fees (8% courses/events, 5% fundraising)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-400 shadow-lg border-0 w-full">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">Course Revenue</CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  Earnings from course sales (92% share)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <PriceDisplay amount={earnings.course_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-400 shadow-lg border-0 w-full">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">Event Revenue</CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  Earnings from event registrations (92% share)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <PriceDisplay amount={earnings.event_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-400 shadow-lg border-0 w-full">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">Fundraising Revenue</CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  Earnings from campaign contributions (95% share)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <PriceDisplay amount={earnings.fundraising_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Payments & Payouts Tabs */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-orange-100 to-purple-100 p-1 h-auto rounded-lg border border-orange-200/50">
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-xs sm:text-sm"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="payouts"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-xs sm:text-sm"
              >
                Payouts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-3">
              <Card className="bg-gradient-to-br from-orange-50 to-purple-50 shadow-sm border-orange-200/50 w-full">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl">
                    Customer Transactions
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View all completed payment transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  {loadingTransactions ? (
                    <div className="space-y-3 w-full">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 sm:h-32 w-full rounded-lg bg-gradient-to-r from-orange-100 to-purple-100" />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm sm:text-base w-full">
                      No payment transactions found
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {transactions.map(renderTransactionCard)}
                      {renderPagination(transactionsPage, transactionsTotal, setTransactionsPage)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payouts" className="space-y-3">
              <Card className="bg-gradient-to-br from-purple-50 to-orange-50 shadow-sm border-purple-200/50 w-full">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <CardTitle className="bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent text-lg sm:text-xl">
                        Payout History
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Track your withdrawal requests
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={verifySettlementStatus}
                        className="flex items-center gap-2 bg-white/80 hover:bg-white shadow-sm"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Verify Settlement Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          loadPayouts();
                          verifySettlementStatus(); // Also check settlement status on refresh
                        }}
                        disabled={loadingPayouts}
                        className="flex items-center gap-2 bg-white/80 hover:bg-white shadow-sm"
                      >
                        <RefreshCw className={`h-3 w-3 ${loadingPayouts ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="w-full">
                  {loadingPayouts ? (
                    <div className="space-y-3 w-full">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 sm:h-32 w-full rounded-lg bg-gradient-to-r from-purple-100 to-orange-100" />
                      ))}
                    </div>
                  ) : payouts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm sm:text-base w-full">
                      No payout requests found
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {payouts.map(renderPayoutCard)}
                      {renderPagination(payoutsPage, payoutsTotal, setPayoutsPage)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <EnhancedWithdrawDialog
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          availableBalance={earnings.available_balance}
          currency={currentCurrency}
          onSuccess={() => {
            loadPaymentData();
            loadPayouts();
          }}
        />

        <PayoutMethodSetupDialog
          open={isSetupDialogOpen}
          onOpenChange={setIsSetupDialogOpen}
          onSuccess={() => {
            loadPayoutMethod();
            loadProfileData();
          }}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorPayments;
