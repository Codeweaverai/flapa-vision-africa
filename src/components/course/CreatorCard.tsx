
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, BookOpen, Award, Globe, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface CreatorProfile {
  id: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  average_rating?: number;
  total_courses?: number;
  total_students?: number;
  total_reviews?: number;
}

interface CreatorCardProps {
  creator: CreatorProfile;
}

const CreatorCard = ({ creator }: CreatorCardProps) => {
  const [coursesCount, setCoursesCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorStats = async () => {
      try {
        setLoading(true);

        // Fetch courses count
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creator.id)
          .eq('is_published', true);

        if (coursesError) throw coursesError;

        // Fetch events count
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id')
          .eq('creator_id', creator.id);

        if (eventsError) throw eventsError;

        setCoursesCount(coursesData?.length || 0);
        setEventsCount(eventsData?.length || 0);

        // If there are courses, fetch additional stats
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(course => course.id);

          // Get total enrollments (students)
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('user_id')
            .in('course_id', courseIds);

          if (!enrollmentsError && enrollmentsData) {
            const uniqueStudents = new Set(enrollmentsData.map(e => e.user_id));
            setStudentsCount(uniqueStudents.size);
          }

          // Get all reviews for creator's courses
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('course_reviews')
            .select('rating')
            .in('course_id', courseIds);

          if (!reviewsError && reviewsData) {
            setTotalReviews(reviewsData.length);
            if (reviewsData.length > 0) {
              const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
              setAverageRating(Math.round(avgRating * 10) / 10);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching creator stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (creator.id) {
      fetchCreatorStats();
    }
  }, [creator.id]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-purple-200 w-full">
      <CardContent className="p-4 sm:p-6">
        <div className="text-center mb-4">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
            <AvatarImage src={creator.avatar_url} />
            <AvatarFallback className="text-base sm:text-lg bg-gradient-to-br from-purple-400 to-orange-400 text-white">
              {creator.full_name?.split(' ').map((n: string) => n[0]).join('') || 'IN'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-1">
            {creator.full_name || 'Anonymous Instructor'}
          </h3>
          <p className="text-sm text-purple-600 mb-3">Course Creator</p>
          
          {/* Creator Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border border-purple-100">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1" />
                <span className="text-xs sm:text-sm font-semibold">
                  {loading ? '...' : averageRating || '0'}
                </span>
              </div>
              <div className="text-xs text-purple-600">Rating</div>
            </div>
            <div className="bg-orange-50 p-2 sm:p-3 rounded-lg border border-orange-100">
              <div className="flex items-center justify-center mb-1">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mr-1" />
                <span className="text-xs sm:text-sm font-semibold">
                  {loading ? '...' : coursesCount}
                </span>
              </div>
              <div className="text-xs text-orange-600">Courses</div>
            </div>
            <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border border-purple-100">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mr-1" />
                <span className="text-xs sm:text-sm font-semibold">
                  {loading ? '...' : studentsCount}
                </span>
              </div>
              <div className="text-xs text-purple-600">Students</div>
            </div>
            <div className="bg-orange-50 p-2 sm:p-3 rounded-lg border border-orange-100">
              <div className="flex items-center justify-center mb-1">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mr-1" />
                <span className="text-xs sm:text-sm font-semibold">
                  {loading ? '...' : totalReviews}
                </span>
              </div>
              <div className="text-xs text-orange-600">Reviews</div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <div className="mb-4">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
              {creator.bio}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            asChild 
            className="w-full text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600"
          >
            <Link to={`/creator/profile/${creator.id}`}>
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              View Profile
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-xs sm:text-sm border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Contact Instructor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorCard;
