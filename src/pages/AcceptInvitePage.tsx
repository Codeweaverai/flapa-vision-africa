
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface InvitationDetails {
  id: string;
  workplace_id: string;
  invited_email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: string;
  expires_at: string;
  workplace: {
    name: string;
    description: string;
  };
  invited_by_profile: {
    full_name: string;
    username: string;
  };
}

const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      // First fetch the invitation details
      const { data, error } = await supabase
        .from('creator_workplace_invitations')
        .select(`
          id,
          workplace_id,
          invited_email,
          role,
          status,
          expires_at,
          invited_by,
          workplace:creator_workplaces(name, description)
        `)
        .eq('invitation_token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Invitation not found');
        return;
      }

      if (data.status !== 'pending') {
        setError(`This invitation has already been ${data.status}`);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Fetch the invited_by profile separately to avoid relationship issues
      let invitedByProfile = { full_name: 'Unknown User', username: 'unknown' };
      
      if (data.invited_by) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', data.invited_by)
          .single();
        
        if (profileData) {
          invitedByProfile = {
            full_name: profileData.full_name || 'Unknown User',
            username: profileData.username || 'unknown'
          };
        }
      }

      // Handle potential profile fetch error gracefully and ensure proper typing
      const processedData: InvitationDetails = {
        ...data,
        role: data.role as 'owner' | 'editor' | 'viewer',
        invited_by_profile: invitedByProfile
      };

      setInvitation(processedData);
    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;

    setProcessing(true);
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('creator_workplace_members')
        .select('id')
        .eq('workplace_id', invitation.workplace_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.error('You are already a member of this workplace');
        return;
      }

      // Get the invited_by user ID from the invitation
      const { data: invitationData } = await supabase
        .from('creator_workplace_invitations')
        .select('invited_by')
        .eq('id', invitation.id)
        .single();

      // Add user to workplace with correct property names
      const { error: memberError } = await supabase
        .from('creator_workplace_members')
        .insert({
          workplace_id: invitation.workplace_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitationData?.invited_by || null,
          status: 'active'
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('creator_workplace_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast.success('Welcome to the workplace!');
      navigate('/creator/workplaces');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('creator_workplace_invitations')
        .update({ 
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) throw error;

      toast.success('Invitation declined');
      navigate('/');
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to accept this workplace invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Workplace Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-1">{invitation.workplace.name}</h3>
                {invitation.workplace.description && (
                  <p className="text-muted-foreground text-sm mb-2">
                    {invitation.workplace.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>Role: <strong>{invitation.role}</strong></span>
                  <span>
                    Invited by: <strong>{invitation.invited_by_profile.full_name || invitation.invited_by_profile.username}</strong>
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAccept} 
                  disabled={processing}
                  className="flex-1"
                >
                  {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Accept
                </Button>
                <Button 
                  onClick={handleDecline} 
                  disabled={processing}
                  variant="outline"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;
