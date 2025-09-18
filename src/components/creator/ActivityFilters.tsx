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
  selectedGradient: string;
}> = [
  {
    value: 'all',
    label: 'All Activities',
    icon: ActivityIcon,
    gradient: 'from-gray-400 to-gray-500',
    selectedGradient: 'from-orange-500 to-purple-600'
  },
  {
    value: 'enrollment',
    label: 'Enrollments',
    icon: BookOpen,
    gradient: 'from-orange-400 to-purple-500',
    selectedGradient: 'from-orange-500 to-purple-600'
  },
  {
    value: 'booking',
    label: 'Bookings',
    icon: Calendar,
    gradient: 'from-orange-400 to-purple-500',
    selectedGradient: 'from-orange-500 to-purple-600'
  },
  {
    value: 'payment',
    label: 'Payments',
    icon: CreditCard,
    gradient: 'from-orange-400 to-purple-500',
    selectedGradient: 'from-orange-500 to-purple-600'
  },
  {
    value: 'review',
    label: 'Reviews',
    icon: Star,
    gradient: 'from-orange-400 to-purple-500',
    selectedGradient: 'from-orange-500 to-purple-600'
  },
  {
    value: 'content_published',
    label: 'Published',
    icon: Upload,
    gradient: 'from-orange-400 to-purple-500',
    selectedGradient: 'from-orange-500 to-purple-600'
  }
];

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedType,
  onTypeChange,
  activityCounts = {}
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6 p-1 bg-gray-50 rounded-lg shadow-sm">
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
            className={`relative inline-flex items-center gap-2 transition-all duration-200 ${
              isSelected 
                ? `bg-gradient-to-r ${option.selectedGradient} text-white shadow-md hover:shadow-lg border-0` 
                : `bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50 shadow-sm hover:shadow-md`
            } rounded-full px-4 py-2 font-medium`}
          >
            <IconComponent className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
            <span>{option.label}</span>
            {count > 0 && (
              <Badge 
                className={`ml-1 text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full ${
                  isSelected 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-gradient-to-r from-orange-100 to-purple-100 text-gray-700 border-orange-200'
                } shadow-inner`}
              >
                {count}
              </Badge>
            )}
            {isSelected && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full"></div>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default ActivityFilters;
