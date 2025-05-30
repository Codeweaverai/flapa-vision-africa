
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  useEffect(() => {
    if (sessionId && type === 'course' && id) {
      verifyPaymentAndEnrollment();
    } else {
      setLoading(false);
    }
  }, [sessionId, type, id]);

  const verifyPaymentAndEnrollment = async () => {
    try {
      // Get course information
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, description')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        toast.error('Error verifying enrollment');
        return;
      }

      setCourseInfo(course);
      toast.success('Payment successful! You are now enrolled in the course.');
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error verifying payment');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (type === 'course' && id) {
      navigate(`/learning/course/${id}`);
    } else {
      navigate('/learning');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-light-purple flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {courseInfo && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to</h3>
                    <h2 className="text-xl font-bold text-primary">{courseInfo.title}</h2>
                  </div>
                )}
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">You have been successfully enrolled!</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Lifetime access to course materials</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Access on mobile and desktop</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Certificate upon completion</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleContinue} className="w-full" size="lg">
                    Start Learning
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccessPage;
