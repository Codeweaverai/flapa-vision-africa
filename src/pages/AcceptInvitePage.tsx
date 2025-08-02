
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, Building, AlertCircle, RefreshCw } from 'lucide-react';
import OTPVerificationModal from '@/components/auth/OTPVerificationModal';

interface Invitation {
  id: string;
  invitation_token: string;
  invited_email: string;
  role: string;
  status: string;
  expires_at: string;
  workplace_id: string;
  invited_by: string;
  created_at: string;
  workplace?: {
    name: string;
    description: string;
    owner_id: string;
  };
  inviter?: {
    full_name: string;
    username: string;
  };
}

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, otpRequired, verificationType, setOtpRequired } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - missing token');
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token, retryCount]);

  const fetchInvitation = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // CRITICAL FIX: Always decode the token once and use only decoded version
      const decodedToken = decodeURIComponent(token);
      console.log('Original token from URL:', token);
      console.log('Decoded token for DB lookup:', decodedToken);

      const { data: invitationData, error: invError } = await supabase
        .from('creator_workplace_invitations')
        .select('*')
        .eq('invitation_token', decodedToken)
        .maybeSingle();

      if (invError) {
        console.error('Database query error:', invError);
        throw new Error('Failed to load invitation details');
      }

      if (!invitationData) {
        console.error('No invitation found for decoded token:', decodedToken);
        
        // Enhanced debugging: Show what tokens exist
        const { data: debugTokens } = await supabase
          .from('creator_workplace_invitations')
          .select('invitation_token, status, expires_at, invited_email')
          .limit(5);
        
        console.log('Available invitation tokens in database:', debugTokens);
        
        throw new Error('Invalid invitation token - invitation not found');
      }

      console.log('Invitation data found:', invitationData);

      // Check if invitation is still valid
      if (invitationData.status !== 'pending') {
        throw new Error(`This invitation has already been ${invitationData.status}`);
      }

      if (new Date(invitationData.expires_at) < new Date()) {
        throw new Error('This invitation has expired');
      }

      // Get workplace details
      let workplaceData = null;
      try {
        const { data: workplace, error: workplaceError } = await supabase
          .from('creator_workplaces')
          .select('name, description, owner_id')
          .eq('id', invitationData.workplace_id)
          .maybeSingle();

        if (!workplaceError && workplace) {
          workplaceData = workplace;
        }
      } catch (workplaceErr) {
        console.error('Workplace lookup error:', workplaceErr);
      }

      // Get inviter details
      let inviterData = null;
      try {
        const { data: inviter, error: inviterError } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', invitationData.invited_by)
          .maybeSingle();

        if (!inviterError && inviter) {
          inviterData = inviter;
        }
      } catch (inviterErr) {
        console.error('Inviter lookup error:', inviterErr);
      }

      // Combine the data
      const fullInvitation: Invitation = {
        ...invitationData,
        workplace: workplaceData || undefined,
        inviter: inviterData || undefined
      };

      console.log('Full invitation loaded successfully:', fullInvitation);
      setInvitation(fullInvitation);

    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      setError(error.message || 'Failed to load invitation details');
      
      // Retry logic for network failures
      if (retryCount < 3 && error.message.includes('Failed to load')) {
        console.log(`Retrying invitation fetch, attempt ${retryCount + 1}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchInvitation();
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('creator_workplace_members')
        .select('id')
        .eq('workplace_id', invitation.workplace_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast.error('You are already a member of this workplace');
        return;
      }

      // Accept the invitation
      const { error: acceptError } = await supabase
        .from('creator_workplace_members')
        .insert({
          workplace_id: invitation.workplace_id,
          user_id: user.id,
          role: invitation.role as 'owner' | 'editor' | 'viewer',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (acceptError) throw acceptError;

      // Update invitation status
      await supabase
        .from('creator_workplace_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      toast.success('Successfully joined the workplace!');
      navigate('/creator/workplaces');

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleOTPVerified = () => {
    setOtpRequired(false);
    toast.success('Email verified! You can now accept the invitation.');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading invitation details...</p>
          {retryCount > 0 && (
            <p className="text-sm mt-2 opacity-80">Retry attempt {retryCount}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              {retryCount < 3 && error.includes('Failed to load') && (
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Loading
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="outline">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    // Store the invitation token for after login
    sessionStorage.setItem('invitation_token', token || '');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Users className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to sign in to accept this workplace invitation.
            </p>
            <Button onClick={() => navigate(`/auth?redirect=accept-invite`)}>
              Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-orange-400 to-purple-500 flex items-center justify-center">
            <Building className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Workplace Invitation</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {invitation && (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{invitation.workplace?.name}</h3>
                {invitation.workplace?.description && (
                  <p className="text-muted-foreground">{invitation.workplace.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Invited by:</span>
                  <span className="text-sm">
                    {invitation.inviter?.full_name || invitation.inviter?.username || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant="secondary">{invitation.role}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{invitation.invited_email}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expires:</span>
                  <span className="text-sm">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleAcceptInvitation}
                disabled={accepting || otpRequired}
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : otpRequired ? (
                  'Complete Email Verification First'
                ) : (
                  'Accept Invitation'
                )}
              </Button>

              {otpRequired && (
                <p className="text-sm text-center text-muted-foreground">
                  You need to verify your email before accepting this invitation.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {otpRequired && user && verificationType && (
        <OTPVerificationModal
          isOpen={otpRequired}
          onClose={() => {}}
          onVerified={handleOTPVerified}
          verificationType={verificationType}
          userEmail={user.email || ''}
        />
      )}
    </div>
  );
};

export default AcceptInvitePage;
