
import React from 'react';
import { useWorkplaceContext } from '@/contexts/WorkplaceContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';

const WorkplaceSelector: React.FC = () => {
  const { 
    currentWorkplace, 
    workplaces, 
    selectedWorkplaceId, 
    setSelectedWorkplaceId,
    userRole,
    loading 
  } = useWorkplaceContext();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading workplaces...</span>
      </div>
    );
  }

  const getRoleBadgeColor = (role: 'owner' | 'editor' | 'viewer') => {
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

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedWorkplaceId || 'personal'} onValueChange={(value) => {
          setSelectedWorkplaceId(value === 'personal' ? null : value);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Content
              </div>
            </SelectItem>
            {workplaces.map((workplace) => (
              <SelectItem key={workplace.id} value={workplace.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{workplace.name}</span>
                  <Badge className={getRoleBadgeColor(workplace.user_role)} variant="secondary">
                    {workplace.user_role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {currentWorkplace && userRole && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <Badge className={getRoleBadgeColor(userRole)} variant="secondary">
            {userRole}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default WorkplaceSelector;
