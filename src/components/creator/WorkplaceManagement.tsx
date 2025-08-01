
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Mail, Crown, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { workplaceService, type Workplace, type WorkplaceMember } from '@/services/workplaceService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const WorkplaceManagement = () => {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null);
  const [members, setMembers] = useState<WorkplaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Form states
  const [newWorkplaceName, setNewWorkplaceName] = useState('');
  const [newWorkplaceDescription, setNewWorkplaceDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');

  useEffect(() => {
    loadWorkplaces();
  }, []);

  useEffect(() => {
    if (selectedWorkplace) {
      loadMembers();
    }
  }, [selectedWorkplace]);

  const loadWorkplaces = async () => {
    try {
      const data = await workplaceService.getUserWorkplaces();
      setWorkplaces(data);
      if (data.length > 0 && !selectedWorkplace) {
        setSelectedWorkplace(data[0]);
      }
    } catch (error) {
      console.error('Error loading workplaces:', error);
      toast.error('Failed to load workplaces');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedWorkplace) return;
    try {
      const data = await workplaceService.getWorkplaceMembers(selectedWorkplace.id);
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    }
  };

  const handleCreateWorkplace = async () => {
    if (!newWorkplaceName.trim()) return;

    try {
      const workplace = await workplaceService.createWorkplace(
        newWorkplaceName.trim(),
        newWorkplaceDescription.trim() || undefined
      );
      
      setWorkplaces(prev => [workplace, ...prev]);
      setSelectedWorkplace(workplace);
      setNewWorkplaceName('');
      setNewWorkplaceDescription('');
      setIsCreateDialogOpen(false);
      toast.success('Workplace created successfully!');
    } catch (error) {
      console.error('Error creating workplace:', error);
      toast.error('Failed to create workplace');
    }
  };

  const handleInviteUser = async () => {
    if (!selectedWorkplace || !inviteEmail.trim()) return;

    try {
      await workplaceService.inviteUser(selectedWorkplace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setInviteRole('viewer');
      setIsInviteDialogOpen(false);
      toast.success('Invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      await workplaceService.updateMemberRole(memberId, newRole);
      await loadMembers();
      toast.success('Member role updated successfully!');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await workplaceService.removeMember(memberId);
      await loadMembers();
      toast.success('Member removed successfully!');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'editor': return <Edit className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Creator Workplaces</h2>
          <p className="text-muted-foreground">Collaborate with your team on courses and events</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Workplace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workplace</DialogTitle>
              <DialogDescription>
                Create a collaborative space for your team to work on courses and events together.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workplace-name">Workplace Name</Label>
                <Input
                  id="workplace-name"
                  value={newWorkplaceName}
                  onChange={(e) => setNewWorkplaceName(e.target.value)}
                  placeholder="e.g., Marketing Team"
                />
              </div>
              <div>
                <Label htmlFor="workplace-description">Description (Optional)</Label>
                <Textarea
                  id="workplace-description"
                  value={newWorkplaceDescription}
                  onChange={(e) => setNewWorkplaceDescription(e.target.value)}
                  placeholder="Brief description of this workplace..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkplace} disabled={!newWorkplaceName.trim()}>
                  Create Workplace
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workplaces.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workplaces Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workplace to start collaborating with your team.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workplaces List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Workplaces</CardTitle>
              <CardDescription>Select a workplace to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {workplaces.map((workplace) => (
                <div
                  key={workplace.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWorkplace?.id === workplace.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedWorkplace(workplace)}
                >
                  <h4 className="font-medium">{workplace.name}</h4>
                  {workplace.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {workplace.description}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Workplace Details */}
          {selectedWorkplace && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedWorkplace.name}
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </CardTitle>
                    <CardDescription>
                      {selectedWorkplace.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to collaborate on {selectedWorkplace.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role</Label>
                          <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Viewer - Can view content and analytics
                                </div>
                              </SelectItem>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  Editor - Can create and edit content
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteUser} disabled={!inviteEmail.trim()}>
                            Send Invitation
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Team Members ({members.length})</h4>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {member.profiles?.full_name?.charAt(0) || member.profiles?.username?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium">
                                {member.profiles?.full_name || member.profiles?.username || 'Unknown User'}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={getRoleBadgeColor(member.role)}>
                                  <div className="flex items-center gap-1">
                                    {getRoleIcon(member.role)}
                                    {member.role}
                                  </div>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateMemberRole(member.id, member.role === 'editor' ? 'viewer' : 'editor')}
                                >
                                  {member.role === 'editor' ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Change to Viewer
                                    </>
                                  ) : (
                                    <>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Change to Editor
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkplaceManagement;
