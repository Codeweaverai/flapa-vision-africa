import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award, Star } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface CourseDetailActionsProps {
  course: {
    id: string;
    title: string;
    price: number;
    is_free: boolean;
    duration_minutes: number;
    difficulty_level: string;
  };
  isEnrolled: boolean;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
}

const CourseDetailActions: React.FC<CourseDetailActionsProps> = ({
  course,
  isEnrolled,
  enrollmentCount,
  rating,
  reviewCount
}) => {
  const { user } = useAuth();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Price and Actions */}
          <div className="text-center">
            {course.is_free ? (
              <div className="text-2xl font-bold text-green-600 mb-4">Free</div>
            ) : (
              <div className="text-3xl font-bold text-primary mb-4">
                <PriceDisplay amount={course.price} originalCurrency="USD" />
              </div>
            )}

            {isEnrolled ? (
              <Button 
                className="w-full mb-3" 
                size="lg"
                onClick={() => window.location.href = `/learning/course/${course.id}`}
              >
                Continue Learning
              </Button>
            ) : (
              <div className="space-y-2">
                <AddToCartButton
                  itemType="course"
                  itemId={course.id}
                  itemName={course.title}
                  price={course.price}
                  className="w-full"
                />
                {!course.is_free && (
                  <p className="text-sm text-gray-600">30-day money-back guarantee</p>
                )}
              </div>
            )}
          </div>

          {/* Course Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Duration:</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDuration(course.duration_minutes)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Students:</span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{enrollmentCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Level:</span>
              <Badge variant="outline">{course.difficulty_level}</Badge>
            </div>

            {rating > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-600">({reviewCount})</span>
                </div>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">This course includes:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span>Certificate of completion</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span>Lifetime access</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span>Access on mobile and desktop</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseDetailActions;
