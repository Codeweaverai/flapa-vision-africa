import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

interface CreatorProfileProps {
  creatorId: string;
  className?: string;
}

interface CreatorStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
}

interface CreatorData {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creatorId, className = '' }) => {
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [stats, setStats] = useState<CreatorStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 4.8,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        // Fetch creator profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url, username')
          .eq('id', creatorId)
          .single();

        if (profileError) throw profileError;

        // Fetch creator courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('is_published', true);

        if (coursesError) throw coursesError;

        // Fetch total students (enrollments)
        const courseIds = coursesData?.map(course => course.id) || [];
        let totalStudents = 0;
        
        if (courseIds.length > 0) {
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('user_id')
            .in('course_id', courseIds);

          if (!enrollmentsError && enrollmentsData) {
            const uniqueStudents = new Set(enrollmentsData.map(e => e.user_id));
            totalStudents = uniqueStudents.size;
          }
        }

        setCreator(profileData);
        setStats({
          totalCourses: coursesData?.length || 0,
          totalStudents,
          averageRating: 4.8, // This would be calculated from actual reviews
          totalReviews: Math.floor(totalStudents * 0.3) // Estimated based on students
        });
      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  if (loading) {
    return (
      <Card className={`bg-light-purple border-0 shadow-lg ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creator) {
    return null;
  }

  return (
    <Card className={`bg-light-purple border-0 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Meet Your Instructor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
            <AvatarFallback>
              {creator.full_name?.split(' ').map(n => n[0]).join('') || creator.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">{creator.full_name || creator.username}</h3>
              <p className="text-sm text-muted-foreground">Course Instructor</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{stats.averageRating}</span>
                <span className="text-muted-foreground">({stats.totalReviews} reviews)</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{stats.totalCourses} Courses</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-primary" />
                <span>{stats.totalStudents} Students</span>
              </div>
            </div>
          </div>
        </div>
        
        {creator.bio && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {creator.bio}
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Award className="w-3 h-3 mr-1" />
              Verified Instructor
            </Badge>
            <Badge variant="outline" className="text-xs">
              Expert Level
            </Badge>
          </div>
          
          {/* View Creator Profile Button */}
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to={`/creator/profile/${creatorId}`} className="flex items-center justify-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Creator Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorProfile;
