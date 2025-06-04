
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, Verified, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
  is_creator: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  enrollments_count: number;
  average_rating: number;
  reviews_count: number;
}

const CreatorPublicProfile: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallRating, setOverallRating] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  const fetchCreatorData = async () => {
    try {
      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, username, is_creator')
        .eq('id', creatorId)
        .single();

      if (profileError) throw profileError;
      setCreator(profileData);

      // Fetch creator's published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id, title, description, thumbnail_url, price, is_free,
          course_enrollments(count),
          course_reviews(rating)
        `)
        .eq('creator_id', creatorId)
        .eq('is_published', true);

      if (coursesError) throw coursesError;

      // Process courses data to calculate ratings and enrollment counts
      const processedCourses = coursesData?.map(course => {
        const enrollments = course.course_enrollments?.length || 0;
        const reviews = course.course_reviews || [];
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
          : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          price: course.price,
          is_free: course.is_free,
          enrollments_count: enrollments,
          average_rating: averageRating,
          reviews_count: reviews.length
        };
      }) || [];

      setCourses(processedCourses);

      // Calculate overall statistics
      const totalEnrollments = processedCourses.reduce((sum, course) => sum + course.enrollments_count, 0);
      const totalReviews = processedCourses.reduce((sum, course) => sum + course.reviews_count, 0);
      const weightedRatingSum = processedCourses.reduce((sum, course) => 
        sum + (course.average_rating * course.reviews_count), 0);
      
      setTotalStudents(totalEnrollments);
      setOverallRating(totalReviews > 0 ? weightedRatingSum / totalReviews : 0);

    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!user) {
      toast.error('Please sign in to send a message');
      return;
    }
    navigate(`/inbox?compose=${creator?.username}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
            <p className="text-muted-foreground">The creator profile you're looking for doesn't exist.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated particles background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-purple-400 rounded-full"></div>
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Creator Header */}
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-gradient-to-r from-orange-400 to-purple-400">
                  <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-r from-orange-100 to-purple-100">
                    {creator.full_name?.split(' ').map(n => n[0]).join('') || 'C'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {creator.full_name}
                      </h1>
                      {creator.is_creator && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-500 text-white">
                          <Verified className="w-3 h-3 mr-1" />
                          Verified Creator
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground">@{creator.username}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      {renderStars(overallRating)}
                      <span className="font-medium">{overallRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">Overall Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">{courses.length}</span>
                      <span className="text-muted-foreground">Courses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{totalStudents}</span>
                      <span className="text-muted-foreground">Students</span>
                    </div>
                  </div>

                  {creator.bio && (
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                      {creator.bio}
                    </p>
                  )}

                  {user && user.id !== creator.id && (
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Published Courses
            </h2>

            {courses.length === 0 ? (
              <Card className="p-8 text-center bg-white/90 backdrop-blur-sm">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No published courses yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-0 cursor-pointer"
                    onClick={() => navigate(`/learning/course-detail/${course.id}`)}
                  >
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {course.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {renderStars(course.average_rating)}
                            <span className="text-sm text-muted-foreground ml-1">
                              ({course.reviews_count})
                            </span>
                          </div>
                          <div className="text-right">
                            {course.is_free ? (
                              <Badge variant="secondary">Free</Badge>
                            ) : (
                              <span className="font-bold text-lg">${course.price}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{course.enrollments_count} students enrolled</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

export default CreatorPublicProfile;
