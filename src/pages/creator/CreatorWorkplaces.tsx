
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Users, 
  Settings, 
  Mail, 
  Calendar,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CreateWorkplaceDialog from '@/components/creator/CreateWorkplaceDialog';
import WorkplaceInviteDialog from '@/components/creator/WorkplaceInviteDialog';

interface Workplace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id: string;
  member_count: number;
  user_role: 'owner' | 'editor' | 'viewer';
}

const CreatorWorkplaces: React.FC = () => {
  const { user } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null);

  const fetchWorkplaces = async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('creator_workplace_members')
        .select(`
          workplace_id,
          role,
          creator_workplaces (
            id,
            name,
            description,
            created_at,
            owner_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) throw memberError;

      // Get member counts for each workplace
      const workplaceIds = memberData?.map(m => m.workplace_id) || [];
      
      const { data: memberCounts, error: countError } = await supabase
        .from('creator_workplace_members')
        .select('workplace_id')
        .in('workplace_id', workplaceIds)
        .eq('status', 'active');

      if (countError) throw countError;

      // Count members per workplace
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.workplace_id] = (acc[member.workplace_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const formattedWorkplaces: Workplace[] = memberData?.map(member => ({
        id: member.creator_workplaces.id,
        name: member.creator_workplaces.name,
        description: member.creator_workplaces.description,
        created_at: member.creator_workplaces.created_at,
        owner_id: member.creator_workplaces.owner_id,
        member_count: memberCountMap[member.workplace_id] || 0,
        user_role: member.role
      })) || [];

      setWorkplaces(formattedWorkplaces);
    } catch (error: any) {
      toast.error('Failed to load workplaces');
      console.error('Error fetching workplaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkplaces();
  }, [user]);

  const handleInviteMembers = (workplace: Workplace) => {
    setSelectedWorkplace(workplace);
    setShowInviteDialog(true);
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
      <CreatorLayout title="Workplaces">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Workplaces">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Workplaces</h2>
            <p className="text-muted-foreground">
              Manage your collaborative creator workspaces
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workplace
          </Button>
        </div>

        {workplaces.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workplaces yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workplace to collaborate with other creators
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workplace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workplaces.map((workplace) => (
              <Card key={workplace.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workplace.name}</CardTitle>
                        <Badge className={getRoleColor(workplace.user_role)}>
                          {workplace.user_role}
                        </Badge>
                      </div>
                    </div>
                    
                    {workplace.user_role === 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleInviteMembers(workplace)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Invite Members
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {workplace.description && (
                    <CardDescription className="mb-4">
                      {workplace.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{workplace.member_count} member{workplace.member_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(workplace.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateWorkplaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchWorkplaces();
          setShowCreateDialog(false);
        }}
      />

      {selectedWorkplace && (
        <WorkplaceInviteDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          workplace={selectedWorkplace}
          onSuccess={() => {
            setShowInviteDialog(false);
            toast.success('Invitation sent successfully');
          }}
        />
      )}
    </CreatorLayout>
  );
};

export default CreatorWorkplaces;
