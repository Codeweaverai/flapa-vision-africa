import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  user_id: string;
  activity_type: 'enrollment' | 'booking' | 'payment' | 'review' | 'content_published';
  entity_type: 'course' | 'event' | 'order' | 'review';
  entity_id: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityWithRelativeTime extends Activity {
  relative_time: string;
  icon: string;
  gradient: string;
}

// Utility function to format timestamps to relative time
export const formatRelativeTime = (timestamp: string): string => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

// Utility function to get icon for activity type
export const getActivityIcon = (activityType: Activity['activity_type']): string => {
  const iconMap = {
    enrollment: 'BookOpen',
    booking: 'Calendar',
    payment: 'CreditCard',
    review: 'Star',
    content_published: 'Upload'
  };
  return iconMap[activityType] || 'Activity';
};

// Utility function to get gradient for activity type
export const getActivityGradient = (activityType: Activity['activity_type']): string => {
  const gradientMap = {
    enrollment: 'from-blue-500 to-cyan-500',
    booking: 'from-green-500 to-emerald-500',
    payment: 'from-purple-500 to-pink-500',
    review: 'from-yellow-500 to-orange-500',
    content_published: 'from-indigo-500 to-purple-500'
  };
  return gradientMap[activityType] || 'from-gray-500 to-gray-600';
};

// Fetch recent activities for a user
export const fetchRecentActivities = async (userId: string, limit = 20): Promise<ActivityWithRelativeTime[]> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data) return [];

    return data.map(activity => ({
      ...activity,
      relative_time: formatRelativeTime(activity.created_at),
      icon: getActivityIcon(activity.activity_type),
      gradient: getActivityGradient(activity.activity_type)
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    // Return mock data as fallback
    return getMockActivities(userId);
  }
};

// Fetch activities by type
export const fetchActivitiesByType = async (
  userId: string,
  activityType: Activity['activity_type'],
  limit = 20
): Promise<ActivityWithRelativeTime[]> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data) return [];

    return data.map(activity => ({
      ...activity,
      relative_time: formatRelativeTime(activity.created_at),
      icon: getActivityIcon(activity.activity_type),
      gradient: getActivityGradient(activity.activity_type)
    }));
  } catch (error) {
    console.error('Error fetching activities by type:', error);
    return [];
  }
};

// Create a manual activity (for testing or special cases)
export const createActivity = async (
  userId: string,
  activityType: Activity['activity_type'],
  entityType: Activity['entity_type'],
  entityId: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<Activity | null> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        entity_type: entityType,
        entity_id: entityId,
        message,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    return null;
  }
};

// Subscribe to real-time activity updates
export const subscribeToActivities = (
  userId: string,
  onActivityUpdate: (activity: Activity) => void
) => {
  const subscription = supabase
    .channel('activities-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('New activity:', payload);
        onActivityUpdate(payload.new as Activity);
      }
    )
    .subscribe();

  return subscription;
};

// Mock data for fallback
const getMockActivities = (userId: string): ActivityWithRelativeTime[] => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      user_id: userId,
      activity_type: 'content_published',
      entity_type: 'course',
      entity_id: 'mock-course-1',
      message: 'Published course "Introduction to React"',
      metadata: { course_title: 'Introduction to React', category: 'Programming' },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: '2',
      user_id: userId,
      activity_type: 'enrollment',
      entity_type: 'course',
      entity_id: 'mock-course-2',
      message: 'New student enrolled in "Advanced JavaScript"',
      metadata: { course_title: 'Advanced JavaScript', student_id: 'mock-student' },
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    },
    {
      id: '3',
      user_id: userId,
      activity_type: 'payment',
      entity_type: 'order',
      entity_id: 'mock-order-1',
      message: 'Payment completed for order #12345678',
      metadata: { amount: 99.99, currency: 'USD', payment_method: 'stripe' },
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    },
    {
      id: '4',
      user_id: userId,
      activity_type: 'review',
      entity_type: 'course',
      entity_id: 'mock-course-3',
      message: 'New review for "Web Development Basics"',
      metadata: { course_title: 'Web Development Basics', rating: 5, reviewer_id: 'mock-reviewer' },
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
    },
    {
      id: '5',
      user_id: userId,
      activity_type: 'booking',
      entity_type: 'event',
      entity_id: 'mock-event-1',
      message: 'New booking for "React Conference 2024"',
      metadata: { event_title: 'React Conference 2024', attendee_id: 'mock-attendee', ticket_quantity: 2 },
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    }
  ];

  return mockActivities.map(activity => ({
    ...activity,
    relative_time: formatRelativeTime(activity.created_at),
    icon: getActivityIcon(activity.activity_type),
    gradient: getActivityGradient(activity.activity_type)
  }));
};