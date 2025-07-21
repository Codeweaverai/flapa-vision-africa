
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, ExternalLink, MapPin, Calendar, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

interface CreatorProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  location?: string;
  website?: string;
  social_links?: any;
}

interface CreatorStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
}

interface Course {
  id: string;
  title: string;
  summary: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
}

const CreatorPublicProfile = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [stats, setStats] = useState<CreatorStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!creatorId) {
        setError('Creator ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch creator profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, bio, avatar_url')
          .eq('id', creatorId)
          .eq('is_creator', true)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          setError('Creator not found');
          setLoading(false);
          return;
        }

        if (!profileData) {
          setError('Creator not found');
          setLoading(false);
          return;
        }

        setCreator(profileData);

        // Fetch creator courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, summary, thumbnail_url, price, is_free, category, difficulty_level, duration_minutes')
          .eq('creator_id', creatorId)
          .eq('is_published', true);

        if (coursesError) {
          console.error('Courses error:', coursesError);
        } else {
          setCourses(coursesData || []);
        }

        // Calculate stats
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(course => course.id);
          
          // Get total enrollments
          const { data: enrollmentsData } = await supabase
            .from('course_enrollments')
            .select('user_id')
            .in('course_id', courseIds);

          const uniqueStudents = new Set(enrollmentsData?.map(e => e.user_id) || []);

          // Get reviews
          const { data: reviewsData } = await supabase
            .from('course_reviews')
            .select('rating')
            .in('course_id', courseIds);

          const totalReviews = reviewsData?.length || 0;
          const averageRating = totalReviews > 0 
            ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

          setStats({
            totalCourses: coursesData.length,
            totalStudents: uniqueStudents.size,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews
          });
        }
      } catch (err) {
        console.error('Error fetching creator data:', err);
        setError('Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorId]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !creator) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Creator Not Found</h1>
            <p className="text-gray-600 mb-4">{error || 'The creator profile you are looking for does not exist.'}</p>
            <Button asChild>
              <Link to="/creators">Browse Creators</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="container mx-auto px-4 py-8">
          {/* Creator Header */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-24 h-24 mx-auto md:mx-0">
                  <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                  <AvatarFallback className="text-2xl">
                    {creator.full_name?.split(' ').map(n => n[0]).join('') || creator.username?.[0] || 'C'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{creator.full_name || creator.username}</h1>
                  <p className="text-muted-foreground mb-4">{creator.bio}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>{stats.totalCourses} Courses</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{stats.totalStudents} Students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{stats.averageRating} ({stats.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Badge variant="secondary" className="text-center">
                    <Award className="w-3 h-3 mr-1" />
                    Verified Creator
                  </Badge>
                  <Badge variant="outline" className="text-center">
                    Expert Level
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Courses */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Courses by {creator.full_name || creator.username}</h2>
            
            {courses.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">This creator hasn't published any courses yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="group hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-200 to-purple-200 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="mb-2">
                          {course.category}
                        </Badge>
                        <Badge variant={course.difficulty_level === 'beginner' ? 'secondary' : course.difficulty_level === 'intermediate' ? 'default' : 'destructive'}>
                          {course.difficulty_level}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{course.summary}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold">
                            {course.is_free ? 'Free' : `$${course.price}`}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                          </span>
                        </div>
                        
                        <Button asChild size="sm">
                          <Link to={`/courses/${course.id}`}>
                            View Course
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatorPublicProfile;
