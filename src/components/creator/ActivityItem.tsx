import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Star, 
  Upload, 
  Activity as ActivityIcon 
} from 'lucide-react';
import { ActivityWithRelativeTime } from '@/services/activityService';

interface ActivityItemProps {
  activity: ActivityWithRelativeTime;
}

const getIconComponent = (iconName: string) => {
  const iconMap = {
    BookOpen,
    Calendar,
    CreditCard,
    Star,
    Upload,
    Activity: ActivityIcon
  };
  return iconMap[iconName as keyof typeof iconMap] || ActivityIcon;
};

const getActivityTypeLabel = (activityType: string) => {
  const labelMap = {
    enrollment: 'Enrollment',
    booking: 'Event Booking',
    payment: 'Payment',
    review: 'Review',
    content_published: 'Published'
  };
  return labelMap[activityType as keyof typeof labelMap] || activityType;
};

const getActivityTypeColor = (activityType: string) => {
  const colorMap = {
    enrollment: 'bg-blue-100 text-blue-800',
    booking: 'bg-green-100 text-green-800',
    payment: 'bg-purple-100 text-purple-800',
    review: 'bg-yellow-100 text-yellow-800',
    content_published: 'bg-indigo-100 text-indigo-800'
  };
  return colorMap[activityType as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const IconComponent = getIconComponent(activity.icon);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary/20">
      <div className="flex items-start gap-4">
        {/* Icon with gradient background */}
        <div className={`p-2 rounded-lg bg-gradient-to-br ${activity.gradient} shadow-sm`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>

        {/* Activity content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Badge 
              variant="secondary" 
              className={getActivityTypeColor(activity.activity_type)}
            >
              {getActivityTypeLabel(activity.activity_type)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {activity.relative_time}
            </span>
          </div>

          <p className="text-sm font-medium text-foreground mb-2">
            {activity.message}
          </p>

          {/* Metadata display */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="text-xs text-muted-foreground">
              {activity.activity_type === 'payment' && activity.metadata.amount && (
                <span className="inline-flex items-center gap-1">
                  <span>Amount: </span>
                  <span className="font-semibold">
                    {activity.metadata.currency} {activity.metadata.amount}
                  </span>
                  {activity.metadata.payment_method && (
                    <span className="ml-2">via {activity.metadata.payment_method}</span>
                  )}
                </span>
              )}

              {activity.activity_type === 'review' && activity.metadata.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{activity.metadata.rating}/5</span>
                </span>
              )}

              {activity.activity_type === 'booking' && activity.metadata.ticket_quantity && (
                <span>
                  Tickets: {activity.metadata.ticket_quantity}
                </span>
              )}

              {(activity.activity_type === 'content_published' || activity.activity_type === 'enrollment') && 
               activity.metadata.category && (
                <span className="inline-flex items-center">
                  Category: {activity.metadata.category}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ActivityItem;