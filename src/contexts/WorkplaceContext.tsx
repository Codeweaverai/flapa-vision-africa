
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Workplace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  user_role: 'owner' | 'editor' | 'viewer';
}

interface WorkplaceContextType {
  currentWorkplace: Workplace | null;
  workplaces: Workplace[];
  selectedWorkplaceId: string | null;
  userRole: 'owner' | 'editor' | 'viewer' | null;
  canEdit: boolean;
  canInvite: boolean;
  canViewAttendees: boolean;
  canPublish: boolean;
  loading: boolean;
  setSelectedWorkplaceId: (id: string | null) => void;
  refreshWorkplaces: () => Promise<void>;
}

const WorkplaceContext = createContext<WorkplaceContextType | undefined>(undefined);

interface WorkplaceProviderProps {
  children: ReactNode;
}

export const WorkplaceProvider: React.FC<WorkplaceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceIdState] = useState<string | null>(null);
  const [currentWorkplace, setCurrentWorkplace] = useState<Workplace | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = currentWorkplace?.user_role || null;

  // Calculate permissions based on user role
  const canEdit = userRole === 'owner' || userRole === 'editor';
  const canInvite = userRole === 'owner';
  const canViewAttendees = userRole === 'owner';
  const canPublish = userRole === 'owner' || userRole === 'editor';

  const setSelectedWorkplaceId = (id: string | null) => {
    setSelectedWorkplaceIdState(id);
    if (id) {
      localStorage.setItem('selectedWorkplaceId', id);
    } else {
      localStorage.removeItem('selectedWorkplaceId');
    }
  };

  const fetchWorkplaces = async (): Promise<Workplace[]> => {
    if (!user) return [];

    try {
      // Fetch owned workplaces
      const { data: ownedWorkplaces, error: ownedError } = await supabase
        .from('creator_workplaces')
        .select('id, name, description, owner_id')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Fetch member workplaces
      const { data: memberWorkplaces, error: memberError } = await supabase
        .from('creator_workplace_members')
        .select(`
          role,
          creator_workplaces!inner (
            id,
            name,
            description,
            owner_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('creator_workplaces.owner_id', user.id);

      if (memberError) throw memberError;

      // Process owned workplaces
      const ownedWorkplacesWithRole: Workplace[] = (ownedWorkplaces || []).map(wp => ({
        ...wp,
        user_role: 'owner' as const
      }));

      // Process member workplaces
      const memberWorkplacesWithRole: Workplace[] = (memberWorkplaces || []).map((member: any) => ({
        id: member.creator_workplaces.id,
        name: member.creator_workplaces.name,
        description: member.creator_workplaces.description,
        owner_id: member.creator_workplaces.owner_id,
        user_role: member.role
      }));

      return [...ownedWorkplacesWithRole, ...memberWorkplacesWithRole];
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      toast.error('Failed to load workplaces');
      return [];
    }
  };

  const refreshWorkplaces = async () => {
    setLoading(true);
    const fetchedWorkplaces = await fetchWorkplaces();
    setWorkplaces(fetchedWorkplaces);
    
    // Update current workplace if it's selected
    if (selectedWorkplaceId) {
      const current = fetchedWorkplaces.find(wp => wp.id === selectedWorkplaceId);
      setCurrentWorkplace(current || null);
    }
    
    setLoading(false);
  };

  // Initialize workplaces and selected workplace from localStorage
  useEffect(() => {
    if (user) {
      const savedWorkplaceId = localStorage.getItem('selectedWorkplaceId');
      if (savedWorkplaceId) {
        setSelectedWorkplaceIdState(savedWorkplaceId);
      }
      refreshWorkplaces();
    } else {
      setWorkplaces([]);
      setCurrentWorkplace(null);
      setSelectedWorkplaceIdState(null);
      setLoading(false);
    }
  }, [user]);

  // Update current workplace when selection changes
  useEffect(() => {
    if (selectedWorkplaceId && workplaces.length > 0) {
      const workplace = workplaces.find(wp => wp.id === selectedWorkplaceId);
      setCurrentWorkplace(workplace || null);
    } else {
      setCurrentWorkplace(null);
    }
  }, [selectedWorkplaceId, workplaces]);

  const value: WorkplaceContextType = {
    currentWorkplace,
    workplaces,
    selectedWorkplaceId,
    userRole,
    canEdit,
    canInvite,
    canViewAttendees,
    canPublish,
    loading,
    setSelectedWorkplaceId,
    refreshWorkplaces
  };

  return (
    <WorkplaceContext.Provider value={value}>
      {children}
    </WorkplaceContext.Provider>
  );
};

export const useWorkplaceContext = (): WorkplaceContextType => {
  const context = useContext(WorkplaceContext);
  if (context === undefined) {
    throw new Error('useWorkplaceContext must be used within a WorkplaceProvider');
  }
  return context;
};
