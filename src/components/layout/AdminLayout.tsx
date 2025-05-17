
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AdminLayout = ({ children, activeTab = "dashboard" }: AdminLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    // Only redirect after we've checked auth status
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your site content and settings
          </p>
        </div>
        
        <Tabs defaultValue={activeTab} className="space-y-8">
          <Card className="border-b">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto pt-2">
              <TabsTrigger 
                value="dashboard" 
                className="rounded-t-md data-[state=active]:border-b-2 border-primary px-4 py-3 data-[state=active]:shadow-none"
                onClick={() => navigate('/admin')}
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="rounded-t-md data-[state=active]:border-b-2 border-primary px-4 py-3 data-[state=active]:shadow-none"
                onClick={() => navigate('/admin/events')}
              >
                Events
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="rounded-t-md data-[state=active]:border-b-2 border-primary px-4 py-3 data-[state=active]:shadow-none"
                onClick={() => navigate('/admin/users')}
              >
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-t-md data-[state=active]:border-b-2 border-primary px-4 py-3 data-[state=active]:shadow-none"
                onClick={() => navigate('/admin/settings')}
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </Card>
          
          <TabsContent value={activeTab} className="mt-6">
            <div className="bg-card rounded-md border p-6">
              {children}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLayout;
