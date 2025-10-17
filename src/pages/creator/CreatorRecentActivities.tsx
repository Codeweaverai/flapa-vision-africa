import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Activity as ActivityIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreatorLayout from '@/components/creator/CreatorLayout';
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

  if (loading) {
    return (
      <CreatorLayout title="Recent Activities">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Recent Activities">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-gray-600">Track your recent course enrollments, event bookings, payments, and more</p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 shadow-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
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
                <Card key={i} className="p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-100 to-purple-100" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24 bg-gradient-to-r from-orange-100 to-purple-100" />
                        <Skeleton className="h-4 w-20 bg-gradient-to-r from-orange-100 to-purple-100" />
                      </div>
                      <Skeleton className="h-4 w-full bg-gradient-to-r from-orange-100 to-purple-100" />
                      <Skeleton className="h-3 w-32 bg-gradient-to-r from-orange-100 to-purple-100" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : activities.length > 0 ? (
            // Activities
            activities.map((activity) => (
              <ActivityItem 
                key={activity.id} 
                activity={activity} 
                className="shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-100"
              />
            ))
          ) : (
            // Empty state
            <Card className="p-12 text-center shadow-md border-gray-100">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-gradient-to-r from-orange-50 to-purple-50 shadow-inner">
                  <ActivityIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">No Activities Yet</h3>
                  <p className="text-gray-500 mb-4">
                    {selectedType === 'all' 
                      ? "Start creating courses, events, or engaging with students to see activities here."
                      : `No ${selectedType} activities found. Try selecting a different filter.`
                    }
                  </p>
                  {selectedType !== 'all' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleTypeChange('all')}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 shadow-sm"
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
            <Button 
              variant="outline" 
              disabled
              className="border-gray-200 text-gray-500 shadow-sm"
            >
              Load More Activities
              <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
            </Button>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorRecentActivities;
