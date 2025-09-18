import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Star, 
  Upload, 
  Activity as ActivityIcon 
} from 'lucide-react';
import { Activity } from '@/services/activityService';

interface ActivityFiltersProps {
  selectedType: Activity['activity_type'] | 'all';
  onTypeChange: (type: Activity['activity_type'] | 'all') => void;
  activityCounts?: Record<Activity['activity_type'] | 'all', number>;
}

const filterOptions: Array<{
  value: Activity['activity_type'] | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}> = [
  {
    value: 'all',
    label: 'All Activities',
    icon: ActivityIcon,
    gradient: 'from-gray-500 to-gray-600'
  },
  {
    value: 'enrollment',
    label: 'Enrollments',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    value: 'booking',
    label: 'Bookings',
    icon: Calendar,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    value: 'payment',
    label: 'Payments',
    icon: CreditCard,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    value: 'review',
    label: 'Reviews',
    icon: Star,
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    value: 'content_published',
    label: 'Published',
    icon: Upload,
    gradient: 'from-indigo-500 to-purple-500'
  }
];

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedType,
  onTypeChange,
  activityCounts = {}
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filterOptions.map((option) => {
        const IconComponent = option.icon;
        const isSelected = selectedType === option.value;
        const count = activityCounts[option.value] || 0;

        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange(option.value)}
            className={`inline-flex items-center gap-2 ${
              isSelected 
                ? `bg-gradient-to-r ${option.gradient} text-white border-0 hover:opacity-90` 
                : 'hover:border-primary/50'
            }`}
          >
            <IconComponent className="h-4 w-4" />
            {option.label}
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className={`ml-1 text-xs ${
                  isSelected 
                    ? 'bg-white/20 text-white hover:bg-white/30' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default ActivityFilters;