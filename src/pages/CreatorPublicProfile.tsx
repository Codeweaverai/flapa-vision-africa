import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, Clock, Globe, Play, MessageCircle, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
  is_creator: boolean;
  role: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  duration_minutes: number;
  difficulty_level: string;
  enrollments_count: number;
  average_rating: number;
  total_reviews: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  is_free: boolean;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  registrations_count: number;
}

interface CreatorStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
  totalEvents: number;
}

const CreatorPublicProfile: React.FC = () => {
  const { id: creatorId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<CreatorStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalReviews: 0,
    totalEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  const fetchCreatorData = async () => {
    if (!creatorId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for better performance
      const [profileResult, coursesResult, eventsResult] = await Promise.allSettled([
        // Fetch creator profile
        supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url, username, is_creator, role')
          .eq('id', creatorId)
          .single(),

        // Fetch creator courses with basic info
        supabase
          .from('courses')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('is_published', true),

        // Fetch creator events
        supabase
          .from('events')
          .select('*')
          .eq('creator_id', creatorId)
      ]);

      // Handle profile data
      if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
        setCreator(profileResult.value.data);
      } else {
        throw new Error('Creator profile not found');
      }

      // Handle courses data
      const coursesData = coursesResult.status === 'fulfilled' && !coursesResult.value.error 
        ? coursesResult.value.data || [] 
        : [];

      // Handle events data  
      const eventsData = eventsResult.status === 'fulfilled' && !eventsResult.value.error
        ? eventsResult.value.data || []
        : [];

      // Fetch additional stats in parallel if we have courses
      if (coursesData.length > 0) {
        const courseIds = coursesData.map(course => course.id);
        
        const [enrollmentsResult, reviewsResult] = await Promise.allSettled([
          // Get all enrollments for all courses at once
          supabase
            .from('course_enrollments')
            .select('course_id, user_id')
            .in('course_id', courseIds),

          // Get all reviews for all courses at once
          supabase
            .from('course_reviews')
            .select('course_id, rating')
            .in('course_id', courseIds)
        ]);

        const enrollments = enrollmentsResult.status === 'fulfilled' && !enrollmentsResult.value.error
          ? enrollmentsResult.value.data || []
          : [];

        const reviews = reviewsResult.status === 'fulfilled' && !reviewsResult.value.error
          ? reviewsResult.value.data || []
          : [];

        // Process courses with stats
        const coursesWithStats = coursesData.map(course => {
          const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
          const courseReviews = reviews.filter(r => r.course_id === course.id);
          
          const enrollmentsCount = courseEnrollments.length;
          const totalReviews = courseReviews.length;
          const averageRating = totalReviews > 0 
            ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

          return {
            ...course,
            enrollments_count: enrollmentsCount,
            average_rating: averageRating,
            total_reviews: totalReviews
          };
        });

        setCourses(coursesWithStats);

        // Calculate overall stats efficiently
        const uniqueStudents = new Set(enrollments.map(e => e.user_id));
        const totalStudents = uniqueStudents.size;
        const allRatings = reviews.map(r => r.rating);
        const overallAverageRating = allRatings.length > 0 
          ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
          : 0;

        setStats({
          totalCourses: coursesWithStats.length,
          totalStudents,
          averageRating: overallAverageRating,
          totalReviews: reviews.length,
          totalEvents: eventsData.length
        });
      } else {
        setCourses([]);
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          averageRating: 0,
          totalReviews: 0,
          totalEvents: eventsData.length
        });
      }

      // Handle events with registrations count if we have events
      if (eventsData.length > 0) {
        const eventIds = eventsData.map(event => event.id);
        
        const { data: registrations } = await supabase
          .from('registrations')
          .select('event_id')
          .in('event_id', eventIds);

        const eventsWithStats = eventsData.map(event => {
          const eventRegistrations = registrations?.filter(r => r.event_id === event.id) || [];
          return {
            ...event,
            registrations_count: eventRegistrations.length
          };
        });

        setEvents(eventsWithStats);
      } else {
        setEvents([]);
      }

    } catch (error) {
      console.error('Error fetching creator data:', error);
      setError('Failed to load creator profile');
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !creatorId || !creator) {
      toast.error('Please log in to send a message');
      return;
    }

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: creatorId,
          subject: `Message to ${creator.full_name}`,
          content: `Hi ${creator.full_name}, I'd like to connect with you!`,
          message_type: 'direct'
        });

      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: creatorId,
          content: `You have a new message from ${user.user_metadata?.full_name || user.email}`,
          type: 'message',
          related_id: creatorId
        });

      toast.success('Message sent successfully!');
      window.location.href = '/inbox';
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const formatEventDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date TBD';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-300 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !creator) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">
                {error || 'Creator Not Found'}
              </h2>
              <p className="text-muted-foreground">
                {error || "The creator profile you're looking for doesn't exist."}
              </p>
              <Button asChild className="mt-4">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 relative overflow-hidden">
        {/* Animated Particles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Creator Header */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={creator?.avatar_url} alt={creator?.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-orange-400 to-purple-600 text-white">
                    {creator?.full_name?.split(' ').map(n => n[0]).join('') || creator?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {creator?.full_name || creator?.username}
                    </h1>
                    {creator?.is_creator && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Verified Creator
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      <span>{stats.totalCourses} Courses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>{stats.totalEvents} Events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{stats.totalStudents} Students</span>
                    </div>
                    {stats.totalReviews > 0 && (
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(stats.averageRating))}
                        <span className="ml-1">
                          {stats.averageRating.toFixed(1)} ({stats.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {creator?.bio && (
                    <p className="text-muted-foreground leading-relaxed max-w-3xl mb-6">
                      {creator.bio}
                    </p>
                  )}

                  {user && user.id !== creatorId && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSendMessage}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Published Courses</h2>
            
            {courses.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">This creator hasn't published any courses yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white/60" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                          {course.title}
                        </h3>
                        <Badge 
                          variant={course.is_free ? "secondary" : "default"}
                          className="ml-2"
                        >
                          {course.is_free ? 'Free' : `$${course.price}`}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        {course.total_reviews > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(Math.round(course.average_rating))}
                            <span className="text-sm text-muted-foreground ml-1">
                              {course.average_rating.toFixed(1)} ({course.total_reviews})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                          <Users className="w-4 h-4" />
                          <span>{course.enrollments_count}</span>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700" asChild>
                        <Link to={`/learning/course-detail/${course.id}`} className="flex items-center justify-center">
                          <Play className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Events Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Published Events</h2>
            
            {events.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground">This creator hasn't published any events yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg overflow-hidden">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white/60" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                          {event.title}
                        </h3>
                        <Badge 
                          variant={event.is_free ? "secondary" : "default"}
                          className="ml-2"
                        >
                          {event.is_free ? 'Free' : `$${event.price}`}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span>{formatEventDate(event.start_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span>{event.registrations_count} registered</span>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700" asChild>
                        <Link to={`/events/${event.id}`} className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Event
                        </Link>
                      </Button>
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
