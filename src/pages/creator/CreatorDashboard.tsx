
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BookOpen, Users, DollarSign, BarChart, Plus } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [courseCount, setCourseCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchCreatorStats();
    }
  }, [user]);
  
  const fetchCreatorStats = async () => {
    setLoading(true);
    try {
      // Get course count
      const { count: courseCountData, error: courseError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user?.id);
        
      if (courseError) throw courseError;
      
      // Get event count
      const { count: eventCountData, error: eventError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user?.id);
        
      if (eventError) throw eventError;
      
      setCourseCount(courseCountData || 0);
      setEventCount(eventCountData || 0);
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CreatorLayout title="Creator Dashboard">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and events</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/creator/courses/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
          <Button asChild>
            <Link to="/creator/events/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{loading ? '-' : courseCount}</CardTitle>
            <p className="text-muted-foreground">Courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{loading ? '-' : eventCount}</CardTitle>
            <p className="text-muted-foreground">Events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
            <p className="text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">$0</CardTitle>
            <p className="text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>An overview of your recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                courseCount === 0 && eventCount === 0 ? (
                  <div className="bg-muted/20 rounded-md p-6 text-center">
                    <h3 className="font-medium text-lg mb-2">Get Started as a Creator</h3>
                    <p className="text-muted-foreground mb-4">You haven't created any courses or events yet. Get started by creating your first course or event.</p>
                    <div className="flex gap-2 justify-center">
                      <Button asChild>
                        <Link to="/creator/courses/create">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Course
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/creator/events/create">
                          <Calendar className="h-4 w-4 mr-2" />
                          Create Event
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    <p>Your recent activity will appear here</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>An overview of your revenue, enrollments, and engagement</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-12">
              <div className="text-center">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium text-lg mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">Track your revenue, student engagement, and more with our upcoming analytics dashboard.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CreatorLayout>
  );
};

export default CreatorDashboard;
