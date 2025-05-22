
import React, { useState, useEffect } from 'react';
import { 
  ConnectAccountManagement,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface StripeAccountManagementProps {
  stripeAccountId: string;
}

const StripeAccountManagement: React.FC<StripeAccountManagementProps> = ({ stripeAccountId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeConnect, setStripeConnect] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripeConnect = async () => {
      try {
        // Import the module dynamically
        const { loadStripeConnect } = await import('@stripe/connect-js');
        const stripeConnectInstance = await loadStripeConnect();
        setStripeConnect(stripeConnectInstance);
        
        // Get the account session client secret
        if (stripeAccountId) {
          const { data, error } = await supabase.functions.invoke('create-stripe-account-session');
          
          if (error) {
            throw new Error(`Failed to create account session: ${error.message}`);
          }
          
          if (data?.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error('No client secret returned from server');
          }
        }
      } catch (err) {
        console.error('Error initializing Stripe Connect:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Stripe Account Management');
        toast.error('Failed to load Stripe Account Management');
      } finally {
        setLoading(false);
      }
    };

    initializeStripeConnect();
  }, [stripeAccountId]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-account-session');
      
      if (error) {
        throw new Error(`Failed to refresh account session: ${error.message}`);
      }
      
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        toast.success('Account management refreshed');
      } else {
        throw new Error('No client secret returned from server');
      }
    } catch (err) {
      console.error('Error refreshing account session:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh account management');
      toast.error('Failed to refresh account management');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading account management...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
        <p className="font-medium">Error loading account management</p>
        <p className="text-sm mt-2">{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!stripeConnect || !clientSecret) {
    return (
      <div className="p-4 border rounded-md">
        <p>Unable to load Stripe Account Management</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="stripe-account-management">
      <ConnectComponentsProvider connectInstance={stripeConnect}>
        <ConnectAccountManagement
          clientSecret={clientSecret}
        />
        <div className="mt-4 text-center">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </ConnectComponentsProvider>
    </div>
  );
};

export default StripeAccountManagement;
