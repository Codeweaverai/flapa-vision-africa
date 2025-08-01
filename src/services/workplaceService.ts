
import { supabase } from '@/integrations/supabase/client';

export interface Workplace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkplaceMember {
  id: string;
  workplace_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  status: string;
  invited_by?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    username?: string;
    email?: string;
  };
}

export interface WorkplaceInvitation {
  id: string;
  workplace_id: string;
  email: string;
  token: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export const workplaceService = {
  // Create a new workplace
  async createWorkplace(name: string, description?: string): Promise<Workplace> {
    const { data, error } = await supabase
      .from('creator_workplaces')
      .insert({
        name,
        description,
        owner_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's workplaces (owned and member)
  async getUserWorkplaces(): Promise<Workplace[]> {
    const { data, error } = await supabase
      .from('creator_workplaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get workplace members
  async getWorkplaceMembers(workplaceId: string): Promise<WorkplaceMember[]> {
    const { data, error } = await supabase
      .from('creator_workplace_members')
      .select(`
        *,
        profiles:user_id (
          full_name,
          username
        )
      `)
      .eq('workplace_id', workplaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Invite user to workplace
  async inviteUser(workplaceId: string, email: string, role: 'editor' | 'viewer'): Promise<void> {
    // Generate unique token
    const token = crypto.randomUUID() + '-' + Date.now().toString(36);
    
    const { error } = await supabase
      .from('workplace_invitations')
      .insert({
        workplace_id: workplaceId,
        email,
        token,
        role,
        invited_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) throw error;

    // Send invitation email via edge function
    const { error: emailError } = await supabase.functions.invoke('send-workplace-invitation', {
      body: {
        workplaceId,
        email,
        token,
        role
      }
    });

    if (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't throw error here as the invitation was created successfully
    }
  },

  // Accept workplace invitation
  async acceptInvitation(token: string): Promise<void> {
    const { data: invitation, error: fetchError } = await supabase
      .from('workplace_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if invitation is still valid
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User must be authenticated to accept invitation');
    }

    // Check if user email matches invitation
    if (user.email !== invitation.email) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('creator_workplace_members')
      .insert({
        workplace_id: invitation.workplace_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by
      });

    if (memberError) throw memberError;

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('workplace_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) throw updateError;
  },

  // Update member role
  async updateMemberRole(memberId: string, role: 'editor' | 'viewer'): Promise<void> {
    const { error } = await supabase
      .from('creator_workplace_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
  },

  // Remove member from workplace
  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('creator_workplace_members')
      .update({ status: 'inactive' })
      .eq('id', memberId);

    if (error) throw error;
  },

  // Get pending invitations
  async getPendingInvitations(workplaceId: string): Promise<WorkplaceInvitation[]> {
    const { data, error } = await supabase
      .from('workplace_invitations')
      .select('*')
      .eq('workplace_id', workplaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Cancel invitation
  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('workplace_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;
  }
};
