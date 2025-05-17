
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarCheck, Users, Calendar, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    events: 0,
    registrations: 0,
    users: 0,
  });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        // Get event count
        const { count: eventsCount, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
        
        // Get registration count
        const { count: registrationsCount, error: registrationsError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
        
        // Get user count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (eventsError || registrationsError || usersError) {
          console.error('Error fetching stats:', { eventsError, registrationsError, usersError });
        } else {
          setStats({
            events: eventsCount || 0,
            registrations: registrationsCount || 0,
            users: usersCount || 0,
          });
        }
      } catch (error) {
        console.error('Unexpected error fetching stats:', error);
      }
    };

    checkAdminStatus();
    fetchStats();
  }, [navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-center">
            <p className="text-lg">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isAdmin === false) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have admin permissions to access this page.
          </AlertDescription>
        </Alert>
        <p className="text-center my-8">
          Please contact the site administrator if you believe this is an error.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Welcome to the Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your events, user registrations, and more from this central dashboard.
        </p>
        
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.events}</div>
              <p className="text-xs text-muted-foreground pt-1">
                Events created
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Registrations
              </CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.registrations}</div>
              <p className="text-xs text-muted-foreground pt-1">
                Event registrations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground pt-1">
                Registered users
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-8">
          <Button onClick={() => navigate('/admin/events')}>
            Manage Events
          </Button>
          <Button onClick={() => navigate('/admin/users')} variant="outline">
            View Users
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
