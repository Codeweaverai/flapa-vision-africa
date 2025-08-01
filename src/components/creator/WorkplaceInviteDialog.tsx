
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface Workplace {
  id: string;
  name: string;
  description: string | null;
  user_role: string;
}

interface WorkplaceInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workplace: Workplace;
  onSuccess: () => void;
}

const WorkplaceInviteDialog: React.FC<WorkplaceInviteDialogProps> = ({
  open,
  onOpenChange,
  workplace,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to send invitations');
        return;
      }

      // Check if user exists and get their profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim())
        .single();

      if (profileData) {
        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('creator_workplace_members')
          .select('id')
          .eq('workplace_id', workplace.id)
          .eq('user_id', profileData.id)
          .single();

        if (existingMember) {
          toast.error('User is already a member of this workplace');
          return;
        }
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabase
        .from('creator_workplace_invitations')
        .select('id')
        .eq('workplace_id', workplace.id)
        .eq('invited_email', email.trim())
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        toast.error('Invitation already sent to this email');
        return;
      }

      // Create invitation
      const invitationToken = uuidv4();
      const { error: inviteError } = await supabase
        .from('creator_workplace_invitations')
        .insert({
          workplace_id: workplace.id,
          invited_email: email.trim(),
          role: role,
          invitation_token: invitationToken,
          invited_by: user.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (inviteError) throw inviteError;

      // Here you would typically send an email with the invitation link
      // For now, we'll just show success
      toast.success('Invitation sent successfully');
      setEmail('');
      setRole('editor');
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to send invitation');
      console.error('Error sending invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {workplace.name}</DialogTitle>
          <DialogDescription>
            Send an invitation to join this workplace
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'editor' | 'viewer') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor - Can create and edit content</SelectItem>
                <SelectItem value="viewer">Viewer - Can only view content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkplaceInviteDialog;
