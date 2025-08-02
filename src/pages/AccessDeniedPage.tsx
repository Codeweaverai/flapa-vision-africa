
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { useWorkplaceContext } from '@/contexts/WorkplaceContext';
import Layout from '@/components/layout/Layout';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkplace, userRole } = useWorkplaceContext();

  const getPermissionMessage = () => {
    if (!currentWorkplace) {
      return "You don't have access to this workspace or it doesn't exist.";
    }

    if (userRole === 'viewer') {
      return "You have viewer permissions in this workspace. Contact the workspace owner to request editor or owner permissions.";
    }

    return "You don't have the required permissions to access this content.";
  };

  const getRequiredPermissions = () => {
    const url = window.location.pathname;
    
    if (url.includes('/create') || url.includes('/edit')) {
      return "Editor or Owner permissions required";
    }
    
    if (url.includes('/attendees') || url.includes('/members')) {
      return "Owner permissions required";
    }
    
    return "Higher permissions required";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-red-100 p-3 w-fit">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <p className="mb-3">{getPermissionMessage()}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800">
                  {getRequiredPermissions()}
                </p>
              </div>
            </div>
            
            {currentWorkplace && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Workspace Details</h4>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Name:</strong> {currentWorkplace.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Your Role:</strong> {userRole || 'Not a member'}
                </p>
              </div>
            )}
            
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => navigate(-1)} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                onClick={() => navigate('/creator/workplaces')} 
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                View My Workspaces
              </Button>
              
              <Button 
                onClick={() => navigate('/creator/dashboard')} 
                variant="ghost" 
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
            
            {currentWorkplace && userRole === 'viewer' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Need more access?</strong> Contact the workspace owner to upgrade your permissions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccessDeniedPage;
