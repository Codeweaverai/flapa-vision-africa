
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { workplaceService } from '@/services/workplaceService';
import { toast } from 'sonner';
import { Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link');
      return;
    }

    if (!user) {
      // Redirect to auth with return URL
      navigate('/auth', { 
        state: { redirectTo: `/accept-invite?token=${token}` }
      });
      return;
    }

    handleAcceptInvitation();
  }, [user, token]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await workplaceService.acceptInvitation(token);
      setStatus('success');
      setMessage('Welcome to the team! You have successfully joined the workplace.');
      toast.success('Invitation accepted successfully!');
      
      // Redirect to creator dashboard after a brief delay
      setTimeout(() => {
        navigate('/creator');
      }, 3000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to accept invitation');
      toast.error('Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {status === 'loading' && <Loader2 className="h-8 w-8 text-white animate-spin" />}
              {status === 'success' && <CheckCircle className="h-8 w-8 text-white" />}
              {status === 'error' && <XCircle className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Processing Invitation...'}
              {status === 'success' && 'Welcome to the Team!'}
              {status === 'error' && 'Invitation Error'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we process your invitation.'}
              {status === 'success' && 'You have been successfully added to the workplace.'}
              {status === 'error' && 'There was an issue with your invitation.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>

            {status === 'success' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to your creator dashboard in a few seconds...
                </p>
                <Button 
                  onClick={() => navigate('/creator')}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  Go to Dashboard Now
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="outline"
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  Go Home
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AcceptInvitePage;
