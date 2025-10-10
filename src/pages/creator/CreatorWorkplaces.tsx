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
  ChevronRight,
  Settings,
  Share2
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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 bg-gradient-to-r from-orange-500 to-purple-600"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Workspaces">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Workspaces</h1>
            <p className="text-sm text-gray-600 max-w-2xl">
              Collaborate and manage your creative projects with team members in dedicated workspaces
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 rounded-xl font-semibold w-full sm:w-auto group"
          >
            <Plus className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Create Workspace</span>
            <span className="sm:hidden">New Workspace</span>
          </Button>
        </div>

        {workplaces.length === 0 ? (
          <Card className="bg-gradient-to-br from-orange-50/80 to-purple-50/80 border-0 shadow-lg backdrop-blur-sm">
            <CardContent className="py-16 sm:py-20">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">No workspaces yet</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Start collaborating by creating your first workspace. Invite team members and organize your projects.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-2.5 rounded-xl font-semibold mt-4 group"
                >
                  <Plus className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                  Create Your First Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="sm:hidden space-y-4">
              {workplaces.map((workplace) => (
                <Card 
                  key={workplace.id} 
                  className="bg-white/95 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden group"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-lg truncate">{workplace.name}</h3>
                              {workplace.user_role === 'owner' && (
                                <Badge className="bg-gradient-to-r from-orange-500/20 to-purple-600/20 text-gray-800 border-0 px-2 py-1 text-xs font-medium">
                                  Owner
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center text-gray-700">
                                <User className="h-4 w-4 mr-1.5" />
                                <span className="text-sm font-medium">{workplace.member_count} member{workplace.member_count !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-orange-500 transition-colors rounded-lg font-medium"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Invite
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-500 transition-colors rounded-lg font-medium"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900">Workplaces</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        {workplaces.length} workplace{workplaces.length !== 1 ? 's' : ''} • Manage your collaborative spaces
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Total members across all workplaces</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-orange-50/50 to-purple-50/50 hover:bg-transparent">
                        <TableHead className="text-gray-800 font-semibold py-4 text-base">Workplace Name</TableHead>
                        <TableHead className="text-gray-800 font-semibold py-4 text-base">Role</TableHead>
                        <TableHead className="text-gray-800 font-semibold py-4 text-base">Members</TableHead>
                        <TableHead className="text-gray-800 font-semibold py-4 text-base">Actions</TableHead>
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
