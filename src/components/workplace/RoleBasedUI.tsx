
import React, { ReactNode } from 'react';
import { useWorkplaceContext } from '@/contexts/WorkplaceContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Shield, Eye } from 'lucide-react';

interface RoleBasedComponentProps {
  children: ReactNode;
  requiredRole?: 'viewer' | 'editor' | 'owner';
  allowedRoles?: ('viewer' | 'editor' | 'owner')[];
  fallback?: ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
}

export const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  requiredRole,
  allowedRoles,
  fallback,
  showTooltip = true,
  tooltipMessage
}) => {
  const { userRole, canEdit, canInvite, canViewAttendees } = useWorkplaceContext();

  const hasPermission = () => {
    if (!userRole) return false;

    if (requiredRole) {
      const roleHierarchy = { viewer: 1, editor: 2, owner: 3 };
      return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    if (allowedRoles) {
      return allowedRoles.includes(userRole);
    }

    return true;
  };

  const getTooltipMessage = () => {
    if (tooltipMessage) return tooltipMessage;
    if (requiredRole) return `Requires ${requiredRole} permissions or higher`;
    if (allowedRoles) return `Requires one of: ${allowedRoles.join(', ')} permissions`;
    return 'Insufficient permissions';
  };

  if (!hasPermission()) {
    const lockIcon = (
      <div className="flex items-center gap-1 text-gray-400">
        <Lock className="h-4 w-4" />
        {fallback}
      </div>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {lockIcon}
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipMessage()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return lockIcon;
  }

  return <>{children}</>;
};

export const CanEdit: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  return (
    <RoleBasedComponent allowedRoles={['editor', 'owner']} fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
};

export const CanInvite: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  return (
    <RoleBasedComponent requiredRole="owner" fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
};

export const CanViewAttendees: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  return (
    <RoleBasedComponent requiredRole="owner" fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
};

export const RoleBadge: React.FC<{ role?: string | null }> = ({ role }) => {
  if (!role) return null;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'owner':
        return { 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: <Shield className="h-3 w-3" /> 
        };
      case 'editor':
        return { 
          color: 'bg-blue-100 text-blue-800', 
          icon: <Lock className="h-3 w-3" /> 
        };
      case 'viewer':
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <Eye className="h-3 w-3" /> 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: null 
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge className={`${config.color} flex items-center gap-1`} variant="secondary">
      {config.icon}
      {role}
    </Badge>
  );
};
