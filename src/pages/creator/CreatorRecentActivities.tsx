import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Activity as ActivityIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreatorLayout from '@/components/layout/CreatorLayout';
import ActivityItem from '@/components/creator/ActivityItem';
import ActivityFilters from '@/components/creator/ActivityFilters';
import {
  fetchRecentActivities,
  fetchActivitiesByType,
  subscribeToActivities,
  ActivityWithRelativeTime,
  Activity
} from '@/services/activityService';

const CreatorRecentActivities: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activities, setActivities] = useState<ActivityWithRelativeTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<Activity['activity_type'] | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activityCounts, setActivityCounts] = useState<Record<Activity['activity_type'] | 'all', number>>({
    all: 0,
    enrollment: 0,
    booking: 0,
    payment: 0,
    review: 0,
    content_published: 0
  });

  // Load activities
  const loadActivities = async (type: Activity['activity_type'] | 'all' = selectedType) => {
    if (!user?.id) return;

    try {
      setError(null);
      const data = type === 'all' 
        ? await fetchRecentActivities(user.id, 50)
        : await fetchActivitiesByType(user.id, type, 50);
      
      setActivities(data);
      
      // Calculate activity counts
      if (type === 'all') {
        const counts = data.reduce((acc, activity) => {
          acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
          acc.all = (acc.all || 0) + 1;
          return acc;
        }, {} as Record<Activity['activity_type'] | 'all', number>);
        
        setActivityCounts(prev => ({ ...prev, ...counts }));
      }
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities. Showing sample data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
  };

  // Handle filter change
  const handleTypeChange = async (type: Activity['activity_type'] | 'all') => {
    setSelectedType(type);
    setLoading(true);
    await loadActivities(type);
  };

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToActivities(user.id, (newActivity) => {
      // Add new activity to the list and update counts
      setActivities(prev => {
        const updated = [
          {
            ...newActivity,
            relative_time: 'just now',
            icon: '',
            gradient: ''
          },
          ...prev
        ].slice(0, 50); // Keep only latest 50
        return updated;
      });

      setActivityCounts(prev => ({
        ...prev,
        [newActivity.activity_type]: (prev[newActivity.activity_type] || 0) + 1,
        all: (prev.all || 0) + 1
      }));

      // Show toast notification
      toast({
        title: "New Activity",
        description: newActivity.message,
        duration: 3000,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, toast]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadActivities();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <CreatorLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view your activities.</p>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recent Activities</h1>
            <p className="text-muted-foreground mt-2">
              Track your recent course enrollments, event bookings, payments, and more
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Activity Filters */}
        <ActivityFilters
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          activityCounts={activityCounts}
        />

        {/* Activities List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            <>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : activities.length > 0 ? (
            // Activities
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            // Empty state
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <ActivityIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedType === 'all' 
                      ? "Start creating courses, events, or engaging with students to see activities here."
                      : `No ${selectedType} activities found. Try selecting a different filter.`
                    }
                  </p>
                  {selectedType !== 'all' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleTypeChange('all')}
                    >
                      View All Activities
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Load More (Future Enhancement) */}
        {activities.length >= 50 && (
          <div className="text-center pt-6">
            <Button variant="outline" disabled>
              Load More Activities
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorRecentActivities;