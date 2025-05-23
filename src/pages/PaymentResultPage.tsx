
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentResultPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [itemType, setItemType] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [itemDetails, setItemDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const type = searchParams.get('item_type');
    const id = searchParams.get('item_id');

    if (!sessionId || !type || !id || !user) {
      setLoading(false);
      setSuccess(false);
      return;
    }

    setItemType(type);
    setItemId(id);
    
    const verifyPayment = async () => {
      try {
        // Call verify-payment edge function to check payment status
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, itemType: type, itemId: id }
        });

        if (error) throw error;

        setSuccess(data.success);
        
        // Fetch item details
        if (type === 'course') {
          const { data: courseData } = await supabase
            .from('courses')
            .select('title, thumbnail_url')
            .eq('id', id)
            .single();
          
          setItemDetails(courseData);
        } else if (type === 'event') {
          const { data: eventData } = await supabase
            .from('events')
            .select('title, image_url, start_time, location')
            .eq('id', id)
            .single();
          
          setItemDetails(eventData);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Failed to verify payment status');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, user]);

  const getRedirectPath = () => {
    if (itemType === 'course') {
      return `/learning/course/${itemId}`;
    } else if (itemType === 'event') {
      return `/events/${itemId}`;
    }
    return '/';
  };

  return (
    <Layout>
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              {loading ? 'Processing Payment' : success ? 'Payment Successful' : 'Payment Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {loading ? 'Please wait while we verify your payment...' : ''}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-6">
            {loading ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : success ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-center mb-4">Your payment was successful!</p>
                
                {itemDetails && (
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold mb-2">
                      {itemType === 'course' ? 'Course' : 'Event'}: {itemDetails.title}
                    </h3>
                    {itemType === 'event' && itemDetails.start_time && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Date: {new Date(itemDetails.start_time).toLocaleDateString()}
                      </p>
                    )}
                    {itemType === 'event' && itemDetails.location && (
                      <p className="text-sm text-muted-foreground">
                        Location: {itemDetails.location}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-center mb-4">There was a problem processing your payment.</p>
                <p className="text-center text-sm text-muted-foreground">
                  Please try again or contact support if the problem persists.
                </p>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => navigate(getRedirectPath())}
              disabled={loading}
              variant={success ? "default" : "outline"}
            >
              {success 
                ? (itemType === 'course' ? 'Start Learning' : 'View Event Details') 
                : 'Return to Homepage'
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
