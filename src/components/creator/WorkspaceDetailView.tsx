import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Trash2,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Workplace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id: string;
  member_count: number;
  user_role: 'owner' | 'editor' | 'viewer';
}

interface WorkspaceDetailViewProps {
  workplace: Workplace;
  onUpdate: () => void;
}

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  status: string;
  joined_at: string;
  profile?: {
    full_name?: string;
    username?: string;
  };
}

interface Invitation {
  id: string;
  invited_email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: string;
  created_at: string;
  expires_at: string;
}

const WorkspaceDetailView: React.FC<WorkspaceDetailViewProps> = ({ workplace, onUpdate }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = workplace.user_role === 'owner';

  useEffect(() => {
    fetchMembersAndInvitations();
  }, [workplace.id]);

  const fetchMembersAndInvitations = async () => {
    setLoading(true);
    try {
      // Fetch active members
      const { data: membersData, error: membersError } = await supabase
        .from('creator_workplace_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          profiles!user_id(full_name, username)
        `)
        .eq('workplace_id', workplace.id)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Fetch pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('creator_workplace_invitations')
        .select('*')
        .eq('workplace_id', workplace.id)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;

      setMembers(membersData || []);
      
      // Type assertion for invitations to ensure role has the correct type
      const typedInvitations = (invitationsData || []).map(invitation => ({
        ...invitation,
        role: invitation.role as 'owner' | 'editor' | 'viewer'
      }));
      
      setInvitations(typedInvitations);
    } catch (error) {
      console.error('Error fetching workspace details:', error);
      toast.error('Failed to load workspace details');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      const { error } = await supabase.functions.invoke('send-workplace-invitation', {
        body: {
          workplace_id: workplace.id,
          invited_email: invitation.invited_email,
          role: invitation.role,
          invitation_token: invitation.id
        }
      });

      if (error) throw error;

      toast.success('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('creator_workplace_members')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed successfully');
      fetchMembersAndInvitations();
      onUpdate();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('creator_workplace_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      fetchMembersAndInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  {isOwner && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.invited_email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(invitation.role)}>
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </TableCell>
                    {isOwner && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvitation(invitation)}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel the invitation to {invitation.invited_email}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                >
                                  Cancel Invitation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            Active Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {isOwner && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.profile?.full_name || member.profile?.username || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.user_id === user?.id ? 'You' : 'Member'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      {member.user_id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this member from the workplace? They will lose access to all workspace content.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceDetailView;
