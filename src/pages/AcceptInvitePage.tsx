
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Users, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';

interface InvitationDetails {
  id: string;
  workplace_id: string;
  invited_email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: string;
  workplace: {
    name: string;
    description: string | null;
  };
  invited_by_profile: {
    full_name: string | null;
    username: string | null;
  };
}

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('creator_workplace_invitations')
          .select(`
            *,
            workplace:creator_workplaces (
              name,
              description
            ),
            invited_by_profile:profiles!creator_workplace_invitations_invited_by_fkey (
              full_name,
              username
            )
          `)
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
          setError('Invitation not found or has expired');
        } else {
          setInvitation(data as InvitationDetails);
        }
      } catch (err) {
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    setError(null);

    try {
      // Check if user's email matches the invitation
      if (user.email !== invitation.invited_email) {
        throw new Error('You must be logged in with the invited email address');
      }

      // Accept the invitation
      const { error: acceptError } = await supabase
        .from('creator_workplace_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (acceptError) throw acceptError;

      // Create workplace membership
      const { error: memberError } = await supabase
        .from('creator_workplace_members')
        .insert({
          workplace_id: invitation.workplace_id,
          user_id: user.id,
          role: invitation.role,
          status: 'active',
          joined_at: new Date().toISOString(),
          invited_by: invitation.id
        });

      if (memberError) throw memberError;

      setSuccess(true);
      
      // Redirect to creator workplaces after a delay
      setTimeout(() => {
        navigate('/creator/workplaces');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;

    try {
      const { error } = await supabase
        .from('creator_workplace_invitations')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) throw error;

      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading invitation...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Invalid Invitation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button 
                className="w-full mt-4" 
                onClick={() => navigate('/')}
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Invitation Accepted!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You have successfully joined {invitation?.workplace.name}. 
                Redirecting you to your workplaces...
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in with your account to accept this workplace invitation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Workplace Invitation</CardTitle>
            </div>
            <CardDescription>
              You've been invited to join a creator workplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">{invitation?.workplace.name}</h3>
              {invitation?.workplace.description && (
                <p className="text-muted-foreground text-sm mt-1">
                  {invitation.workplace.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  Role: <span className="capitalize font-medium">{invitation?.role}</span>
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                Invited by: {invitation?.invited_by_profile.full_name || invitation?.invited_by_profile.username || 'Unknown'}
              </div>
            </div>

            {user.email !== invitation?.invited_email && (
              <Alert variant="destructive">
                <AlertDescription>
                  This invitation was sent to {invitation?.invited_email}, but you're logged in as {user.email}.
                  Please sign in with the correct account.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAcceptInvitation}
                disabled={accepting || user.email !== invitation?.invited_email}
                className="flex-1"
              >
                {accepting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={handleDeclineInvitation}
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AcceptInvitePage;
