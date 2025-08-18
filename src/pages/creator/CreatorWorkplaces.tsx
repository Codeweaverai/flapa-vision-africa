import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Plus,
  Users,
  User,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CreateWorkplaceDialog from '@/components/creator/CreateWorkplaceDialog';
import WorkplaceRow from '@/components/creator/WorkplaceRow';
import { Badge } from '@/components/ui/badge';

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

  const fetchWorkplaces = async () => {
    if (!user) return;

    try {
      // Fetch workplaces where user is the owner
      const { data: ownedWorkplaces, error: ownedError } = await supabase
        .from('creator_workplaces')
        .select('id, name, description, created_at, owner_id')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Fetch workplaces where user is a member
      const { data: memberWorkplaces, error: memberError } = await supabase
        .from('creator_workplace_members')
        .select(`
          workplace_id,
          role,
          creator_workplaces!inner (
            id,
            name,
            description,
            created_at,
            owner_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('creator_workplaces.owner_id', user.id);

      if (memberError) throw memberError;

      // Process owned workplaces
      const ownedWorkplacesWithDetails = await Promise.all(
        (ownedWorkplaces || []).map(async (workplace) => {
          const { data: members } = await supabase
            .from('creator_workplace_members')
            .select('id')
            .eq('workplace_id', workplace.id)
            .eq('status', 'active');

          return {
            ...workplace,
            member_count: (members?.length || 0) + 1, // +1 for owner
            user_role: 'owner' as const
          };
        })
      );

      // Process member workplaces
      const memberWorkplacesWithDetails = await Promise.all(
        (memberWorkplaces || []).map(async (member: any) => {
          const { data: members } = await supabase
            .from('creator_workplace_members')
            .select('id')
            .eq('workplace_id', member.workplace_id)
            .eq('status', 'active');

          return {
            id: member.creator_workplaces.id,
            name: member.creator_workplaces.name,
            description: member.creator_workplaces.description,
            created_at: member.creator_workplaces.created_at,
            owner_id: member.creator_workplaces.owner_id,
            member_count: (members?.length || 0) + 1, // +1 for owner
            user_role: member.role
          };
        })
      );

      setWorkplaces([...ownedWorkplacesWithDetails, ...memberWorkplacesWithDetails]);
    } catch (error: any) {
      console.error('Error fetching workplaces:', error);
      toast.error('Failed to load workplaces');
      setWorkplaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkplaces();
  }, [user]);

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
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Your Workplaces</h1>
            <p className="text-sm bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Manage your collaborative creator workspaces
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-md w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Workplace</span>
            <span className="sm:hidden">New Workplace</span>
          </Button>
        </div>

        {workplaces.length === 0 ? (
          <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
            <CardContent className="py-8 sm:py-12">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  No workplaces yet
                </h3>
                <p className="text-purple-600 mb-4">
                  Create your first workplace to collaborate with other creators
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workplace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="sm:hidden space-y-3">
              {workplaces.map((workplace) => (
                <Card key={workplace.id} className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{workplace.name}</h3>
                          {workplace.user_role === 'owner' && (
                            <Badge className="bg-orange-100 text-orange-800">Owner</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm mb-3">
                          <div className="flex items-center text-purple-600">
                            <User className="h-4 w-4 mr-1" />
                            {workplace.member_count} member{workplace.member_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-purple-600">
                            Invite
                          </Button>
                          <Button variant="outline" size="sm" className="text-orange-600">
                            View
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Workplaces</CardTitle>
                  <CardDescription className="text-purple-600">
                    Manage and collaborate in your workspaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-purple-800">Workplace Name</TableHead>
                        <TableHead className="text-purple-800">Role</TableHead>
                        <TableHead className="text-purple-800">Members</TableHead>
                        <TableHead className="text-purple-800">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workplaces.map((workplace) => (
                        <WorkplaceRow
                          key={workplace.id}
                          workplace={workplace}
                          onWorkplaceUpdate={fetchWorkplaces}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      <CreateWorkplaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchWorkplaces();
          setShowCreateDialog(false);
          toast.success('Workplace created successfully');
        }}
      />
    </CreatorLayout>
  );
};

export default CreatorWorkplaces;
