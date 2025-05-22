
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const StripeAccountManagement = () => {
  const { user } = useAuth();
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStripeAccountId = async () => {
      if (user && user.id) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('stripe_connect_id')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching Stripe Account ID:', error);
            toast.error('Failed to fetch Stripe Account ID.');
          } else if (data) {
            setStripeAccountId(data.stripe_connect_id);
          }
        } catch (error) {
          console.error('Unexpected error:', error);
          toast.error('Unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStripeAccountId();
  }, [user]);

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-stripe-account', {
        body: { user_id: user?.id },
      });

      if (error) {
        console.error('Error creating Stripe account:', error);
        toast.error('Failed to create Stripe account.');
      } else if (data && data.account_id) {
        setStripeAccountId(data.account_id);
        toast.success('Stripe account created successfully!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountLink = async () => {
    if (!stripeAccountId) {
      toast.error('Please create a Stripe account first.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-stripe-account-link', {
        body: { account_id: stripeAccountId },
      });

      if (error) {
        console.error('Error creating Stripe account link:', error);
        toast.error('Failed to create Stripe account link.');
      } else if (data && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Account Management</CardTitle>
        <CardDescription>Manage your Stripe account for payouts.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : stripeAccountId ? (
          <>
            <p>Your Stripe Account ID: {stripeAccountId}</p>
            <Button onClick={handleCreateAccountLink} disabled={loading}>
              Update Account Details
            </Button>
          </>
        ) : (
          <Button onClick={handleCreateAccount} disabled={loading}>
            Create Stripe Account
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeAccountManagement;
