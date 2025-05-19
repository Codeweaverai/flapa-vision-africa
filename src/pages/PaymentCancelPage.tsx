
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  
  // Get payment data from URL parameters
  const paymentType = searchParams.get('type');
  const referenceId = searchParams.get('reference_id');
  const title = searchParams.get('title') || 'Purchase';

  return (
    <Layout>
      <div className="section-container py-12 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <Card className="border-red-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-red-700 mb-2">Payment Cancelled</h1>
                <p className="text-muted-foreground">Your payment was not completed</p>
              </div>
              
              <div className="space-y-6">
                {(paymentType || referenceId) && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h2 className="font-medium mb-2">Order Details</h2>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Item:</span>
                        <span className="font-medium">{title}</span>
                      </div>
                      
                      {paymentType && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{paymentType}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-red-600">Cancelled</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="mb-6">
                    Your payment was not completed. No charges were made to your account.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild variant="outline">
                      <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return Home
                      </Link>
                    </Button>
                    
                    {paymentType === 'event' && (
                      <Button asChild>
                        <Link to="/events">
                          Browse Events
                        </Link>
                      </Button>
                    )}
                    
                    {paymentType === 'course' && (
                      <Button asChild>
                        <Link to="/learning">
                          Browse Courses
                        </Link>
                      </Button>
                    )}
                    
                    {paymentType === 'consultation' && (
                      <Button asChild>
                        <Link to="/consult">
                          Book Consultation
                        </Link>
                      </Button>
                    )}
                    
                    {!paymentType && (
                      <Button asChild>
                        <Link to="/account">
                          My Account
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCancelPage;
