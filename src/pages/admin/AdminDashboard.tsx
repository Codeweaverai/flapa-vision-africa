
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const [eventCount, setEventCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total events
        const { count: totalCount, error: totalError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
        
        if (totalError) throw totalError;
        
        // Get upcoming events
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gt('start_time', new Date().toISOString());
          
        if (upcomingError) throw upcomingError;
        
        setEventCount(totalCount || 0);
        setUpcomingEvents(upcomingCount || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div> : eventCount}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Events created in total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div> : upcomingEvents}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Events scheduled in the future
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div> : upcomingEvents}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Events open for registration
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/admin/events/create'}>
            <CardContent className="flex items-center p-6">
              <div>
                <h3 className="font-medium">Create New Event</h3>
                <p className="text-sm text-muted-foreground">Add a new event to your calendar</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/admin/events'}>
            <CardContent className="flex items-center p-6">
              <div>
                <h3 className="font-medium">Manage Events</h3>
                <p className="text-sm text-muted-foreground">View and edit your existing events</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
