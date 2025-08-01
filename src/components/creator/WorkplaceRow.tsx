
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  Mail, 
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import WorkplaceInviteDialog from './WorkplaceInviteDialog';
import WorkspaceDetailView from './WorkspaceDetailView';

interface Workplace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id: string;
  member_count: number;
  user_role: 'owner' | 'editor' | 'viewer';
}

interface WorkplaceRowProps {
  workplace: Workplace;
  onWorkplaceUpdate: () => void;
}

const WorkplaceRow: React.FC<WorkplaceRowProps> = ({ workplace, onWorkplaceUpdate }) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 h-6 w-6"
            >
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{workplace.name}</div>
                {workplace.description && (
                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {workplace.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <Badge className={getRoleColor(workplace.user_role)}>
            {workplace.user_role === 'owner' ? 'You' : workplace.user_role}
          </Badge>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{workplace.member_count} member{workplace.member_count !== 1 ? 's' : ''}</span>
          </div>
        </TableCell>
        
        <TableCell>
          {workplace.user_role === 'owner' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInviteDialog(true)}
              className="gap-1"
            >
              <Mail className="h-3 w-3" />
              Invite
            </Button>
          )}
        </TableCell>
        
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="gap-1"
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
        </TableCell>
      </TableRow>

      {showDetails && (
        <TableRow>
          <TableCell colSpan={5} className="p-0 bg-muted/20">
            <WorkspaceDetailView workplace={workplace} onUpdate={onWorkplaceUpdate} />
          </TableCell>
        </TableRow>
      )}

      {workplace.user_role === 'owner' && (
        <WorkplaceInviteDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          workplace={workplace}
          onSuccess={() => {
            setShowInviteDialog(false);
            onWorkplaceUpdate();
          }}
        />
      )}
    </>
  );
};

export default WorkplaceRow;
